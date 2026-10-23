;(function() {
    'use strict'

    function distance(a, b) {
        return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.q + a.r - b.q - b.r))
    }

    // Reads the public board only; never mutates state or consumes the PRNG.
    function choose(g) {
        var p = g.active
        var plan = gardenRules.preview(g, p)
        var cfg = gardenConfig.bot.styles[g.botStyle] || gardenConfig.bot.styles.short
        var goal = gardenConfig.target - g.players[p].score
        if (plan.eligible && (plan.score >= goal || plan.count >= cfg.harvestSize || plan.conflicts.length >= cfg.retreatAt || g.players[p].fights>=2)) {
            return { type: 'GARDEN_HARVEST', reason: plan.score >= goal ? 'Этот урожай доводит меня до цели. Корзину победителю!'  : plan.conflicts.length >= cfg.retreatAt ? 'Сосед спорит с сетью — собираю, пока есть очки. Эти нервы не входят в урожай.' : g.botStyle==='long' ? 'Семь фишек — пора собирать. Размер имеет мицелий.' : 'Три биома готовы — собираю маленький урожай. Жадность пусть растит сосед.' }
        }

        var legal = gardenRules.actions(g, p)
        var fights=legal.filter(function(a){return a.type==='GARDEN_FIGHT'}).map(function(a){return gardenConflict.preview(g,a.id,p)})
        var wins=fights.filter(function(b){return b.outcome==='win'}).sort(function(a,b){return b.removed[1-p].length-a.removed[1-p].length})
        if(wins.length&&g.players[p].fights<2)return {type:'GARDEN_FIGHT',id:wins[0].target,reason:'Сила '+wins[0].attack.power+' против '+wins[0].defense.power+': вытесню соседа. Корзину не забудь!'}
        var hand=g.players[p].hand,own=gardenRules.owned(g,p),enemies=gardenRules.owned(g,1-p)
        if(hand.length&&g.players[p].preparations<2){
            var feed=own.filter(function(t){return gardenRules.tier(g,t,p)<3&&enemies.some(function(e){return distance(t,e)<=2})}).sort(function(a,b){return Math.abs(a.q)-Math.abs(b.q)})[0]
            if(feed)return {type:'GARDEN_CARD',id:feed.id,cardId:hand[0].id,mode:'feed',reason:'Пожертвую карту: усилю переднего гриба перед дракой.'}
        }
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
                reason: missing ? 'Добираю биом: ' + gardenConfig.biomes[t.type] + '.' : t.fertile ? 'Занимаю плодородную поляну ради бонуса.' : shared ? 'Оспариваю участок соседа: он перестанет давать нам очки.' : (g.botStyle==='long'?'Расту к золотым полянам. Центр — мой. Сосед ещё не в курсе.':'Подбираю место для быстрого урожая. Я не мелочный, я скороспелый.')
            }
        })
        growth.sort(function(a, b) { return b.value - a.value || a.id - b.id })
        if(growth.length){if(!own.length&&hand.length){var wanted=g.botStyle==='long'?'guardian':'brawler',card=hand.find(function(c){return c.kind===wanted})||hand[0];return {type:'GARDEN_CARD',id:growth[0].id,cardId:card.id,mode:'plant',reason:'Высаживаю '+gardenConfig.cards.kinds[card.kind].name+' из руки: начну сеть с нужного типажа.'}}return {type:growth[0].type,id:growth[0].id,reason:growth[0].reason}}
        if (plan.eligible) return { type: 'GARDEN_HARVEST', reason: 'Запас закончился — собираю готовый урожай.' }
        var edge = legal.find(function(a) { return a.type === 'GARDEN_RETRACT' })
        return edge ? { type: edge.type, id: edge.id, reason: 'Возвращаю край: нужна фишка для нового направления.' } : null
    }

    window.gardenBot = { choose: choose }
})()
