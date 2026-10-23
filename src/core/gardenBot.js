;(function() {
    'use strict'

    function distance(a, b) {
        return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.q + a.r - b.q - b.r))
    }

    // Reads the public board only; never mutates state or consumes the PRNG.
    function choose(g) {
        var p = g.active
        var plan = gardenRules.preview(g, p)
        var cfg = gardenConfig.bot
        var goal = gardenConfig.target - g.players[p].score
        if (plan.eligible && (plan.score >= goal || plan.count >= cfg.harvestSize || plan.conflicts.length > 0)) {
            return { type: 'GARDEN_HARVEST', reason: plan.score >= goal ? 'Этот урожай доводит меня до цели.' : plan.conflicts.length ? 'Сосед спорит с сетью — собираю, пока она приносит очки.' : 'Сеть выросла: собираю и возвращаю фишки.' }
        }

        var legal = gardenRules.actions(g, p)
        var glades = g.tiles.filter(function(t) { return t.fertile && !gardenRules.node(g, t.id, p) })
        var growth = legal.filter(function(a) { return a.type === 'GARDEN_GROW' }).map(function(a) {
            var t = g.tiles[a.id]
            var missing = !plan.biomes[t.type]
            var shared = t.chips[1 - p] !== null
            var near = glades.length ? Math.min.apply(null, glades.map(function(c) { return distance(t, c) })) : 0
            return {
                type: a.type,
                id: a.id,
                value: (missing ? cfg.missingBiome : 0) + (t.fertile ? cfg.fertility : 0) - near * cfg.approach + (shared ? cfg.contest : 0),
                reason: missing ? 'Добираю биом: ' + gardenConfig.biomes[t.type] + '.' : t.fertile ? 'Занимаю плодородную поляну ради бонуса.' : shared ? 'Оспариваю участок соседа: он перестанет давать нам очки.' : 'Удлиняю сеть к плодородным полянам.'
            }
        })
        growth.sort(function(a, b) { return b.value - a.value || a.id - b.id })
        if (growth.length) return { type: growth[0].type, id: growth[0].id, reason: growth[0].reason }
        if (plan.eligible) return { type: 'GARDEN_HARVEST', reason: 'Запас закончился — собираю готовый урожай.' }
        var edge = legal.find(function(a) { return a.type === 'GARDEN_RETRACT' })
        return edge ? { type: edge.type, id: edge.id, reason: 'Возвращаю край: нужна фишка для нового направления.' } : null
    }

    window.gardenBot = { choose: choose }
})()
