// systems/foodSystem.js — food patches that get eaten and regrow. Owns state.food.
;(function() {
    'use strict'

    var B = config.balance

    var foodSystem = {
        init: function(store) {
            var items = []
            var spots = config.world.food
            for (var i = 0; i < spots.length && i < B.FOOD_COUNT; i++) {
                items.push({
                    id: i, x: spots[i].x, y: spots[i].y, kind: spots[i].kind,
                    value: spots[i].kind === 'large' ? B.FOOD_ENERGY_LARGE : B.FOOD_ENERGY_SMALL,
                    available: true, regrowIn: 0
                })
            }
            store.state.food = { items: items, events: [] }

            store.register('FOOD_CONSUMED', function(state, p) {
                var f = state.food.items[p.id]
                if (f) { f.available = false; f.regrowIn = B.FOOD_REGROW_TIME }
            }, 'food.items')
        },

        update: function(state, dt) {
            var items = state.food.items
            for (var i = 0; i < items.length; i++) {
                var f = items[i]
                if (!f.available && f.regrowIn > 0) {
                    f.regrowIn -= dt
                    if (f.regrowIn <= 0) { f.regrowIn = 0; f.available = true }
                }
            }
        },

        nearestAvailable: function(state, x, y, maxDist) {
            var best = null, bestD = maxDist
            var items = state.food.items
            for (var i = 0; i < items.length; i++) {
                if (!items[i].available) continue
                var d = Math.hypot(items[i].x - x, items[i].y - y)
                if (d < bestD) { bestD = d; best = items[i] }
            }
            return best
        }
    }

    window.foodSystem = foodSystem
})()
