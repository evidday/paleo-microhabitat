;(function(){
 'use strict';var C=nurseryConfig,R=nurseryRules;
 function choose(g){var p=g.players[g.active],enemy=g.players[1-g.active],land=g.tiles.filter(function(t){return !R.growReason(g,t.id,g.active);}).sort(function(a,b){return Math.abs(a.q)-Math.abs(b.q)||a.id-b.id;});
  if(g.botStyle==='land'&&land.length&&g.round<=3)return {type:'N_GROW',id:land[0].id,terrain:p.resources.indexOf(Math.min.apply(null,p.resources))};
  if(!p.hired){var count=function(role){return enemy.units.filter(function(u){return u.role===role;}).length;};var offers=p.hand.map(function(c){var plan=R.hirePlan(g,g.active,c.id);if(plan.reason)return null;var same=p.units.some(function(u){return u.role===c.role;});var counters=[count(2),count(0),count(5),p.units.length>=2?1:0,count(2)+count(3),count(0)+count(1)];var score=(plan.tier-1)*3+(same?0:2)+Math.min(2,counters[c.role])*2;if(c.role===3&&p.units.every(function(u){return u.role===3;}))score-=4;return {card:c.id,score:score};}).filter(Boolean).sort(function(a,b){return b.score-a.score||a.card-b.card;});if(offers.length)return {type:'N_HIRE',card:offers[0].card};}
  var free=[];for(var s=0;s<6;s++)if(!p.units.some(function(u){return u.slot===s;}))free.push(s);
  var bad=p.units.find(function(u){return C.roles[u.role].range>1&&u.slot<3;}),slot=free.find(function(s){return s>=3;});if(bad&&slot!==undefined)return {type:'N_MOVE',id:bad.id,slot:slot};
  bad=p.units.find(function(u){return C.roles[u.role].range===1&&u.slot>=3;});slot=free.find(function(s){return s<3;});if(bad&&slot!==undefined)return {type:'N_MOVE',id:bad.id,slot:slot};
  if(land.length&&p.hired)return {type:'N_GROW',id:land[0].id,terrain:p.resources.indexOf(Math.min.apply(null,p.resources))};
  if(R.affordable(p,C.feed)){var hungry=p.units.filter(function(u){return !u.fed;}).sort(function(a,b){return b.tier-a.tier||a.role-b.role;})[0];if(hungry)return {type:'N_FEED',id:hungry.id};}
  return {type:'N_READY'};
 }
 window.nurseryBot={choose:choose};
})();
