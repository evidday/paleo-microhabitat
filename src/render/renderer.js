// render/renderer.js — composes the frame. Reads state, never writes it.
// Draw order: ground -> shadows -> food -> depth-sorted world -> canopies -> haze/light/vignette.
;(function() {
    'use strict'

    var TILT = 0.75
    var lastT = 0
    var light = 0            // 0 = open, 1 = deep in shelter (smoothed, visual only)
    var debug = typeof location !== 'undefined' && /debug/.test(location.search)

    function resizeCanvas(canvas) {
        var dpr = window.devicePixelRatio || 1
        var w = window.innerWidth, h = window.innerHeight
        if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
            canvas.width = Math.round(w * dpr)
            canvas.height = Math.round(h * dpr)
            canvas.style.width = w + 'px'
            canvas.style.height = h + 'px'
        }
        camera.resize(w, h)
        return dpr
    }

    function nearestDist(state) {
        var p = state.player, pr = state.predator
        return Math.hypot(p.x - pr.x, p.y - pr.y)
    }

    var renderer = {
        render: function(canvas, state, t) {
            var ctx = canvas.getContext('2d')
            var dpr = resizeCanvas(canvas)
            var dt = Math.max(0, Math.min(0.1, t - lastT))
            lastT = t
            var world = state.world, player = state.player, pred = state.predator
            var Z = camera.zoom, W = camera.W, H = camera.H
            var running = state.session.phase !== 'menu'

            if (!terrain.canvas) terrain.build(world)
            camera.follow(state, dt)

            // gentle camera tremor when the predator is heavy and close
            var shake = 0
            if (running && nearestDist(state) < 320 && pred.speedNow > 30) shake = 1.6 * Math.min(1, pred.speedNow / 100)
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.fillStyle = '#17160f'
            ctx.fillRect(0, 0, W, H)
            if (shake) ctx.translate(Math.sin(t * 61) * shake, Math.cos(t * 53) * shake)

            // ground
            ctx.save()
            ctx.translate(W / 2 - camera.x * Z, H / 2 - camera.y * Z * TILT)
            ctx.scale(Z, Z * TILT)
            ctx.drawImage(terrain.canvas, 0, 0)
            // rippling water
            var pd = world.puddle
            ctx.strokeStyle = 'rgba(190,220,215,0.16)'
            ctx.lineWidth = 2
            for (var r = 0; r < 4; r++) {
                var rr = ((t * 14 + r * 40) % 160) + 10
                ctx.beginPath(); ctx.arc(pd.x + Math.sin(r * 5) * 40, pd.y + Math.cos(r * 3) * 30, rr, 0, 6.283); ctx.stroke()
            }
            ctx.restore()

            var i, sx, sy
            // shadows
            var M = 400 * Z
            for (i = 0; i < world.rocks.length; i++) {
                var rk = world.rocks[i]
                if (camera.visible(rk.x, rk.y, M)) creatures.shadow(ctx, camera.sx(rk.x) + 12 * Z, camera.sy(rk.y) + 8 * Z, Z, rk.r * 1.25, rk.r * 1.05, 0.5)
            }
            for (i = 0; i < world.stems.length; i++) {
                var st = world.stems[i]
                if (camera.visible(st[0], st[1], M)) creatures.shadow(ctx, camera.sx(st[0]) + 20 * Z, camera.sy(st[1]) + 6 * Z, Z, 62, 42, 0.45)
            }
            for (i = 0; i < state.npcs.list.length; i++) {
                var sn = state.npcs.list[i]
                if (sn.alive) creatures.shadow(ctx, camera.sx(sn.x), camera.sy(sn.y) + 2 * Z, Z, 13, 10, 0.4)
            }
            if (running) {
                creatures.shadow(ctx, camera.sx(player.x), camera.sy(player.y) + 2 * Z, Z, 15, 11, 0.4)
                var gl = ctx.createRadialGradient(camera.sx(player.x), camera.sy(player.y), 0, camera.sx(player.x), camera.sy(player.y), 46 * Z)
                gl.addColorStop(0, 'rgba(255,236,190,' + (0.12 + 0.12 * light) + ')'); gl.addColorStop(1, 'rgba(255,236,190,0)')
                ctx.fillStyle = gl
                ctx.fillRect(camera.sx(player.x) - 50 * Z, camera.sy(player.y) - 50 * Z, 100 * Z, 100 * Z)
            }
            creatures.shadow(ctx, camera.sx(pred.x) + 20 * Z, camera.sy(pred.y) + 10 * Z, Z, 175, 120, 0.42)

            // food
            for (i = 0; i < state.food.items.length; i++) {
                var f = state.food.items[i]
                if (f.available && camera.visible(f.x, f.y, 100)) creatures.food(ctx, f, camera.sx(f.x), camera.sy(f.y), Z, t)
            }

            // depth-sorted world objects
            var list = []
            var psx = camera.sx(player.x), psy = camera.sy(player.y)
            for (i = 0; i < world.stems.length; i++) if (camera.visible(world.stems[i][0], world.stems[i][1], 700)) list.push({ y: world.stems[i][1], k: 's', i: i })
            for (i = 0; i < world.rocks.length; i++) if (camera.visible(world.rocks[i].x, world.rocks[i].y, M)) list.push({ y: world.rocks[i].y, k: 'r', i: i })
            for (i = 0; i < world.branches.length; i++) {
                var b = world.branches[i]
                if (camera.visible((b.x1 + b.x2) / 2, (b.y1 + b.y2) / 2, 800)) list.push({ y: (b.y1 + b.y2) / 2, k: 'b', i: i })
            }
            for (i = 0; i < world.decor.length; i++) if (camera.visible(world.decor[i].x, world.decor[i].y, 300)) list.push({ y: world.decor[i].y, k: 'd', i: i })
            for (i = 0; i < state.npcs.list.length; i++) list.push({ y: state.npcs.list[i].y, k: 'n', i: i })
            if (running) list.push({ y: player.y, k: 'p' })
            list.push({ y: pred.y + 40, k: 'x' })
            list.sort(function(a, b) { return a.y - b.y })

            var nearShake = (running && nearestDist(state) < 500 && pred.speedNow > 30) ? 1 : 0
            for (i = 0; i < list.length; i++) {
                var o = list[i]
                if (o.k === 's') {
                    var s = world.stems[o.i]
                    sx = camera.sx(s[0]); sy = camera.sy(s[1])
                    var hide = running && Math.abs(psx - sx) < 50 * Z && psy < sy && psy > sy - 900
                    plants.stem(ctx, sx, sy, Z, hide ? 0.42 : 1)
                } else if (o.k === 'r') {
                    var rc = world.rocks[o.i]
                    plants.rock(ctx, camera.sx(rc.x), camera.sy(rc.y), Z, rc.r, o.i + 1)
                } else if (o.k === 'b') {
                    var br = world.branches[o.i]
                    plants.branch(ctx, camera.sx(br.x1), camera.sy(br.y1), camera.sx(br.x2), camera.sy(br.y2), Z, br.r * 0.75)
                } else if (o.k === 'd') {
                    var d = world.decor[o.i]
                    sx = camera.sx(d.x); sy = camera.sy(d.y)
                    if (d.type === 'fern') {
                        var near = running && Math.hypot(psx - sx, psy - sy) < 120 * Z
                        plants.fern(ctx, sx, sy, Z, d.s, d.phase, t, nearShake, near ? 0.55 : 0.95)
                    } else {
                        plants.horsetail(ctx, sx, sy, Z, d.s, d.phase, t, nearShake)
                    }
                } else if (o.k === 'n') {
                    var n = state.npcs.list[o.i]
                    sx = camera.sx(n.x); sy = camera.sy(n.y)
                    if (n.alive) creatures.npc(ctx, n, sx, sy, Z, t, n.sheltered ? 0.75 : 1)
                    else creatures.puff(ctx, sx, sy, Z, n.deadTimer)
                } else if (o.k === 'p') {
                    if (player.alive) creatures.player(ctx, player, psx, psy, Z, t, 1)
                    else creatures.puff(ctx, psx, psy, Z, Math.min(1.2, state.session.time * 0 + 0.3))
                } else {
                    creatures.predator(ctx, pred, camera.sx(pred.x), camera.sy(pred.y), Z, t)
                }
            }

            // shelter canopies float above; see-through when the player is under them
            for (i = 0; i < world.shelters.length; i++) {
                var sh = world.shelters[i]
                if (!camera.visible(sh.x, sh.y - 100, 500 * Z)) continue
                var under = (running && Math.hypot(player.x - sh.x, player.y - sh.y) < sh.r) || Math.hypot(pred.x - sh.x, pred.y - sh.y) < sh.r * 1.2
                plants.canopy(ctx, camera.sx(sh.x), camera.sy(sh.y), Z, sh, under ? 0.5 : 0.93, t)
            }

            // drifting spores
            ctx.fillStyle = 'rgba(220,230,190,0.35)'
            for (i = 0; i < 38; i++) {
                var px = ((i * 137.5 + t * (4 + i % 5)) % (W + 40)) - 20
                var py = ((i * 71.3 + Math.sin(t * 0.3 + i) * 30 + t * (2 + i % 3) * 3) % (H + 40)) - 20
                ctx.beginPath(); ctx.arc(px, py, 1 + (i % 3) * 0.6, 0, 6.283); ctx.fill()
            }

            // haze: distance depth at the top, edge fog
            var hz = ctx.createLinearGradient(0, 0, 0, H * 0.5)
            hz.addColorStop(0, 'rgba(70,96,90,0.28)'); hz.addColorStop(1, 'rgba(70,96,90,0)')
            ctx.fillStyle = hz; ctx.fillRect(0, 0, W, H * 0.5)
            var vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75)
            vg.addColorStop(0, 'rgba(12,18,14,0)'); vg.addColorStop(1, 'rgba(12,18,14,0.6)')
            ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H)

            // sheltered = darker, exposed = brighter
            var targetLight = (running && player.alive && player.sheltered) ? 1 : 0
            light += (targetLight - light) * Math.min(1, dt * 3)
            if (light > 0.01) {
                ctx.fillStyle = 'rgba(2,6,3,' + (0.22 * light) + ')'
                ctx.fillRect(0, 0, W, H)
            }

            // danger cue (support only): edge pulse when the predator is after the player
            if (running && player.alive && pred.targetKind === 'player' && (pred.state === 'TARGET' || pred.state === 'CHASE' || pred.state === 'ATTACK')) {
                var pulse = 0.22 + 0.1 * Math.sin(t * 9)
                var dg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7)
                dg.addColorStop(0, 'rgba(120,30,10,0)'); dg.addColorStop(1, 'rgba(120,30,10,' + pulse + ')')
                ctx.fillStyle = dg; ctx.fillRect(0, 0, W, H)
            }

            if (debug) {
                ctx.fillStyle = '#fff'; ctx.font = '12px monospace'
                ctx.fillText('pred ' + pred.state + ' target=' + pred.targetKind + '#' + pred.targetId + ' enc=' + pred.encounters +
                    ' npcKills=' + state.npcs.killed + ' seed=' + state.seed, 10, H - 10)
                ctx.strokeStyle = 'rgba(255,80,40,0.5)'
                ctx.beginPath(); ctx.ellipse(camera.sx(pred.x), camera.sy(pred.y), config.balance.PREDATOR_DETECTION_RANGE * Z, config.balance.PREDATOR_DETECTION_RANGE * Z * TILT, 0, 0, 6.283); ctx.stroke()
            }
        }
    }

    window.renderer = renderer
})()
