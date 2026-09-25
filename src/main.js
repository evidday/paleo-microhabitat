// Entry point — seed, system init, game loop.
// This is the only file allowed to call Date.now().

;(function() {
    'use strict'

    var FIXED_DT = config.balance.FIXED_DT

    // init order matters: later systems read earlier slices
    var systems = [worldSystem, sessionSystem, playerSystem, foodSystem, npcSystem, predatorSystem]
    // slices that queue discrete events during update(); drained at the start of the next tick
    var eventSlices = ['predator', 'player', 'npcs', 'food', 'session']

    // Fresh world. runNow=false shows the ecosystem behind the start screen.
    function begin(runNow, adaptation, seed) {
        store.resetState(seed)
        var opts = { adaptation: adaptation }
        for (var i = 0; i < systems.length; i++) systems[i].init(store, opts)
        if (runNow) store.dispatch('START_RUN', { adaptation: adaptation })
        if (window.inputHandler) window.inputHandler.sync()
    }

    function drainEvents(state) {
        for (var i = 0; i < eventSlices.length; i++) {
            var slice = state[eventSlices[i]]
            if (slice && slice.events && slice.events.length) {
                var list = slice.events
                slice.events = []
                for (var j = 0; j < list.length; j++) store.dispatch(list[j].type, list[j].payload)
            }
        }
    }

    // one fixed simulation step
    function step() {
        store.tick()
        var state = store.state

        var req = state.session.request
        if (req) {
            begin(req.kind === 'run', state.session.adaptation, Date.now())
            state = store.state
        }

        drainEvents(state)
        for (var i = 0; i < systems.length; i++) systems[i].update(state, FIXED_DT)
    }

    window.paleo = { begin: begin, step: step, FIXED_DT: FIXED_DT }

    // ---- browser only ----
    if (typeof document === 'undefined' || !document.getElementById('game')) return

    var canvas = document.getElementById('game')
    var accumulator = 0
    var lastTime = 0

    function gameLoop(timestamp) {
        var elapsed = Math.min((timestamp - lastTime) / 1000, 0.1)
        lastTime = timestamp
        accumulator += elapsed

        while (accumulator >= FIXED_DT) {
            step()
            accumulator -= FIXED_DT
        }

        render(store.state, timestamp / 1000)
        requestAnimationFrame(gameLoop)
    }

    function render(state, t) {
        renderer.render(canvas, state, t)
        hud.update(state)
        startScreen.update(state)
        resultScreen.update(state)
    }

    try {
        begin(false, config.adaptations.defaultId, Date.now())
        inputHandler.init(document)
        hud.mount(document.getElementById('hud'))
        startScreen.mount(document.getElementById('start-screen'))
        resultScreen.mount(document.getElementById('result-screen'))
        requestAnimationFrame(gameLoop)
    } catch (e) {
        console.error('[paleo] initialization failed', e)
        document.body.insertAdjacentHTML('beforeend',
            '<pre style="color:#f88;padding:1rem;position:fixed;top:0;left:0">Init error: ' + e.message + '</pre>')
    }
})()
