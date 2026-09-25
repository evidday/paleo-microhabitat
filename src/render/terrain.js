// render/terrain.js — pre-renders the static ground (soil, litter, mud, water, shelter shade) once.
// Uses its own hash noise so it never consumes the game's seeded PRNG.
;(function() {
    'use strict'

    function hash(n) {
        var x = Math.sin(n * 127.1 + 311.7) * 43758.5453
        return x - Math.floor(x)
    }

    function blob(ctx, x, y, r, color, alpha) {
        var g = ctx.createRadialGradient(x, y, 0, x, y, r)
        g.addColorStop(0, color)
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.globalAlpha = alpha
        ctx.fillStyle = g
        ctx.fillRect(x - r, y - r, r * 2, r * 2)
        ctx.globalAlpha = 1
    }

    var terrain = {
        canvas: null,

        build: function(world) {
            var c = document.createElement('canvas')
            c.width = world.w
            c.height = world.h
            var ctx = c.getContext('2d')
            var i

            ctx.fillStyle = '#3c3a27'
            ctx.fillRect(0, 0, world.w, world.h)

            // soil variation
            var soils = ['#4b472e', '#34331f', '#504a2e', '#3a3b28', '#55492d', '#2e3221']
            for (i = 0; i < 650; i++) {
                blob(ctx, hash(i * 3.1) * world.w, hash(i * 7.7) * world.h,
                    70 + hash(i * 1.9) * 220, soils[i % soils.length], 0.42)
            }

            // zone tints: dark home hollow, rocky ridge, lighter open basin
            blob(ctx, 450, 1560, 650, 'rgba(10,16,8,1)', 0.5)
            blob(ctx, 2500, 700, 520, 'rgba(120,112,98,1)', 0.16)
            blob(ctx, 1800, 1350, 700, 'rgba(120,110,60,1)', 0.14)

            // leaf litter flecks
            var flecks = ['#6b5a2f', '#5a3d25', '#2d3b22', '#7a6a3c', '#3f2f1e', '#4d5c33']
            for (i = 0; i < 5200; i++) {
                var fx = hash(i * 2.3 + 1) * world.w, fy = hash(i * 5.1 + 2) * world.h
                ctx.save()
                ctx.translate(fx, fy)
                ctx.rotate(hash(i * 9.9) * 6.28)
                ctx.globalAlpha = 0.25 + hash(i * 4.4) * 0.35
                ctx.fillStyle = flecks[i % flecks.length]
                ctx.beginPath()
                ctx.ellipse(0, 0, 4 + hash(i * 1.3) * 18, 2 + hash(i * 6.1) * 5, 0, 0, 6.28)
                ctx.fill()
                ctx.restore()
            }
            ctx.globalAlpha = 1

            // wet ground: dark glossy mud
            for (i = 0; i < world.wet.length; i++) {
                var w = world.wet[i]
                var g = ctx.createRadialGradient(w.x, w.y, w.r * 0.2, w.x, w.y, w.r * 1.15)
                g.addColorStop(0, 'rgba(22,22,16,0.95)')
                g.addColorStop(0.75, 'rgba(28,27,19,0.85)')
                g.addColorStop(1, 'rgba(28,27,19,0)')
                ctx.fillStyle = g
                ctx.beginPath(); ctx.arc(w.x, w.y, w.r * 1.15, 0, 6.28); ctx.fill()
                // glossy streaks
                ctx.strokeStyle = 'rgba(150,170,150,0.13)'
                ctx.lineWidth = 3
                for (var k = 0; k < 9; k++) {
                    var a = hash(i * 31 + k) * 6.28, rr = w.r * (0.25 + hash(i * 17 + k) * 0.6)
                    ctx.beginPath()
                    ctx.ellipse(w.x + Math.cos(a) * rr * 0.4, w.y + Math.sin(a) * rr * 0.4, rr * 0.35, rr * 0.08, a, 0, 6.28)
                    ctx.stroke()
                }
            }

            // open water core of the big puddle
            var p = world.puddle
            var wg = ctx.createRadialGradient(p.x - 30, p.y - 30, 10, p.x, p.y, p.coreR)
            wg.addColorStop(0, '#4c7376')
            wg.addColorStop(0.7, '#2f4d50')
            wg.addColorStop(1, '#1f3436')
            ctx.fillStyle = wg
            ctx.beginPath(); ctx.arc(p.x, p.y, p.coreR, 0, 6.28); ctx.fill()

            // shelters: dense shade on the ground
            for (i = 0; i < world.shelters.length; i++) {
                var s = world.shelters[i]
                var sg = ctx.createRadialGradient(s.x, s.y, s.r * 0.15, s.x, s.y, s.r * 1.12)
                sg.addColorStop(0, 'rgba(4,8,4,0.6)')
                sg.addColorStop(0.75, 'rgba(6,10,5,0.45)')
                sg.addColorStop(1, 'rgba(6,10,5,0)')
                ctx.fillStyle = sg
                ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 1.12, 0, 6.28); ctx.fill()
            }

            this.canvas = c
            return c
        }
    }

    window.terrain = terrain
})()
