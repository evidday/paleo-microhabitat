;(function () {
    'use strict';
    var C = nurseryConfig;
    function adjacent(a,b) { return Math.max(Math.abs(a.q-b.q),Math.abs(a.r-b.r),Math.abs(a.q+a.r-b.q-b.r))===1; }
    function affordable(p,cost) { return cost.every(function(n,i){return p.resources[i]>=n;}); }
    function stats(p,u) {
        var r=C.roles[u.role], rank=C.ranks[u.tier-1];
        return {hp:r.hp+rank.hp+(p.faction===0&&u.role===0?3:0)+(p.faction===2&&u.role===1?2:0)+(p.faction===3?1:0)+(u.fed?2:0),
            damage:r.damage+rank.damage+(p.faction===1&&u.role===2?1:0)+(u.fed?1:0),range:r.range};
    }
    function income(g,p) {
        var n=C.income.slice();g.tiles.forEach(function(t){if(t.owner===p&&t.base<0)n[t.type]++;});return n;
    }
    function growReason(g,id,p) {
        var t=g.tiles[id];if(!t)return 'Выберите участок';if(g.players[p].grew)return 'В этом раунде сеть уже разрослась';
        if(t.owner>=0)return 'Этот участок уже занят';
        if(!g.tiles.some(function(a){return a.owner===p&&adjacent(a,t);}))return 'Нужен сосед вашего мицелия';
        if(!affordable(g.players[p],C.grow))return 'Нужно 1 воды и 1 перегноя';return '';
    }
    function recruitReason(g,cardId,slot,p) {
        var player=g.players[p],card=player.hand.find(function(c){return c.id===cardId;});
        if(!card)return 'Выберите карту';if(!Number.isInteger(slot)||slot<0||slot>=C.slots)return 'Выберите свободное место';
        if(player.units.some(function(u){return u.slot===slot;}))return 'Место занято: выберите пустое';
        if(!affordable(player,C.roles[card.role].cost))return 'Не хватает ресурсов: карта останется в руке';return '';
    }
    function pair(p,id) {var a=p.units.find(function(u){return u.id===id;});return a&&a.tier<3?p.units.find(function(u){return u.id!==id&&u.role===a.role&&u.tier===a.tier;}):null;}
    function initial(g) {
        return g.players.flatMap(function(p,owner){return p.units.map(function(u){
            var s=stats(p,u),front=u.slot<3;
            return {id:u.id,owner:owner,role:u.role,tier:u.tier,faction:p.faction,fed:u.fed,look:u.look,
                x:owner===0?(front?2:0):(front?4:6),y:(u.slot%3)*2,hp:s.hp,maxHp:s.hp,damage:s.damage,range:s.range};
        });});
    }
    function forecast(g) { return battleSystem.simulate(initial(g),{holdContact:true}); }
    window.nurseryRules={adjacent:adjacent,affordable:affordable,stats:stats,income:income,growReason:growReason,recruitReason:recruitReason,pair:pair,initial:initial,forecast:forecast};
})();
