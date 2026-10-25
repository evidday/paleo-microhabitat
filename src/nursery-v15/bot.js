;(function(){
    'use strict';var C=nurseryConfig,R=nurseryRules;
    function choose(g) {
        var p=g.players[g.active],id=g.active;
        for(var i=0;i<p.units.length;i++)if(R.pair(p,p.units[i].id))return {type:'N_MERGE',id:p.units[i].id};
        var free=[];for(var s=0;s<6;s++)if(!p.units.some(function(u){return u.slot===s;}))free.push(s);
        var land=g.tiles.filter(function(t){return !R.growReason(g,t.id,id);}).sort(function(a,b){return p.resources[a.type]-p.resources[b.type]||Math.abs(a.q)-Math.abs(b.q)||a.id-b.id;});
        if(g.botStyle==='land'&&land.length&&g.round<7)return {type:'N_GROW',id:land[0].id};
        var cards=p.hand.slice().sort(function(a,b){var dup=function(c){return p.units.some(function(u){return u.role===c.role&&u.tier===1;})?1:0;};return dup(b)-dup(a)||a.id-b.id;});
        for(var i=0;i<cards.length;i++){
            var c=cards[i],preferred=free.filter(function(slot){return c.role===2?slot>=3:slot<3;}),slot=preferred.length?preferred[0]:free[0];
            if(!R.recruitReason(g,c.id,slot,id))return {type:'N_RECRUIT',card:c.id,slot:slot};
        }
        // Repair the formation for free: ranged in the rear, melee in front.
        var bad=p.units.find(function(u){return u.role===2&&u.slot<3;}),empty=free.find(function(s){return s>=3;});
        if(bad&&empty!==undefined)return {type:'N_MOVE',id:bad.id,slot:empty};
        bad=p.units.find(function(u){return u.role!==2&&u.slot>=3;});empty=free.find(function(s){return s<3;});
        if(bad&&empty!==undefined)return {type:'N_MOVE',id:bad.id,slot:empty};
        if(land.length&&p.units.length>=3)return {type:'N_GROW',id:land[0].id};
        if(R.affordable(p,C.feed)){var hungry=p.units.filter(function(u){return !u.fed;}).sort(function(a,b){return b.tier-a.tier||a.role-b.role;})[0];if(hungry)return {type:'N_FEED',id:hungry.id};}
        return {type:'N_READY'};
    }
    window.nurseryBot={choose:choose};
})();
