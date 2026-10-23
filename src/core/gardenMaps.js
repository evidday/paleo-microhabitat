;(function() {
    'use strict'
    function distance(a, b) {
        return Math.max(Math.abs(a.q-b.q), Math.abs(a.r-b.r), Math.abs(a.q+a.r-b.q-b.r))
    }
    function connected(tiles) {
        if (!tiles.length) return false
        var seen = new Set([tiles[0]]), queue = [tiles[0]]
        while (queue.length) {
            var from = queue.shift()
            tiles.forEach(function(t) { if (!seen.has(t) && distance(from,t)===1) { seen.add(t); queue.push(t) } })
        }
        return seen.size === tiles.length
    }
    function generate(request) {
        var ids = ['rain','wind','pickers']
        var id = request === 'random' ? ids[store.prng.next(0,ids.length-1)] : request
        if (!gardenConfig.maps[id] || id === 'random') id = 'rain'
        var cfg = gardenConfig.maps[id], radius = cfg.radius
        var bases = [{q:-radius,r:0},{q:radius,r:0}], coords = []
        for (var r=-radius;r<=radius;r++) for(var q=-radius;q<=radius;q++) {
            if (Math.abs(q+r)>radius) continue
            if (cfg.shape==='neck' && q===0 && Math.abs(r)>1) continue
            coords.push({q:q,r:r})
        }
        // Ragged outer boundary; keep both openings and never disconnect the board.
        if (cfg.shape==='ragged') {
            var edges=coords.filter(function(t) {return t.q<0 && distance(t,{q:0,r:0})===radius && bases.every(function(b){return distance(t,b)>1})})
            edges.forEach(function(t) {
                if(store.prng.next(0,9)>5) return
                var remaining=coords.filter(function(c){return !(c.q===t.q&&c.r===t.r || c.q===-t.q&&c.r===-t.r)})
                if(connected(remaining)) coords=remaining
            })
        }
        var total=cfg.weights.reduce(function(a,b){return a+b},0)
        function biome() {
            var roll=store.prng.next(1,total)
            for(var i=0;i<3;i++){roll-=cfg.weights[i];if(roll<=0)return i}
            return 2
        }
        var tiles=coords.map(function(t,i){return {id:i,q:t.q,r:t.r,type:0,base:-1,chips:[null,null],fertile:false,look:{hat:store.prng.next(0,3),eyes:store.prng.next(0,2),mouth:store.prng.next(0,1),extra:store.prng.next(0,2),color:0},decor:store.prng.next(0,3)}})
        tiles.forEach(function(t){if(t.q<=0){t.type=biome();var mirror=tiles.find(function(m){return m.q===-t.q&&m.r===-t.r});if(mirror)mirror.type=t.type}})
        var baseIds=bases.map(function(b,p){var t=tiles.find(function(t){return t.q===b.q&&t.r===b.r});t.base=p;return t.id})
        var shift=store.prng.next(0,2)
        tiles.filter(function(t){return distance(t,bases[0])===1}).forEach(function(t,i){t.type=(i+shift)%3;tiles.find(function(m){return m.q===-t.q&&m.r===-t.r}).type=t.type})
        // Keep the advertised condition visible even on an unlucky weighted roll.
        var dominant=cfg.weights.indexOf(Math.max.apply(null,cfg.weights)),minimum=Math.floor(tiles.length*.52)
        var candidates=tiles.filter(function(t){return t.q<0 && t.type!==dominant && bases.every(function(b){return distance(t,b)>1})})
        while(tiles.filter(function(t){return t.type===dominant}).length<minimum && candidates.length){
            var index=store.prng.next(0,candidates.length-1),spot=candidates.splice(index,1)[0]
            spot.type=dominant
            tiles.find(function(t){return t.q===-spot.q&&t.r===-spot.r}).type=dominant
        }
        var fertile
        if(id==='wind') fertile=[[0,-1],[0,0],[0,1]]
        else if(id==='pickers') {
            var side=store.prng.next(0,1)?1:-1
            fertile=[[-1,side],[1,-side]]
        } else {
            var candidates=tiles.filter(function(t){return t.q<0 && distance(t,{q:0,r:0})<=2 && bases.every(function(b){return distance(t,b)>1})})
            var spot=candidates[store.prng.next(0,candidates.length-1)]
            fertile=[[spot.q,spot.r],[-spot.q,-spot.r],[0,store.prng.next(-1,1)]]
        }
        fertile.forEach(function(pos){var t=tiles.find(function(t){return t.q===pos[0]&&t.r===pos[1]});if(t)t.fertile=true})
        return {tiles:tiles,bases:baseIds,info:{request:request,id:id,name:cfg.name,description:cfg.description,radius:radius,counts:[0,1,2].map(function(i){return tiles.filter(function(t){return t.type===i}).length})}}
    }
    window.gardenMaps = { generate: generate }
})()
