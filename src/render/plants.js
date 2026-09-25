// render/plants.js — procedural vegetation, rocks, branches, shelter canopies. Visual only.
// Every function draws in screen space at (sx, sy) = the object's base on the ground, scaled by Z.
;(function() {
    'use strict'

    var TILT = 0.75

    function hash(n) {
        var x = Math.sin(n * 127.1 + 311.7) * 43758.5453
        return x - Math.floor(x)
    }

    var plants = {
        // big lycopod trunk: taller than the screen, diamond bark scars
        stem: function(ctx, sx, sy, Z, alpha) {
            var w = 30 * Z
            var top = -80
            ctx.save()
            ctx.globalAlpha = alpha
            // root flare
            ctx.fillStyle = '#2a2016'
            ctx.beginPath(); ctx.ellipse(sx, sy, w * 1.5, w * 0.55, 0, 0, 6.28); ctx.fill()
            var g = ctx.createLinearGradient(sx - w, 0, sx + w, 0)
            g.addColorStop(0, '#75623f')
            g.addColorStop(0.45, '#4d3d28')
            g.addColorStop(1, '#241b12')
            ctx.fillStyle = g
            ctx.beginPath()
            ctx.moveTo(sx - w * 1.15, sy)
            ctx.lineTo(sx - w * 0.85, top)
            ctx.lineTo(sx + w * 0.85, top)
            ctx.lineTo(sx + w * 1.15, sy)
            ctx.ellipse(sx, sy, w * 1.15, w * 0.4, 0, 0, Math.PI)
            ctx.fill()
            // diamond leaf-scar pattern
            var step = 28 * Z
            ctx.strokeStyle = 'rgba(20,14,8,0.5)'
            ctx.lineWidth = 1.5 * Z
            ctx.beginPath()
            var row = 0
            for (var y = sy - step * 0.5; y > top; y -= step, row++) {
                var off = (row % 2) * w * 0.5
                for (var x = sx - w * 0.9 + off; x < sx + w * 0.9; x += w) {
                    ctx.moveTo(x, y); ctx.lineTo(x + w * 0.25, y - step * 0.5)
                    ctx.lineTo(x + w * 0.5, y); ctx.lineTo(x + w * 0.25, y + step * 0.5); ctx.lineTo(x, y)
                }
            }
            ctx.stroke()
            ctx.restore()
        },

        horsetail: function(ctx, sx, sy, Z, s, phase, t, shake) {
            var n = 9
            var seg = 30 * s * Z
            var sway = (Math.sin(t * 0.9 + phase) * 5 + Math.sin(t * 23 + phase) * shake * 3) * Z
            var px = sx, py = sy
            ctx.lineCap = 'round'
            for (var i = 1; i <= n; i++) {
                var f = i / n
                var nx = sx + sway * f * f
                var ny = sy - seg * i
                ctx.strokeStyle = i % 2 ? '#65744a' : '#7d8a5c'
                ctx.lineWidth = (8 - f * 3) * Z * s
                ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(nx, ny); ctx.stroke()
                // whorl of spikes at the node
                ctx.strokeStyle = '#4d5a38'
                ctx.lineWidth = 1.5 * Z
                var L = (14 - f * 6) * Z * s
                ctx.beginPath()
                for (var k = -2; k <= 2; k++) {
                    if (k === 0) continue
                    ctx.moveTo(nx, ny); ctx.lineTo(nx + k * L * 0.5, ny - L * (1 - Math.abs(k) * 0.2))
                }
                ctx.stroke()
                px = nx; py = ny
            }
        },

        fern: function(ctx, sx, sy, Z, s, phase, t, shake, alpha) {
            var fronds = 7
            var L = 150 * s * Z
            ctx.save()
            ctx.globalAlpha = alpha
            ctx.lineCap = 'round'
            for (var i = 0; i < fronds; i++) {
                var a = -Math.PI + (i + 0.5) * Math.PI / fronds
                a += Math.sin(t * 1.1 + phase + i) * (0.04 + shake * 0.05)
                var ex = sx + Math.cos(a) * L
                var ey = sy + Math.sin(a) * L * 0.85 + L * 0.2 * (Math.abs(Math.cos(a)))   // tips droop
                var cx = sx + Math.cos(a) * L * 0.45
                var cy = sy + Math.sin(a) * L * 0.95
                ctx.strokeStyle = i % 2 ? '#385226' : '#476a30'
                ctx.lineWidth = 3.5 * Z * s
                ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke()
                ctx.lineWidth = 1.6 * Z
                ctx.beginPath()
                for (var u = 0.22; u < 0.97; u += 0.085) {
                    var qx = (1 - u) * (1 - u) * sx + 2 * (1 - u) * u * cx + u * u * ex
                    var qy = (1 - u) * (1 - u) * sy + 2 * (1 - u) * u * cy + u * u * ey
                    var tx = 2 * (1 - u) * (cx - sx) + 2 * u * (ex - cx)
                    var ty = 2 * (1 - u) * (cy - sy) + 2 * u * (ey - cy)
                    var tl = Math.hypot(tx, ty) || 1
                    var nxv = -ty / tl, nyv = tx / tl
                    var ll = (1 - u) * 0.3 * L + 5 * Z
                    ctx.moveTo(qx, qy); ctx.lineTo(qx + nxv * ll + tx / tl * ll * 0.5, qy + nyv * ll + ty / tl * ll * 0.5)
                    ctx.moveTo(qx, qy); ctx.lineTo(qx - nxv * ll + tx / tl * ll * 0.5, qy - nyv * ll + ty / tl * ll * 0.5)
                }
                ctx.stroke()
            }
            ctx.restore()
        },

        // upright lump of rock: a landmark
        rock: function(ctx, sx, sy, Z, r, seed) {
            var R = r * Z
            var N = 12, i
            var pts = []
            for (i = 0; i < N; i++) {
                var ang = i / N * 6.283
                var rad = R * (0.85 + hash(seed * 13 + i) * 0.3)
                var px = sx + Math.cos(ang) * rad
                var s = Math.sin(ang)
                var py = s > 0 ? sy + s * rad * 0.55 * TILT / 0.75 * 0.75 : sy + s * rad * 1.05
                pts.push([px, py])
            }
            var g = ctx.createLinearGradient(sx - R, sy - R, sx + R * 0.8, sy + R * 0.5)
            g.addColorStop(0, '#9a9384'); g.addColorStop(0.5, '#665f53'); g.addColorStop(1, '#2f2b26')
            ctx.fillStyle = g
            ctx.beginPath()
            ctx.moveTo(pts[0][0], pts[0][1])
            for (i = 1; i <= N; i++) {
                var a = pts[i % N], b = pts[(i + 1) % N]
                ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
            }
            ctx.closePath(); ctx.fill()
            ctx.strokeStyle = 'rgba(20,18,15,0.55)'; ctx.lineWidth = 2 * Z
            ctx.beginPath()
            ctx.moveTo(sx - R * 0.3, sy - R * 0.8); ctx.lineTo(sx - R * 0.1, sy - R * 0.2); ctx.lineTo(sx - R * 0.35, sy + R * 0.2)
            ctx.moveTo(sx + R * 0.35, sy - R * 0.6); ctx.lineTo(sx + R * 0.2, sy - R * 0.1)
            ctx.stroke()
            ctx.fillStyle = 'rgba(70,95,50,0.5)'   // moss on top
            ctx.beginPath(); ctx.ellipse(sx - R * 0.15, sy - R * 0.85, R * 0.5, R * 0.16, -0.2, 0, 6.28); ctx.fill()
            ctx.beginPath(); ctx.ellipse(sx + R * 0.4, sy - R * 0.55, R * 0.25, R * 0.09, 0.3, 0, 6.28); ctx.fill()
        },

        // fallen branch between two screen points
        branch: function(ctx, x1, y1, x2, y2, Z, r) {
            var wd = r * 2 * Z
            ctx.lineCap = 'round'
            ctx.strokeStyle = '#2a1f15'; ctx.lineWidth = wd
            ctx.beginPath(); ctx.moveTo(x1, y1 + wd * 0.12); ctx.lineTo(x2, y2 + wd * 0.12); ctx.stroke()
            ctx.strokeStyle = '#4f3c27'; ctx.lineWidth = wd * 0.82
            ctx.beginPath(); ctx.moveTo(x1, y1 - wd * 0.06); ctx.lineTo(x2, y2 - wd * 0.06); ctx.stroke()
            ctx.strokeStyle = '#7a6244'; ctx.lineWidth = wd * 0.16
            ctx.beginPath(); ctx.moveTo(x1, y1 - wd * 0.28); ctx.lineTo(x2, y2 - wd * 0.28); ctx.stroke()
            // bark ridges
            ctx.strokeStyle = 'rgba(20,14,8,0.5)'; ctx.lineWidth = 2 * Z
            var len = Math.hypot(x2 - x1, y2 - y1), n = Math.floor(len / (22 * Z))
            ctx.beginPath()
            for (var i = 1; i < n; i++) {
                var f = i / n, bx = x1 + (x2 - x1) * f, by = y1 + (y2 - y1) * f
                ctx.moveTo(bx, by - wd * 0.3); ctx.lineTo(bx + 4 * Z, by + wd * 0.22)
            }
            ctx.stroke()
        },

        // shelter canopy floats above the ground shelter circle; kind = leaf | bark | root
        canopy: function(ctx, sx, sy, Z, shelter, alpha, t) {
            var R = shelter.r * Z
            var lift = 105 * Z
            var cx = sx, cy = sy - lift
            ctx.save()
            ctx.globalAlpha = alpha
            var i
            if (shelter.kind === 'leaf') {
                for (i = 0; i < 3; i++) {
                    var ang = -0.5 + i * 0.55 + Math.sin(t * 0.6 + i) * 0.015
                    ctx.save()
                    ctx.translate(cx + (i - 1) * R * 0.35, cy + (i % 2) * R * 0.12)
                    ctx.rotate(ang)
                    var rx = R * 0.95, ry = R * 0.36
                    var g = ctx.createLinearGradient(0, -ry, 0, ry)
                    g.addColorStop(0, i === 1 ? '#3d6a2c' : '#345a26'); g.addColorStop(1, '#1b3316')
                    ctx.fillStyle = g
                    ctx.beginPath()
                    ctx.moveTo(-rx, 0); ctx.quadraticCurveTo(0, -ry * 1.5, rx, 0); ctx.quadraticCurveTo(0, ry * 1.5, -rx, 0)
                    ctx.fill()
                    ctx.strokeStyle = 'rgba(150,190,110,0.35)'; ctx.lineWidth = 2.5 * Z
                    ctx.beginPath(); ctx.moveTo(-rx, 0); ctx.lineTo(rx, 0)
                    for (var v = -0.7; v <= 0.71; v += 0.28) {
                        ctx.moveTo(rx * v, 0); ctx.lineTo(rx * (v + 0.28), -ry * 0.9 * (1 - Math.abs(v) * 0.6))
                        ctx.moveTo(rx * v, 0); ctx.lineTo(rx * (v + 0.28), ry * 0.9 * (1 - Math.abs(v) * 0.6))
                    }
                    ctx.stroke()
                    ctx.restore()
                }
            } else if (shelter.kind === 'bark') {
                for (i = 0; i < 2; i++) {
                    ctx.save()
                    ctx.translate(cx + (i ? R * 0.3 : -R * 0.25), cy + (i ? R * 0.1 : 0))
                    ctx.rotate(i ? 0.25 : -0.2)
                    var bw = R * 0.9, bh = R * 0.42
                    var bg = ctx.createLinearGradient(0, -bh, 0, bh)
                    bg.addColorStop(0, '#5d4630'); bg.addColorStop(1, '#22180f')
                    ctx.fillStyle = bg
                    ctx.beginPath()
                    ctx.moveTo(-bw, -bh * 0.5); ctx.lineTo(bw * 0.9, -bh); ctx.lineTo(bw, bh * 0.6); ctx.lineTo(-bw * 0.8, bh); ctx.closePath()
                    ctx.fill()
                    ctx.strokeStyle = 'rgba(15,10,6,0.6)'; ctx.lineWidth = 2.5 * Z
                    ctx.beginPath()
                    for (var k = -0.6; k < 0.7; k += 0.25) { ctx.moveTo(bw * k, -bh * 0.9); ctx.lineTo(bw * k + 6 * Z, bh * 0.9) }
                    ctx.stroke()
                    ctx.restore()
                }
            } else {   // root arch
                ctx.lineCap = 'round'
                for (i = 0; i < 4; i++) {
                    var ox = (i - 1.5) * R * 0.42
                    ctx.strokeStyle = i % 2 ? '#3a2a1a' : '#4f3a24'
                    ctx.lineWidth = (26 - i * 3) * Z
                    ctx.beginPath()
                    ctx.moveTo(sx + ox * 1.6, sy + R * 0.25)
                    ctx.bezierCurveTo(sx + ox * 1.2, cy - R * 0.3, sx + ox * 0.5, cy - R * 0.45, cx + ox * 0.25, cy + R * 0.02)
                    ctx.stroke()
                }
                ctx.strokeStyle = 'rgba(120,150,90,0.4)'; ctx.lineWidth = 3 * Z
                ctx.beginPath(); ctx.moveTo(cx - R * 0.6, cy - R * 0.2); ctx.quadraticCurveTo(cx, cy - R * 0.55, cx + R * 0.6, cy - R * 0.2); ctx.stroke()
            }
            ctx.restore()
        }
    }

    window.plants = plants
})()
