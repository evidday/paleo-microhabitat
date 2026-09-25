// systems/sessionSystem.js — run phase, timer, outcome. Owns state.session.
;(function() {
    'use strict'

    var B = config.balance

    var sessionSystem = {
        init: function(store, opts) {
            opts = opts || {}
            store.state.session = {
                phase: 'menu',              // menu | running | ended
                time: 0,
                duration: B.SESSION_DURATION,
                humidity: B.HUMIDITY,
                adaptation: opts.adaptation || config.adaptations.defaultId,
                seed: store.state.seed,
                outcome: null,              // won | lost
                cause: null,
                request: null,              // set by UI, executed by main.js
                endQueued: false,
                events: []
            }

            store.register('SELECT_ADAPTATION', function(state, p) {
                if (config.adaptations[p.id]) state.session.adaptation = p.id
            }, 'session.adaptation')

            store.register('START_RUN', function(state) {
                state.session.phase = 'running'
            }, 'session.phase')

            store.register('REQUEST_RUN', function(state) {
                state.session.request = { kind: 'run' }
            }, 'session.request')

            store.register('REQUEST_MENU', function(state) {
                state.session.request = { kind: 'menu' }
            }, 'session.request')

            store.register('RUN_ENDED', function(state, p) {
                state.session.phase = 'ended'
                state.session.outcome = p.outcome
                state.session.cause = p.outcome === 'lost' ? state.player.causeOfDeath : null
            }, 'session')
        },

        update: function(state, dt) {
            var s = state.session
            if (s.phase !== 'running' || s.endQueued) return
            s.time += dt
            if (!state.player.alive) {
                s.endQueued = true
                s.events.push({ type: 'RUN_ENDED', payload: { outcome: 'lost' } })
            } else if (s.time >= s.duration) {
                s.time = s.duration
                s.endQueued = true
                s.events.push({ type: 'RUN_ENDED', payload: { outcome: 'won' } })
            }
        }
    }

    window.sessionSystem = sessionSystem
})()
