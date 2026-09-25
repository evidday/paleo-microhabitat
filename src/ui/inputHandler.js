// ui/inputHandler.js — keyboard -> dispatch. No game logic.
;(function() {
    'use strict'

    var down = {}
    var last = { dx: 0, dy: 0 }

    var KEYS = {
        KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
        KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right'
    }

    function direction() {
        return {
            dx: (down.right ? 1 : 0) - (down.left ? 1 : 0),
            dy: (down.down ? 1 : 0) - (down.up ? 1 : 0)
        }
    }

    function push(force) {
        var d = direction()
        if (force ? (d.dx || d.dy) : (d.dx !== last.dx || d.dy !== last.dy)) store.dispatch('SET_INPUT', d)
        last = d
    }

    var inputHandler = {
        init: function(doc) {
            doc.addEventListener('keydown', function(e) {
                var dir = KEYS[e.code]
                if (dir) {
                    e.preventDefault()
                    if (!down[dir]) { down[dir] = true; push(false) }
                    return
                }
                var phase = store.state.session.phase
                if (e.code === 'KeyR' && phase !== 'menu') store.dispatch('REQUEST_RUN', {})
                if ((e.code === 'Enter' || e.code === 'Space') && phase === 'menu') {
                    e.preventDefault()
                    store.dispatch('REQUEST_RUN', {})
                }
            })
            doc.addEventListener('keyup', function(e) {
                var dir = KEYS[e.code]
                if (dir) { down[dir] = false; push(false) }
            })
            window.addEventListener('blur', function() { down = {}; push(false) })
        },

        // after a restart the fresh state has no input; re-apply keys that are still held
        sync: function() {
            last = { dx: 0, dy: 0 }
            push(true)
        }
    }

    window.inputHandler = inputHandler
})()
