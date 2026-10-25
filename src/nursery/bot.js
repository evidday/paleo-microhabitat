;(function(){'use strict';var C=nurseryConfig,R=nurseryRules;
 function choose(g){var p=g.players[g.active],enemy=g.players[1-g.active],routes=R.routes(g,g.active);routes.sort(function(a,b){var ta=g.tiles[a.goal],tb=g.tiles[b.goal],danger=enemy.control>=2;function value(r,t){return (t.grove?30:0)+(danger&&t.owner===1-g.active?30:0)-r.steps*4+(g.tiles[r.id].site==='ruin'?4:0);}return value(b,tb)-value(a,ta)||a.id-b.id;});
  if(routes.length&&(g.botStyle==='land'||p.buys>=1||p.resources[0]===1||p.resources[1]===1))return {type:'N_GROW',id:routes[0].id};
  if(g.challenge&&!p.fertilized&&p.resources[2]>=2&&R.nourishTarget(g,g.active,'revive'))return {type:'N_COMPOST',kind:'revive'};
  var count=function(role){return enemy.units.filter(function(u){return u.role===role&&!u.rest&&u.slot<C.activeSlots;}).length;};
  var offers=p.hand.map(function(c){var plan=R.hirePlan(g,g.active,c.id);if(plan.reason)return null;var counters=[count(5)+count(2),count(0),count(5),p.units.filter(function(u){return !u.rest&&u.slot<C.activeSlots;}).length>=2?1:0,count(2)+count(3)+count(5),count(1)];return {card:c.id,score:(plan.tier-1)*4+Math.min(3,counters[c.role])*2+(c.role===5?-1:0)};}).filter(Boolean).sort(function(a,b){return b.score-a.score||a.card-b.card;});
  var pair=p.units.some(function(u){return !u.rest&&u.tier<3&&p.units.filter(function(v){return !v.rest&&v.species===u.species&&v.tier===u.tier;}).length>=2;});if(pair&&p.refreshes<2&&p.resources[2]>=3&&!p.hand.some(function(c){var plan=R.hirePlan(g,g.active,c.id);return !plan.reason&&plan.consumed.length;}))return {type:'N_REROLL'};
  if(offers.length)return {type:'N_HIRE',card:offers[0].card};
  if(routes.length)return {type:'N_GROW',id:routes[0].id};
  var resting=p.units.filter(function(u){return u.rest||u.tier===1;}).sort(function(a,b){return (b.rest?1:0)-(a.rest?1:0)||a.tier-b.tier||(b.slot>=C.activeSlots?1:0)-(a.slot>=C.activeSlots?1:0)||a.id-b.id;})[0];if(p.units.length===C.slots&&resting&&p.hand.some(function(c){return R.affordable(p,C.roles[c.role].cost);}))return {type:'N_SELL',id:resting.id};
  var free=[];for(var slot=0;slot<C.activeSlots;slot++)if(!p.units.some(function(u){return u.slot===slot&&!u.rest;}))free.push(slot);var reserve=p.units.find(function(u){return u.slot>=C.activeSlots&&!u.rest;});if(reserve&&free.length)return {type:'N_MOVE',id:reserve.id,slot:free[0]};
  if(g.challenge&&R.affordable(p,C.feed)){var hungry=p.units.filter(function(u){return !u.rest&&!u.fed&&u.slot<C.activeSlots;}).sort(function(a,b){return b.tier-a.tier||a.role-b.role;})[0];if(hungry)return {type:'N_FEED',id:hungry.id};}
  return {type:'N_READY'};
 }
 function tradeAccept(g){var t=g.trade,p=t&&g.players[t.to];return !!t&&p.resources[t.take]>=t.amount&&p.resources[t.take]>p.resources[t.give];}
 window.nurseryBot={choose:choose,tradeAccept:tradeAccept};
})();
