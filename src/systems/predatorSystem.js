// systems/predatorSystem.js — the large predator. Owns state.predator.
// SEARCH -> TARGET -> CHASE -> ATTACK -> EAT -> SATIATED -> SEARCH
// Targeting is ONE generic rule applied to every prey entity (NPCs and player alike).
;(function() {
    'use strict'

    var B = config.balance

    function angleLerp(a, b, t) {
        return a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t
    }

    // how far away the predator can notice a given prey entity
    function detectionRange(prey) {
        return B.PREDATOR_DETECTION_RANGE *
            (prey.sheltered ? B.SHELTER_DETECTION_MULTIPLIER : 1) *
            prey.detectionMultiplier
    }

    // one list of everything edible; the player is just one more entry
    function collectPrey(state) {
        var list = []
        var npcs = state.npcs.list
        for (var i = 0; i < npcs.length; i++) {
            var n = npcs[i]
            if (n.alive) list.push({ kind: 'npc', id: n.id, x: n.x, y: n.y,
                sheltered: n.sheltered, detectionMultiplier: n.detectionMultiplier })
        }
        var p = state.player
        if (state.session.phase === 'running' && p.alive) {
            list.push({ kind: 'player', id: 0, x: p.x, y: p.y,
                sheltered: p.sheltered, detectionMultiplier: p.detectionMultiplier })
        }
        return list
    }

    function findTarget(state, kind, id) {
        if (kind === 'player') {
            var p = state.player
            return (state.session.phase === 'running' && p.alive) ? p : null
        }
        var list = state.npcs.list
        for (var i = 0; i < list.length; i++) if (list[i].id === id && list[i].alive) return list[i]
        return null
    }

    function pickWaypoint(state) {
        var pr = state.predator
        var items = state.food.items
        var roll = store.prng.next()
        var prey = collectPrey(state)
        if (roll < 0.35 && prey.length) {                        // drawn toward movement: any creature, equally
            var q = prey[store.prng.next(0, prey.length - 1)]
            pr.wpX = q.x + store.prng.next(-150, 150)
            pr.wpY = q.y + store.prng.next(-150, 150)
        } else if (roll < 0.75 && items.length) {                 // animals gather where food is
            var f = items[store.prng.next(0, items.length - 1)]
            pr.wpX = f.x + store.prng.next(-250, 250)
            pr.wpY = f.y + store.prng.next(-250, 250)
        } else {
            pr.wpX = store.prng.next(250, state.world.w - 250)
            pr.wpY = store.prng.next(250, state.world.h - 250)
        }
        pr.wpX = Math.max(150, Math.min(state.world.w - 150, pr.wpX))
        pr.wpY = Math.max(150, Math.min(state.world.h - 150, pr.wpY))
    }

    function go(pr, tx, ty, desiredSpeed, turnRate, dt) {
        pr.heading = angleLerp(pr.heading, Math.atan2(ty - pr.y, tx - pr.x), Math.min(1, dt * turnRate))
        pr.speedNow += (desiredSpeed - pr.speedNow) * Math.min(1, dt * 3)
        pr.x += Math.cos(pr.heading) * pr.speedNow * dt
        pr.y += Math.sin(pr.heading) * pr.speedNow * dt
        pr.anim += pr.speedNow * dt / 40
    }

    function toSearch(pr, wait) {
        pr.state = 'SEARCH'
        pr.timer = 0
        pr.wait = wait
        pr.targetKind = null
        pr.targetId = null
        pr.chaseTime = 0
        pr.lostTime = 0
    }

    var predatorSystem = {
        detectionRange: detectionRange,

        // Best candidate the predator currently notices, or null.
        // Lowest (distance / range) wins: the most noticeable prey. Ties broken by seeded PRNG.
        evaluatePrey: function(state) {
            var prey = collectPrey(state)
            var pr = state.predator
            var best = null, bestScore = Infinity
            for (var i = 0; i < prey.length; i++) {
                var c = prey[i]
                var range = detectionRange(c)
                var d = Math.hypot(c.x - pr.x, c.y - pr.y)
                if (d > range) continue
                var score = d / range
                if (score < bestScore - 1e-9 || (Math.abs(score - bestScore) <= 1e-9 && store.prng.next() < 0.5)) {
                    bestScore = score
                    best = c
                }
            }
            return best
        },

        init: function(store, opts) {
            var start = config.world.predatorStart
            store.state.predator = {
                x: start.x, y: start.y, heading: Math.PI * 0.8, speedNow: 0, anim: 0,
                state: 'SEARCH', timer: 0, wait: 0, scanTimer: 0, pauseT: 0,
                initialDelay: B.PREDATOR_INITIAL_DELAY,
                chaseTime: 0, lostTime: 0, targetKind: null, targetId: null, tx: start.x, ty: start.y,
                wpX: start.x, wpY: start.y, encounters: 0, events: []
            }
            pickWaypoint(store.state)
        },

        update: function(state, dt) {
            var pr = state.predator
            var target, d, range

            if (pr.initialDelay > 0) pr.initialDelay -= dt
            if (pr.wait > 0) pr.wait -= dt

            if (pr.state === 'SEARCH' || pr.state === 'SATIATED') {
                var slow = pr.state === 'SATIATED' ? 0.6 : 1
                if (pr.pauseT > 0) {
                    pr.pauseT -= dt
                    pr.speedNow += (0 - pr.speedNow) * Math.min(1, dt * 3)
                } else {
                    go(pr, pr.wpX, pr.wpY, B.PREDATOR_SPEED * slow, 1.2, dt)
                    if (Math.hypot(pr.wpX - pr.x, pr.wpY - pr.y) < 80) {
                        pickWaypoint(state)
                        pr.pauseT = store.prng.next(10, 30) / 10
                    }
                }
                if (pr.state === 'SATIATED') {
                    pr.timer += dt
                    if (pr.timer >= B.PREDATOR_COOLDOWN) toSearch(pr, 0)
                } else if (pr.initialDelay <= 0 && pr.wait <= 0) {
                    pr.scanTimer += dt
                    if (pr.scanTimer >= B.PREDATOR_SCAN_INTERVAL) {
                        pr.scanTimer = 0
                        var c = predatorSystem.evaluatePrey(state)
                        if (c) {
                            pr.state = 'TARGET'
                            pr.timer = 0
                            pr.targetKind = c.kind
                            pr.targetId = c.id
                            pr.tx = c.x
                            pr.ty = c.y
                            if (c.kind === 'player') pr.encounters++
                        }
                    }
                }
                return
            }

            if (pr.state === 'EAT') {
                pr.speedNow += (0 - pr.speedNow) * Math.min(1, dt * 4)
                pr.anim += dt * 1.5
                pr.timer += dt
                if (pr.timer >= B.PREDATOR_FEED_DURATION) { pr.state = 'SATIATED'; pr.timer = 0; pickWaypoint(state) }
                return
            }

            // TARGET / CHASE / ATTACK all need a live target
            target = findTarget(state, pr.targetKind, pr.targetId)
            if (!target) { toSearch(pr, 0.5); return }
            pr.tx = target.x
            pr.ty = target.y
            d = Math.hypot(target.x - pr.x, target.y - pr.y)

            if (pr.state === 'TARGET') {
                pr.timer += dt
                pr.speedNow += (0 - pr.speedNow) * Math.min(1, dt * 6)
                pr.heading = angleLerp(pr.heading, Math.atan2(target.y - pr.y, target.x - pr.x), Math.min(1, dt * 5))
                if (pr.timer >= B.PREDATOR_TARGET_TIME) { pr.state = 'CHASE'; pr.timer = 0 }
                return
            }

            if (pr.state === 'CHASE') {
                pr.chaseTime += dt
                range = detectionRange({
                    sheltered: target.sheltered,
                    detectionMultiplier: target.detectionMultiplier
                })
                if (d > range * 1.3) pr.lostTime += dt
                else pr.lostTime = 0
                if (pr.lostTime > B.PREDATOR_LOSE_TARGET_TIME || pr.chaseTime > B.PREDATOR_MAX_CHASE_TIME) {
                    toSearch(pr, 2)
                    return
                }
                go(pr, target.x, target.y, B.PREDATOR_CHASE_SPEED, 3, dt)
                if (d < B.PREDATOR_ATTACK_RANGE) { pr.state = 'ATTACK'; pr.timer = 0 }
                return
            }

            if (pr.state === 'ATTACK') {
                pr.timer += dt
                go(pr, target.x, target.y, B.PREDATOR_CHASE_SPEED * 1.4, 6, dt)
                if (pr.timer >= B.PREDATOR_ATTACK_TIME) {
                    if (d < B.PREDATOR_ATTACK_RANGE * 1.5) {
                        if (pr.targetKind === 'player') {
                            pr.events.push({ type: 'PLAYER_DIED', payload: { cause: 'caught' } })
                        } else {
                            pr.events.push({ type: 'NPC_DIED', payload: { id: pr.targetId } })
                        }
                        pr.state = 'EAT'
                        pr.timer = 0
                        pr.targetKind = null
                        pr.targetId = null
                    } else {
                        pr.state = 'CHASE'
                        pr.timer = 0
                    }
                }
            }
        }
    }

    window.predatorSystem = predatorSystem
})()
