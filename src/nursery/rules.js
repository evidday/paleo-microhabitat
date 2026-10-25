;(function () {
    'use strict';
    var C = nurseryConfig;
    function tileKnown(g,t,p){return t.base>=0||t.owner===p||!!(t.revealed&&t.revealed[p]);}
    function adjacent(a,b) { return Math.max(Math.abs(a.q-b.q),Math.abs(a.r-b.r),Math.abs(a.q+a.r-b.q-b.r))===1; }
    function affordable(p,cost) { return cost.every(function(n,i){return p.resources[i]>=n;}); }
    function stats(p,u) {
        var r=C.roles[u.role], rank=C.ranks[u.tier-1];
        return {hp:Math.round(r.hp*rank.hp)+(u.fed?2:0),damage:Math.round(r.damage*rank.damage)+(u.fed?1:0),range:r.range,armor:r.armor?(r.armor+u.tier-1):0,heal:r.heal?Math.round(r.heal*rank.damage):0,jump:!!r.jump,splash:!!r.splash};
    }
    function income(g,p) {
        var n=C.income.slice();g.tiles.forEach(function(t){if(t.owner===p&&t.base<0)n[t.type]++;});return n;
    }
    function growReason(g,id,p) {
        var t=g.tiles[id];if(!t)return 'Выберите участок';if(g.players[p].grew)return 'В этом раунде сеть уже разрослась';
        if(!g.tiles.some(function(a){return a.owner===p&&adjacent(a,t);}))return 'Нужен сосед вашего мицелия';
        if(t.owner>=0)return 'Этот участок уже занят';
        if(!affordable(g.players[p],C.grow))return 'Нужно 1 воды и 1 перегноя';return '';
    }
    function recruitReason(g,cardId,slot,p) {
        var player=g.players[p],card=player.hand.find(function(c){return c.id===cardId;});
        if(!card)return 'Выберите карту';if(!Number.isInteger(slot)||slot<0||slot>=C.slots)return 'Выберите свободное место';
        if(player.units.some(function(u){return u.slot===slot;}))return 'Место занято: выберите пустое';
        if(!affordable(player,C.roles[card.role].cost))return 'Не хватает ресурсов: карта останется в руке';return '';
    }
    function pair(p,id) {var a=p.units.find(function(u){return u.id===id;});return a&&a.tier<3?p.units.find(function(u){return u.id!==id&&u.role===a.role&&u.tier===a.tier;}):null;}
    function hirePlan(g,p,cardId){
        var player=g.players[p],card=player.hand.find(function(c){return c.id===cardId;});
        if(!card)return {reason:'Выберите предложение'};
        if(player.hired)return {reason:'В этом раунде гриб уже выбран'};
        var tier=1,consumed=[];
        while(tier<3){var match=player.units.find(function(u){return u.role===card.role&&u.tier===tier&&consumed.indexOf(u.id)<0;});if(!match)break;consumed.push(match.id);tier++;}
        var slots=[];for(var s=0;s<C.slots;s++)if(!player.units.some(function(u){return u.slot===s;}))slots.push(s);
        if(!consumed.length&&!slots.length)return {reason:'Питомник полон: продайте одного бойца'};
        if(!affordable(player,C.roles[card.role].cost))return {reason:'Не хватает припасов'};
        var preferred=slots.filter(function(s){return C.roles[card.role].range>1?s>=3:s<3;});
        return {reason:'',tier:tier,fed:player.units.some(function(u){return consumed.indexOf(u.id)>=0&&u.fed;}),consumed:consumed,slot:consumed.length?player.units.find(function(u){return u.id===consumed[0];}).slot:preferred.length?preferred[0]:slots[0],role:card.role};
    }
    function initial(g) {
        return g.players.flatMap(function(p,owner){return p.units.slice().sort(function(a,b){return a.slot-b.slot;}).map(function(u){
            var s=stats(p,u),front=u.slot<3;
            return Object.assign({id:owner*100+u.slot,sourceId:u.id,owner:owner,role:u.role,tier:u.tier,faction:p.faction,fed:u.fed,look:u.look,
                x:owner===0?(front?2:0):(front?4:6),y:(u.slot%3)*2,hp:s.hp,maxHp:s.hp},s);
        });});
    }
    function forecast(g) { return nurseryCombat.simulate(initial(g)); }
    window.nurseryRules={tileKnown:tileKnown,adjacent:adjacent,affordable:affordable,stats:stats,income:income,growReason:growReason,recruitReason:recruitReason,pair:pair,hirePlan:hirePlan,initial:initial,forecast:forecast};
})();
