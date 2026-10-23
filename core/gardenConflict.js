;(function() {
    'use strict'
    var C=gardenConfig
    function role(g,t,p) { return t.base===p?0:t.chips[p]&&Number.isInteger(t.chips[p].role)?t.chips[p].role:3 }
    function fighter(g,t,p,attacking,terrain) {
        var rank=t.base===p?3:gardenRules.tier(g,t,p),kind=role(g,t,p)
        var bonus=kind===0&&!attacking||kind===1&&attacking||kind===2&&terrain.type===2?1:0
        var buff=0,home=t.base===p?C.combat.homeBonus:0
        return {owner:p,id:t.id,tier:rank,role:kind,base:C.combat.tierPower[rank],bonus:bonus,home:home,buff:buff,power:C.combat.tierPower[rank]+bonus+home,look:t.look,decor:t.decor}
    }
    function connectedIds(g,p) {
        var seen=new Set([g.bases[p]]),queue=[g.tiles[g.bases[p]]]
        while(queue.length){var from=queue.shift();g.tiles.forEach(function(t){if(!seen.has(t.id)&&gardenRules.node(g,t.id,p)&&gardenRules.adjacent(from,t)){seen.add(t.id);queue.push(t)}})}
        return seen
    }
    function prune(g,p,remove) {
        remove.forEach(function(id){if(g.tiles[id].base!==p)g.tiles[id].chips[p]=null})
        var reachable=connectedIds(g,p)
        g.tiles.forEach(function(t){if(t.chips[p]!==null&&!reachable.has(t.id))t.chips[p]=null})
    }
    function reason(g,id,p) {
        var t=g.tiles[id]
        if(!t||t.base>=0||t.chips[1-p]===null)return 'Выберите гриб соперника'
        if(t.chips[p]===null&&gardenRules.reserve(g,p)===0)return 'Для нового ростка нужна 1 фишка в запасе'
        if(!g.tiles.some(function(n){return gardenRules.node(g,n.id,p)&&(n.id===id||gardenRules.adjacent(n,t))}))return 'Дотянитесь своей сетью до этого гекса'
        return ''
    }
    // Forecast on a plain-data copy; the handler applies these exact tiles once.
    function preview(g,id,p) {
        var why=reason(g,id,p);if(why)return {reason:why}
        var t=g.tiles[id],enemy=1-p
        var candidates=g.tiles.filter(function(n){return gardenRules.node(g,n.id,p)&&(n.id===id||gardenRules.adjacent(n,t))}).map(function(n){return fighter(g,n,p,true,t)})
        candidates.sort(function(a,b){return b.power-a.power||a.id-b.id})
        var attack=candidates[0],defense=fighter(g,t,enemy,false,t),outcome=attack.power>defense.power?'win':attack.power<defense.power?'loss':'draw'
        var copy=JSON.parse(JSON.stringify(g)),before=[gardenRules.preview(g,0),gardenRules.preview(g,1)],reserves=[gardenRules.reserve(g,0),gardenRules.reserve(g,1)]
        if(outcome==='loss')prune(copy,p,[attack.id,id])
        else {
            if(copy.tiles[id].chips[p]===null)copy.tiles[id].chips[p]={born:g.players[p].moves+1,role:3}
            if(outcome==='win')prune(copy,enemy,[id])
        }
        var removed=[0,1].map(function(owner){return g.tiles.filter(function(cell){return cell.chips[owner]!==null&&copy.tiles[cell.id].chips[owner]===null}).map(function(cell){return cell.id})})
        var after=[gardenRules.preview(copy,0),gardenRules.preview(copy,1)]
        return {reason:'',attack:attack,defense:defense,outcome:outcome,target:id,tiles:copy.tiles,removed:removed,reserveDelta:[0,1].map(function(owner){return gardenRules.reserve(copy,owner)-reserves[owner]}),harvestBefore:before.map(function(v){return v.score}),harvestAfter:after.map(function(v){return v.score}),harvestReadyBefore:before.map(function(v){return v.eligible}),harvestReadyAfter:after.map(function(v){return v.eligible})}
    }
    window.gardenConflict={role:role,fighter:fighter,reason:reason,preview:preview}
})()
