;(function() {
    'use strict'
    var input = new URLSearchParams(location.search).get('seed')
    var seed = input === null ? Date.now() >>> 0 : Number(input)
    if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) seed = 42
    store.resetState(seed)
    gardenSystem.init()
    gardenView.init()
    gardenUI.mount()

    var timer = null
    var stopped = false
    function schedule() {
        clearTimeout(timer)
        var g = store.state.garden
        if (stopped || g.mode !== 'solo' || g.phase === 'over') return
        if (g.phase === 'handoff') {
            timer = setTimeout(function() { store.dispatch('GARDEN_BEGIN') }, g.lastAction&&g.lastAction.skirmish?gardenConfig.skirmishMs:gardenConfig.bot.handoffMs)
        } else if (g.phase === 'play' && g.active === 1) {
            if (!g.botPlan) {
                timer = setTimeout(function() {
                    var plan = gardenBot.choose(store.state.garden)
                    if (plan) store.dispatch('GARDEN_BOT_PLAN', plan)
                }, gardenConfig.bot.thinkMs)
            } else {
                timer = setTimeout(function() {
                    var plan = store.state.garden.botPlan
                    if (plan) store.dispatch(plan.type, plan.id === null ? undefined : { id: plan.id })
                }, gardenConfig.bot.showMs)
            }
        }
    }
    var unsubscribe = store.subscribeTo('garden', schedule)
    window.addEventListener('pagehide', function() {
        stopped = true
        clearTimeout(timer)
        unsubscribe()
    })
    function loop(t) {
        gardenView.animate(t)
        requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
})()
