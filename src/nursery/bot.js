;(function(){'use strict';var C=nurseryConfig,R=nurseryRules;
 function choose(g){var p=g.players[g.active],enemy=g.players[1-g.active],legal=g.tiles.filter(function(t){return !R.growReason(g,t.id,g.active);});
  function landScore(t){var near=R.supplied(g,g.active).reduce(function(n,id){return Math.min(n,R.distance(g.tiles[id],t));},99),support=R.support(g,g.active);return (t.site==='ruin'?7:t.site==='spring'?5:t.site==='market'&&R.bankRate(g,g.active)>2?4:0)+(support[t.type]?0:3)+(p.resources[t.type]===Math.min.apply(null,p.resources)?2:0)-near;}
  legal.sort(function(a,b){return landScore(b)-landScore(a)||a.id-b.id;});
  if(legal.length&&g.botStyle==='land')return {type:'N_GROW',id:legal[0].id};
  var visible=R.tileKnown(g,g.tiles[enemy.front],g.active),count=function(role){return visible?enemy.units.filter(function(u){return u.role===role&&!u.rest&&u.slot<C.activeSlots;}).length:0;};
  var offers=p.hand.map(function(c){var plan=R.hirePlan(g,g.active,c.id);if(plan.reason)return null;var counters=[count(2),count(0),count(5),p.units.filter(function(u){return !u.rest&&u.slot<C.activeSlots;}).length>=2?1:0,count(2)+count(3),count(0)+count(1)];return {card:c.id,score:(plan.tier-1)*3+Math.min(2,counters[c.role])*2};}).filter(Boolean).sort(function(a,b){return b.score-a.score||a.card-b.card;});
  if(offers.length)return {type:'N_HIRE',card:offers[0].card};
  if(legal.length)return {type:'N_GROW',id:legal[0].id};
  var resting=p.units.filter(function(u){return u.rest;}).sort(function(a,b){return a.tier-b.tier||a.id-b.id;})[0];if(p.units.length===C.slots&&resting&&p.hand.length)return {type:'N_SELL',id:resting.id};
  var free=[];for(var slot=0;slot<C.activeSlots;slot++)if(!p.units.some(function(u){return u.slot===slot&&!u.rest;}))free.push(slot);var reserve=p.units.find(function(u){return u.slot>=C.activeSlots&&!u.rest;});if(reserve&&free.length)return {type:'N_MOVE',id:reserve.id,slot:free[0]};
  if(R.affordable(p,C.feed)){var hungry=p.units.filter(function(u){return !u.rest&&!u.fed&&u.slot<C.activeSlots;}).sort(function(a,b){return b.tier-a.tier||a.role-b.role;})[0];if(hungry)return {type:'N_FEED',id:hungry.id};}
  return {type:'N_READY'};
 }
 function tradeAccept(g){var t=g.trade,p=t&&g.players[t.to];return !!t&&p.resources[t.take]>=t.amount&&p.resources[t.take]>p.resources[t.give];}
 window.nurseryBot={choose:choose,tradeAccept:tradeAccept};
})();
