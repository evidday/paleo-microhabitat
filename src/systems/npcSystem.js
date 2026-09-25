// systems/npcSystem.js — small autonomous creatures. Owns state.npcs.
// States: WANDER, SEEK_FOOD, EAT, FLEE, SEEK_SHELTER, DEAD (alive=false).
;(function() {
    'use strict'

    var B = config.balance
    var ws = window.worldSystem
    var fs = window.foodSystem

    function angleLerp(a, b, t) {
        return a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t
    }

    function makeNpc(state, id, x, y, energy, speedMul) {
        return {
            id: id, x: x, y: y, vx: 0, vy: 0, heading: 0, anim: 0, speedNow: 0,
            state: 'WANDER', alive: true, deadTimer: 0,
            energy: energy, speedMul: speedMul, sheltered: false,
            detectionMultiplier: 1,
            timer: 0, walkT: 0, fleeTimer: 0, tx: null, ty: null, eatId: -1
        }
    }

    function dangerRadius(predState) {
        if (predState === 'TARGET' || predState === 'CHASE' || predState === 'ATTACK') return B.NPC_DANGER_RADIUS_ALERT
        if (predState === 'SEARCH') return B.NPC_DANGER_RADIUS_SEARCH
        return B.NPC_DANGER_RADIUS_CALM
    }

    // move toward a direction with smoothing, collide with obstacles
    function steer(state, n, dirx, diry, speed, dt) {
        var len = Math.hypot(dirx, diry)
        var tx = 0, ty = 0
        if (len > 0.0001 && speed > 0) { tx = dirx / len * speed; ty = diry / len * speed }
        var k = Math.min(1, dt * 6)
        n.vx += (tx - n.vx) * k
        n.vy += (ty - n.vy) * k
        var r = ws.resolve(state.world, n.x + n.vx * dt, n.y + n.vy * dt, B.NPC_RADIUS)
        n.x = r.x
        n.y = r.y
        n.speedNow = Math.hypot(n.vx, n.vy)
        if (n.speedNow > 6) n.heading = angleLerp(n.heading, Math.atan2(n.vy, n.vx), Math.min(1, dt * 8))
        n.anim += n.speedNow * dt / 6 + dt * 1.2
    }

    // nearest shelter that is closer to the creature than to the predator
    function bestShelter(state, n, pred) {
        var best = null, bestD = 700
        var list = state.world.shelters
        for (var i = 0; i < list.length; i++) {
            var s = list[i]
            var dS = Math.hypot(s.x - n.x, s.y - n.y)
            var dP = Math.hypot(s.x - pred.x, s.y - pred.y)
            if (dS < bestD && dS < dP) { bestD = dS; best = s }
        }
        return best
    }

    var npcSystem = {
        init: function(store) {
            var np = { list: [], killed: 0, nextId: 0, migrationTimer: 0, events: [] }
            store.state.npcs = np
            var spots = config.world.food
            for (var i = 0; i < B.NPC_COUNT; i++) {
                var spot = spots[store.prng.next(0, spots.length - 1)]
                var a = store.prng.next(0, 628) / 100
                var d = store.prng.next(120, 350)
                var r = ws.resolve(store.state.world, spot.x + Math.cos(a) * d, spot.y + Math.sin(a) * d, B.NPC_RADIUS)
                np.list.push(makeNpc(store.state, np.nextId++, r.x, r.y,
                    store.prng.next(40, 100), store.prng.next(80, 120) / 100))
                np.list[i].heading = a
            }

            store.register('NPC_DIED', function(state, p) {
                for (var i = 0; i < state.npcs.list.length; i++) {
                    var n = state.npcs.list[i]
                    if (n.id === p.id && n.alive) { n.alive = false; n.state = 'DEAD'; n.deadTimer = 0; state.npcs.killed++ }
                }
            }, 'npcs')

            store.register('NPC_ATE', function(state, p) {
                for (var i = 0; i < state.npcs.list.length; i++) {
                    var n = state.npcs.list[i]
                    if (n.id === p.id) n.energy = Math.min(100, n.energy + B.NPC_FOOD_ENERGY)
                }
            }, 'npcs.list')

            store.register('NPC_SPAWN', function(state) {
                var side = store.prng.next(0, 3)
                var x, y
                if (side === 0) { x = store.prng.next(200, state.world.w - 200); y = 45 }
                else if (side === 1) { x = state.world.w - 45; y = store.prng.next(200, state.world.h - 200) }
                else if (side === 2) { x = store.prng.next(200, state.world.w - 200); y = state.world.h - 45 }
                else { x = 45; y = store.prng.next(200, state.world.h - 200) }
                var n = makeNpc(state, state.npcs.nextId++, x, y, store.prng.next(40, 90), store.prng.next(80, 120) / 100)
                n.heading = Math.atan2(state.world.h / 2 - y, state.world.w / 2 - x)
                state.npcs.list.push(n)
            }, 'npcs.list')
        },

        update: function(state, dt) {
            var np = state.npcs
            var pred = state.predator
            var alive = 0

            for (var i = 0; i < np.list.length; i++) {
                var n = np.list[i]
                if (!n.alive) { n.deadTimer += dt; continue }
                alive++

                n.energy = Math.max(0, n.energy - B.NPC_ENERGY_DRAIN * dt)
                n.sheltered = !!ws.shelterAt(state.world, n.x, n.y)

                var dx = n.x - pred.x, dy = n.y - pred.y
                var d = Math.hypot(dx, dy) || 0.001
                if (d < dangerRadius(pred.state)) n.fleeTimer = 1.0

                // FLEE / SEEK_SHELTER: danger beats everything
                if (n.fleeTimer > 0) {
                    n.fleeTimer -= dt
                    var s = bestShelter(state, n, pred)
                    if (s && n.sheltered && Math.hypot(s.x - n.x, s.y - n.y) < s.r * 0.8) {
                        n.state = 'SEEK_SHELTER'
                        steer(state, n, 0, 0, 0, dt)                  // hide and hold still
                    } else if (s) {
                        n.state = 'SEEK_SHELTER'
                        var sd = Math.hypot(s.x - n.x, s.y - n.y) || 1
                        steer(state, n, dx / d + (s.x - n.x) / sd * 1.6, dy / d + (s.y - n.y) / sd * 1.6,
                            B.NPC_FLEE_SPEED, dt)
                    } else {
                        n.state = 'FLEE'
                        steer(state, n, dx / d, dy / d, B.NPC_FLEE_SPEED, dt)
                    }
                    n.tx = null
                    continue
                }
                if (n.state === 'FLEE' || n.state === 'SEEK_SHELTER') { n.state = 'WANDER'; n.timer = 0.6 }

                if (n.state === 'EAT') {
                    steer(state, n, 0, 0, 0, dt)
                    n.timer -= dt
                    if (n.timer <= 0) {
                        var item = state.food.items[n.eatId]
                        if (item && item.available) {
                            np.events.push({ type: 'NPC_ATE', payload: { id: n.id } })
                            np.events.push({ type: 'FOOD_CONSUMED', payload: { id: n.eatId } })
                        }
                        n.state = 'WANDER'
                        n.timer = 1
                    }
                    continue
                }

                if (n.energy < B.NPC_HUNGRY_BELOW) {
                    var f = fs.nearestAvailable(state, n.x, n.y, 900)
                    if (f) {
                        n.state = 'SEEK_FOOD'
                        if (Math.hypot(f.x - n.x, f.y - n.y) < 16) {
                            n.state = 'EAT'; n.timer = 1.2; n.eatId = f.id
                        } else {
                            steer(state, n, f.x - n.x, f.y - n.y, B.NPC_SPEED * n.speedMul, dt)
                        }
                        continue
                    }
                }

                // WANDER with pauses
                n.state = 'WANDER'
                if (n.timer > 0) {
                    n.timer -= dt
                    steer(state, n, 0, 0, 0, dt)
                } else {
                    if (n.tx === null) {
                        var a = store.prng.next(0, 628) / 100
                        var len = store.prng.next(80, 260)
                        n.tx = Math.max(60, Math.min(state.world.w - 60, n.x + Math.cos(a) * len))
                        n.ty = Math.max(60, Math.min(state.world.h - 60, n.y + Math.sin(a) * len))
                        n.walkT = 0
                    }
                    n.walkT += dt
                    steer(state, n, n.tx - n.x, n.ty - n.y, B.NPC_SPEED * n.speedMul * 0.7, dt)
                    if (Math.hypot(n.tx - n.x, n.ty - n.y) < 18 || n.walkT > 6) {
                        n.tx = null
                        n.timer = store.prng.next(5, 25) / 10
                    }
                }
            }

            // remove the dead once their puff has played
            for (var k = np.list.length - 1; k >= 0; k--) {
                if (!np.list[k].alive && np.list[k].deadTimer > 1.2) np.list.splice(k, 1)
            }

            // migration keeps the ecosystem populated
            if (alive < B.NPC_COUNT) {
                np.migrationTimer += dt
                if (np.migrationTimer >= B.NPC_MIGRATION_INTERVAL) {
                    np.migrationTimer = 0
                    np.events.push({ type: 'NPC_SPAWN', payload: {} })
                }
            } else {
                np.migrationTimer = 0
            }
        }
    }

    window.npcSystem = npcSystem
})()
