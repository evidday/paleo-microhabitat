// render/creatures.js — procedural creature drawings. Visual only, replaceable by sprites later.
// Each drawer takes (ctx, entity, sx, sy, Z, t, ...) and draws a creature facing along entity.heading.
;(function() {
    'use strict'

    var TILT = 0.75

    function begin(ctx, sx, sy, Z, heading) {
        ctx.save()
        ctx.translate(sx, sy)
        ctx.scale(Z, Z * TILT)      // flattened onto the ground plane
        ctx.rotate(heading)
    }

    function ell(ctx, x, y, rx, ry, fill, stroke, lw) {
        ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 6.283)
        if (fill) { ctx.fillStyle = fill; ctx.fill() }
        if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke() }
    }

    var creatures = {
        // soft blob shadow on the ground (drawn before upright things)
        shadow: function(ctx, sx, sy, Z, rx, ry, alpha) {
            ctx.save()
            ctx.translate(sx, sy)
            ctx.scale(Z, Z * TILT)
            var g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx)
            g.addColorStop(0, 'rgba(0,0,0,' + alpha + ')')
            g.addColorStop(1, 'rgba(0,0,0,0)')
            ctx.fillStyle = g
            ctx.scale(1, ry / rx)
            ctx.beginPath(); ctx.arc(0, 0, rx, 0, 6.283); ctx.fill()
            ctx.restore()
        },

        // the player: long amber body, six scuttling legs, two long antennae
        player: function(ctx, p, sx, sy, Z, t, alpha) {
            begin(ctx, sx, sy, Z, p.heading)
            ctx.globalAlpha = alpha
            var moving = Math.hypot(p.vx, p.vy) > 10
            var i, side
            ctx.strokeStyle = '#4a2f16'; ctx.lineWidth = 1.6; ctx.lineCap = 'round'
            for (i = 0; i < 3; i++) {
                for (side = -1; side <= 1; side += 2) {
                    var sw = moving ? Math.sin(p.anim * 1.8 + i * 2.1 + (side > 0 ? 3.14 : 0)) * 3.5 : 0
                    var hx = -4 + i * 4.5
                    ctx.beginPath()
                    ctx.moveTo(hx, side * 2.5); ctx.lineTo(hx + sw * 0.5, side * 6.5); ctx.lineTo(hx + sw + 1, side * 9.5)
                    ctx.stroke()
                }
            }
            ell(ctx, -6.5, 0, 6.5, 5.3, '#a67a3e', '#4a2f16', 1)
            ell(ctx, 0, 0, 6.8, 5.6, '#c99a52', '#4a2f16', 1)
            ell(ctx, 7, 0, 4.6, 4, '#d8b070', '#4a2f16', 1)
            ell(ctx, -1.5, -1.6, 4, 1.6, 'rgba(255,235,190,0.55)')          // rim light
            ctx.strokeStyle = '#4a2f16'; ctx.lineWidth = 1
            var wig = Math.sin(t * 6 + p.anim) * 1.5
            ctx.beginPath()
            ctx.moveTo(10, -1.5); ctx.quadraticCurveTo(15, -4 + wig, 21, -6 + wig)
            ctx.moveTo(10, 1.5); ctx.quadraticCurveTo(15, 4 - wig, 21, 6 - wig)
            ctx.stroke()
            ctx.restore()
        },

        // small grazer: round pale-green shell, short antennae, stubby legs, hesitant bob
        npc: function(ctx, n, sx, sy, Z, t, alpha) {
            begin(ctx, sx, sy, Z, n.heading)
            ctx.globalAlpha = alpha
            var i, side
            var bob = Math.sin(n.anim * 2.4) * 0.5
            ctx.strokeStyle = '#33402b'; ctx.lineWidth = 1.3; ctx.lineCap = 'round'
            for (i = 0; i < 2; i++) {
                for (side = -1; side <= 1; side += 2) {
                    var sw = Math.sin(n.anim * 2.4 + i * 3 + (side > 0 ? 3.14 : 0)) * 2 * Math.min(1, n.speedNow / 30)
                    ctx.beginPath(); ctx.moveTo(-1 + i * 5, side * 4); ctx.lineTo(-1 + i * 5 + sw, side * 8); ctx.stroke()
                }
            }
            ell(ctx, 0, bob * 0.3, 8, 6.8, '#a6b598', '#33402b', 1)
            ell(ctx, -1, -1.2 + bob * 0.3, 5.4, 3.6, '#c3ceb3')
            ctx.strokeStyle = '#4f5f44'; ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.moveTo(-2, -5); ctx.lineTo(-2, 5); ctx.stroke()
            ell(ctx, 8.5, 0, 2.6, 2.4, '#8b9a7d', '#33402b', 0.8)
            ctx.strokeStyle = '#33402b'
            ctx.beginPath(); ctx.moveTo(10, -1); ctx.lineTo(13, -3); ctx.moveTo(10, 1); ctx.lineTo(13, 3); ctx.stroke()
            ctx.restore()
        },

        // spore puff where a creature was caught (soft, PEGI 7)
        puff: function(ctx, sx, sy, Z, age) {
            var f = Math.min(1, age / 1.2)
            ctx.save()
            ctx.translate(sx, sy)
            ctx.scale(Z, Z * TILT)
            ctx.globalAlpha = (1 - f) * 0.8
            for (var i = 0; i < 9; i++) {
                var a = i * 0.7, r = f * (14 + i * 2)
                ctx.fillStyle = i % 2 ? '#d8ddb8' : '#b7c39a'
                ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r - f * 12, 3 + (1 - f) * 3, 0, 6.283); ctx.fill()
            }
            ctx.restore()
        },

        // glowing spore beads
        food: function(ctx, f, sx, sy, Z, t) {
            var big = f.kind === 'large'
            var pulse = 0.75 + Math.sin(t * 2 + f.id * 1.7) * 0.25
            ctx.save()
            ctx.translate(sx, sy)
            ctx.scale(Z, Z * TILT)
            var R = big ? 44 : 28
            var g = ctx.createRadialGradient(0, 0, 0, 0, 0, R)
            g.addColorStop(0, 'rgba(255,214,130,' + (0.34 * pulse) + ')')
            g.addColorStop(1, 'rgba(255,214,130,0)')
            ctx.fillStyle = g
            ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.283); ctx.fill()
            var n = big ? 7 : 4
            for (var i = 0; i < n; i++) {
                var a = i * 2.4 + f.id, d = i === 0 ? 0 : (big ? 9 : 6)
                var px = Math.cos(a) * d, py = Math.sin(a) * d - (i % 2) * 2
                var r = big ? 5.5 : 4
                var bg = ctx.createRadialGradient(px - r * 0.3, py - r * 0.3, 0, px, py, r)
                bg.addColorStop(0, '#fbeec2'); bg.addColorStop(1, '#c38b3c')
                ctx.fillStyle = bg
                ctx.beginPath(); ctx.arc(px, py, r, 0, 6.283); ctx.fill()
            }
            ctx.restore()
        },

        // the predator: ~230 long armoured many-legged hunter with mandibles
        predator: function(ctx, pr, sx, sy, Z, t) {
            begin(ctx, sx, sy, Z, pr.heading)
            var st = pr.state
            var i, side
            var gait = pr.anim * 2.2
            var fast = st === 'CHASE' || st === 'ATTACK'
            var amp = (st === 'EAT' || st === 'TARGET') ? 3 : (fast ? 20 : 12) * Math.min(1, 0.3 + pr.speedNow / 40)

            // legs
            ctx.lineCap = 'round'; ctx.lineJoin = 'round'
            for (i = 0; i < 7; i++) {
                for (side = -1; side <= 1; side += 2) {
                    var sw = Math.sin(gait + i * 0.9 + (side > 0 ? 3.14 : 0)) * amp
                    var hx = -80 + i * 26
                    ctx.strokeStyle = '#231410'; ctx.lineWidth = 8
                    ctx.beginPath(); ctx.moveTo(hx, side * 22); ctx.lineTo(hx + sw * 0.6 + 4, side * 54); ctx.lineTo(hx + sw + 8, side * 84); ctx.stroke()
                    ctx.strokeStyle = '#5a3a2a'; ctx.lineWidth = 3
                    ctx.beginPath(); ctx.moveTo(hx, side * 22); ctx.lineTo(hx + sw * 0.6 + 4, side * 54); ctx.stroke()
                }
            }

            // segmented armoured body, tail to head
            var segs = [[-100, 24, 28], [-68, 30, 40], [-32, 32, 45], [6, 31, 43], [42, 27, 35], [74, 22, 27]]
            var slow = fast ? 0 : 1
            for (i = 0; i < segs.length; i++) {
                var s = segs[i]
                var yo = Math.sin(pr.anim * 1.6 + s[0] * 0.04) * (fast ? 5 : 3) * slow
                var g = ctx.createLinearGradient(0, -s[2], 0, s[2])
                g.addColorStop(0, '#6a4638'); g.addColorStop(0.5, '#3f2721'); g.addColorStop(1, '#22130f')
                ctx.beginPath(); ctx.ellipse(s[0], yo, s[1], s[2], 0, 0, 6.283)
                ctx.fillStyle = g; ctx.fill()
                ctx.strokeStyle = '#a06a44'; ctx.lineWidth = 2.5; ctx.stroke()
                ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2
                ctx.beginPath(); ctx.moveTo(s[0] - 5, yo - s[2] * 0.7); ctx.lineTo(s[0] + 5, yo + s[2] * 0.7); ctx.stroke()
            }

            // mandibles
            var open = st === 'ATTACK' ? 1 : (st === 'EAT' ? 0.4 + 0.4 * Math.sin(t * 11) : (fast ? 0.55 : 0.18))
            ctx.strokeStyle = '#b08050'; ctx.lineWidth = 8
            for (side = -1; side <= 1; side += 2) {
                ctx.beginPath()
                ctx.moveTo(90, side * 9)
                ctx.quadraticCurveTo(122, side * (12 + open * 28), 132, side * (open * 22 + 2))
                ctx.stroke()
            }
            // antennae: point at the target while TARGET, otherwise sweep
            ctx.strokeStyle = '#6a4a34'; ctx.lineWidth = 2.5
            var pointAng = 0
            if (st === 'TARGET' || fast) pointAng = Math.atan2(pr.ty - pr.y, pr.tx - pr.x) - pr.heading
            for (side = -1; side <= 1; side += 2) {
                var base = st === 'TARGET' || fast ? pointAng + side * 0.18 : side * (0.5 + Math.sin(t * 1.4 + side) * 0.2)
                ctx.beginPath()
                ctx.moveTo(88, side * 12)
                ctx.quadraticCurveTo(88 + Math.cos(base) * 45, side * 12 + Math.sin(base) * 45, 88 + Math.cos(base) * 95, side * 12 + Math.sin(base) * 95)
                ctx.stroke()
            }
            ctx.fillStyle = '#f0c070'
            ctx.beginPath(); ctx.arc(84, -14, 4, 0, 6.283); ctx.arc(84, 14, 4, 0, 6.283); ctx.fill()
            ctx.restore()
        }
    }

    window.creatures = creatures
})()
