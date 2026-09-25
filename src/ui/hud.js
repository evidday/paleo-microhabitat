// ui/hud.js — minimal in-run HUD. Reads state, never writes it.
;(function() {
    'use strict'

    var S = config.strings
    var el = {}

    function fmt(sec) {
        var m = Math.floor(sec / 60), s = Math.floor(sec % 60)
        return m + ':' + (s < 10 ? '0' : '') + s
    }

    var hud = {
        mount: function(root) {
            root.innerHTML =
                '<div class="hud-top">' +
                  '<div class="stat"><span class="lbl">' + S.energy + '</span><span class="bar"><i id="hud-energy"></i></span><b id="hud-energy-n"></b></div>' +
                  '<div class="stat"><span class="lbl">' + S.moisture + '</span><span class="bar moist"><i id="hud-moist"></i></span><b id="hud-moist-n"></b></div>' +
                  '<div class="time" id="hud-time"></div>' +
                '</div>' +
                '<div class="hud-hint" id="hud-hint">' + S.hint + '</div>' +
                '<div class="hud-bottom"><span id="hud-trait"></span><span id="hud-cover"></span></div>'
            el.root = root
            el.energy = root.querySelector('#hud-energy'); el.energyN = root.querySelector('#hud-energy-n')
            el.moist = root.querySelector('#hud-moist'); el.moistN = root.querySelector('#hud-moist-n')
            el.time = root.querySelector('#hud-time'); el.hint = root.querySelector('#hud-hint')
            el.trait = root.querySelector('#hud-trait'); el.cover = root.querySelector('#hud-cover')
        },

        update: function(state) {
            var show = state.session.phase === 'running'
            el.root.style.display = show ? 'block' : 'none'
            if (!show) return
            var p = state.player
            el.energy.style.width = p.energy + '%'
            el.moist.style.width = p.hydration + '%'
            el.energy.parentNode.className = 'bar' + (p.energy < 25 ? ' low' : '')
            el.moist.parentNode.className = 'bar moist' + (p.hydration < 25 ? ' low' : '')
            el.energyN.textContent = Math.ceil(p.energy) + (p.energy < 25 ? ' LOW' : '')
            el.moistN.textContent = Math.ceil(p.hydration) + (p.hydration < 25 ? ' LOW' : '')
            el.time.textContent = fmt(state.session.duration - state.session.time)
            el.hint.style.opacity = state.session.time < 6 ? 1 : 0
            el.trait.textContent = S.adaptations[p.adaptation].name
            el.cover.textContent = p.sheltered ? S.hidden : S.exposed
            el.cover.className = p.sheltered ? 'hidden' : 'exposed'
        }
    }

    window.hud = hud
})()
