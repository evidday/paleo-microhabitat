// systems/playerSystem.js — the player creature. Owns state.player.
;(function() {
    'use strict'

    var B = config.balance
    var ws = window.worldSystem

    function clampStat(v) { return Math.max(0, Math.min(100, v)) }

    var playerSystem = {
        // pure helpers (unit-tested)
        getModifiers: function(adaptationId) {
            return config.adaptations[adaptationId] || { speed: 1, energy: 1, hydration: 1, detection: 1 }
        },
        maxSpeed: function(adaptationId) {
            return B.PLAYER_SPEED * playerSystem.getModifiers(adaptationId).speed
        },
        // hydration lost per second at a given humidity (percent)
        hydrationLoss: function(humidity, adaptationId) {
            var factor = 1 + (B.HUMIDITY_REFERENCE - humidity) / 100 * B.HUMIDITY_SENSITIVITY
            return B.PLAYER_HYDRATION_DRAIN * Math.max(0.2, factor) * playerSystem.getModifiers(adaptationId).hydration
        },
        // energy lost per second at a given fraction (0-1) of top speed
        energyLoss: function(speedFraction, adaptationId) {
            return B.PLAYER_ENERGY_DRAIN +
                B.PLAYER_MOVE_ENERGY_MULTIPLIER * playerSystem.getModifiers(adaptationId).energy * speedFraction
        },

        init: function(store, opts) {
            opts = opts || {}
            var adaptation = opts.adaptation || config.adaptations.defaultId
            var start = config.world.playerStart
            store.state.player = {
                x: start.x, y: start.y, vx: 0, vy: 0, heading: -0.6,
                energy: B.PLAYER_START_ENERGY, hydration: B.PLAYER_START_HYDRATION,
                alive: true, dying: false, sheltered: true,
                adaptation: adaptation,
                detectionMultiplier: playerSystem.getModifiers(adaptation).detection,
                foodEaten: 0, timeSheltered: 0, timeExposed: 0, distance: 0, anim: 0,
                causeOfDeath: null,
                input: { dx: 0, dy: 0 },
                events: []
            }

            store.register('SET_INPUT', function(state, p) {
                state.player.input = { dx: Math.max(-1, Math.min(1, p.dx)), dy: Math.max(-1, Math.min(1, p.dy)) }
            }, 'player.input')

            store.register('PLAYER_EAT', function(state, p) {
                state.player.energy = clampStat(state.player.energy + p.value)
                state.player.foodEaten++
            }, 'player')

            store.register('PLAYER_DIED', function(state, p) {
                if (!state.player.alive) return
                state.player.alive = false
                state.player.causeOfDeath = p.cause
            }, 'player')
        },

        update: function(state, dt) {
            var p = state.player
            if (state.session.phase !== 'running' || !p.alive) return

            // movement
            var ix = p.input.dx, iy = p.input.dy
            var len = Math.hypot(ix, iy)
            var top = playerSystem.maxSpeed(p.adaptation)
            var tx = len > 0 ? ix / len * top : 0
            var ty = len > 0 ? iy / len * top : 0
            var k = Math.min(1, dt * 10)
            p.vx += (tx - p.vx) * k
            p.vy += (ty - p.vy) * k
            var r = ws.resolve(state.world, p.x + p.vx * dt, p.y + p.vy * dt, B.PLAYER_RADIUS)
            p.x = r.x
            p.y = r.y
            var speed = Math.hypot(p.vx, p.vy)
            if (speed > 8) {
                var d = Math.atan2(p.vy, p.vx) - p.heading
                p.heading += Math.atan2(Math.sin(d), Math.cos(d)) * Math.min(1, dt * 14)
            }
            p.anim += speed * dt / 9
            p.distance += speed * dt

            // needs
            var frac = speed / top
            p.energy = Math.max(0, p.energy - playerSystem.energyLoss(frac, p.adaptation) * dt)
            p.hydration = Math.max(0, p.hydration -
                playerSystem.hydrationLoss(state.session.humidity, p.adaptation) * dt)
            if (ws.inWet(state.world, p.x, p.y)) {
                p.hydration = clampStat(p.hydration + B.WET_HYDRATION_RESTORE * dt)
            }

            // shelter bookkeeping
            p.sheltered = !!ws.shelterAt(state.world, p.x, p.y)
            if (p.sheltered) p.timeSheltered += dt
            else p.timeExposed += dt

            // eating: flag events, main.js dispatches them next tick
            var items = state.food.items
            for (var i = 0; i < items.length; i++) {
                var f = items[i]
                if (!f.available) continue
                if (Math.hypot(f.x - p.x, f.y - p.y) <= B.FOOD_PICKUP_RADIUS) {
                    p.events.push({ type: 'PLAYER_EAT', payload: { value: f.value } })
                    p.events.push({ type: 'FOOD_CONSUMED', payload: { id: f.id } })
                    break
                }
            }

            // death checks
            if (!p.dying) {
                if (p.energy <= 0) { p.dying = true; p.events.push({ type: 'PLAYER_DIED', payload: { cause: 'starved' } }) }
                else if (p.hydration <= 0) { p.dying = true; p.events.push({ type: 'PLAYER_DIED', payload: { cause: 'dehydrated' } }) }
            }
        }
    }

    window.playerSystem = playerSystem
})()
