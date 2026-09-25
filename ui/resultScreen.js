// ui/resultScreen.js — "what happened in this experiment". Dispatches only.
;(function() {
    'use strict'

    var S = config.strings
    var root, shown = null

    function fmt(sec) {
        var m = Math.floor(sec / 60), s = Math.floor(sec % 60)
        return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s
    }

    function row(label, value) {
        return '<div class="r"><span>' + label + '</span><b>' + value + '</b></div>'
    }

    var resultScreen = {
        mount: function(el) {
            root = el
            root.innerHTML = '<div class="card"><h2 id="res-title"></h2><p id="res-cause" class="tag"></p>' +
                '<div id="res-rows" class="rows"></div>' +
                '<p class="pick">' + S.changeVariable + '</p>' +
                '<div class="btns"><button class="go" id="res-again">' + S.tryAgain + '</button>' +
                '<button class="go alt" id="res-change">' + S.changeAdaptation + '</button></div>' +
                '<p class="fine">R = try again</p></div>'
            root.querySelector('#res-again').addEventListener('click', function() { store.dispatch('REQUEST_RUN', {}) })
            root.querySelector('#res-change').addEventListener('click', function() { store.dispatch('REQUEST_MENU', {}) })
        },

        update: function(state) {
            var s = state.session
            var show = s.phase === 'ended'
            if (show !== shown) {
                root.style.display = show ? 'flex' : 'none'
                shown = show
                if (show) {
                    var p = state.player
                    root.querySelector('#res-title').textContent = S.outcomes[s.outcome]
                    root.querySelector('#res-cause').textContent = s.outcome === 'won'
                        ? 'You outlasted the ecosystem timer.' : S.causes[s.cause]
                    root.querySelector('#res-rows').innerHTML =
                        row('Survival', fmt(s.time)) + row('Food eaten', p.foodEaten) +
                        row('Time sheltered', Math.round(p.timeSheltered) + ' s') +
                        row('Predator kills', state.npcs.killed) +
                        row('Adaptation', S.adaptations[p.adaptation].name) +
                        row('Humidity', s.humidity + '%') + row('Seed', s.seed)
                }
            }
        }
    }

    window.resultScreen = resultScreen
})()
