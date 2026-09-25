// ui/startScreen.js — title, humidity, trait choice. Dispatches only.
;(function() {
    'use strict'

    var S = config.strings
    var cards = {}
    var root, shown = null, chosen = null

    var ICONS = {
        longLegs: '<svg viewBox="0 0 48 48"><path d="M8 40 L18 22 L14 8 M24 40 L28 22 L36 10 M40 40 L38 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        camouflage: '<svg viewBox="0 0 48 48"><ellipse cx="24" cy="24" rx="18" ry="12" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="17" cy="22" r="3" fill="currentColor"/><circle cx="27" cy="27" r="3.5" fill="currentColor"/><circle cx="31" cy="19" r="2.2" fill="currentColor"/></svg>',
        moistureRetention: '<svg viewBox="0 0 48 48"><path d="M24 6 C 34 20 38 26 38 31 A14 14 0 0 1 10 31 C10 26 14 20 24 6 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>'
    }

    var startScreen = {
        mount: function(el) {
            root = el
            var html = '<div class="card">' +
                '<h1>' + S.title + '</h1>' +
                '<p class="tag">' + S.tagline + '</p>' +
                '<p class="hum">' + S.humidity + ': <b>' + config.balance.HUMIDITY + '%</b></p>' +
                '<p class="pick">' + S.pickTrait + '</p><div class="traits">'
            config.adaptations.order.forEach(function(id) {
                html += '<button class="trait" data-id="' + id + '">' + ICONS[id] +
                    '<span class="tn">' + S.adaptations[id].name + '</span>' +
                    '<span class="tt">' + S.adaptations[id].text + '</span></button>'
            })
            html += '</div><button class="go" id="start-go">' + S.start + '</button>' +
                '<p class="fine">' + S.disclaimer + '</p></div>'
            root.innerHTML = html
            root.querySelectorAll('.trait').forEach(function(b) {
                cards[b.getAttribute('data-id')] = b
                b.addEventListener('click', function() {
                    store.dispatch('SELECT_ADAPTATION', { id: b.getAttribute('data-id') })
                })
            })
            root.querySelector('#start-go').addEventListener('click', function() {
                store.dispatch('REQUEST_RUN', {})
            })
        },

        update: function(state) {
            var show = state.session.phase === 'menu'
            if (show !== shown) { root.style.display = show ? 'flex' : 'none'; shown = show }
            if (!show || state.session.adaptation === chosen) return
            chosen = state.session.adaptation
            for (var id in cards) cards[id].className = 'trait' + (id === chosen ? ' on' : '')
        }
    }

    window.startScreen = startScreen
})()
