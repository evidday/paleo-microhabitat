// systems/worldSystem.js — static habitat layout + spatial helpers. Owns state.world.
;(function() {
    'use strict'

    var B = config.balance
    var W = config.world
    var scratch = { x: 0, y: 0 }

    var worldSystem = {
        init: function(store) {
            var obstacles = []
            var i, k
            for (i = 0; i < W.rocks.length; i++) {
                obstacles.push({ x: W.rocks[i].x, y: W.rocks[i].y, r: W.rocks[i].r * 0.85 })
            }
            for (i = 0; i < W.stems.length; i++) {
                obstacles.push({ x: W.stems[i][0], y: W.stems[i][1], r: 26 })
            }
            for (i = 0; i < W.branches.length; i++) {   // a branch = a chain of circles
                var b = W.branches[i]
                var len = Math.hypot(b.x2 - b.x1, b.y2 - b.y1)
                var n = Math.ceil(len / (b.r * 1.1))
                for (k = 0; k <= n; k++) {
                    obstacles.push({ x: b.x1 + (b.x2 - b.x1) * k / n, y: b.y1 + (b.y2 - b.y1) * k / n, r: b.r })
                }
            }

            var decor = []   // decorative plants (no collision), seeded so layouts repeat per seed
            for (i = 0; i < W.decorCount; i++) {
                decor.push({
                    type: store.prng.next(0, 2) === 0 ? 'horsetail' : 'fern',
                    x: store.prng.next(60, B.WORLD_W - 60),
                    y: store.prng.next(60, B.WORLD_H - 60),
                    s: store.prng.next(70, 130) / 100,
                    phase: store.prng.next(0, 628) / 100
                })
            }

            store.state.world = {
                w: B.WORLD_W, h: B.WORLD_H,
                shelters: W.shelters, rocks: W.rocks, stems: W.stems, branches: W.branches,
                puddle: W.puddle, wet: W.wet, obstacles: obstacles, decor: decor
            }
        },

        update: function() {},

        // the shelter containing point (x, y), or null
        shelterAt: function(world, x, y) {
            for (var i = 0; i < world.shelters.length; i++) {
                var s = world.shelters[i]
                var dx = x - s.x, dy = y - s.y
                if (dx * dx + dy * dy <= s.r * s.r) return s
            }
            return null
        },

        inWet: function(world, x, y) {
            for (var i = 0; i < world.wet.length; i++) {
                var w = world.wet[i]
                var dx = x - w.x, dy = y - w.y
                if (dx * dx + dy * dy <= w.r * w.r) return true
            }
            return false
        },

        // push a circle of radius r out of obstacles and keep it inside the world.
        // Returns a shared scratch object {x, y} — copy values immediately.
        resolve: function(world, x, y, r) {
            for (var pass = 0; pass < 2; pass++) {
                for (var i = 0; i < world.obstacles.length; i++) {
                    var o = world.obstacles[i]
                    var dx = x - o.x, dy = y - o.y
                    var min = o.r + r
                    var d2 = dx * dx + dy * dy
                    if (d2 < min * min) {
                        var d = Math.sqrt(d2) || 0.001
                        x = o.x + dx / d * min
                        y = o.y + dy / d * min
                    }
                }
            }
            scratch.x = Math.max(30, Math.min(world.w - 30, x))
            scratch.y = Math.max(30, Math.min(world.h - 30, y))
            return scratch
        }
    }

    window.worldSystem = worldSystem
})()
