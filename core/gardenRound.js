;(function(){
 'use strict';var C=gardenConfig;
 function ring(g){return g.tiles.find(function(t){return t.q===0&&t.r===0})||g.tiles.find(function(t){return t.fertile})}
 function preview(g){
  var terrain=ring(g),attacker=g.centerOwner>=0?1-g.centerOwner:g.roundFirst,teams=[[],[]];
  for(var p=0;p<2;p++){
   teams[p]=gardenRules.owned(g,p).map(function(t){return gardenConflict.fighter(g,t,p,p===attacker,terrain)}).sort(function(a,b){return b.power-a.power||Math.abs(g.tiles[a.id].q)-Math.abs(g.tiles[b.id].q)||a.id-b.id}).slice(0,C.round.squad);
   if(!teams[p].length){var base=g.tiles[g.bases[p]],kingdom=C.kingdoms[g.players[p].faction].role===3?1:0;teams[p]=[{owner:p,id:base.id,tier:1,role:3,base:2,bonus:0,home:0,kingdom:kingdom,power:2+kingdom,look:base.look,decor:base.decor,envoy:true}]}
  }
  var powers=teams.map(function(team){return team.reduce(function(sum,f){return sum+f.power},0)}),defender=1-attacker,outcome=powers[attacker]>powers[defender]?'win':powers[attacker]<powers[defender]?'loss':'draw';
  var harvest=[gardenRules.preview(g,0).score,gardenRules.preview(g,1).score];
  return {arena:true,round:g.round,target:terrain.id,attack:teams[attacker][0],defense:teams[defender][0],teams:teams,teamPower:powers,winner:outcome==='draw'?-1:outcome==='win'?attacker:defender,outcome:outcome,reason:'',removed:[[],[]],reserveDelta:[0,0],harvestBefore:harvest,harvestAfter:harvest.slice(),newClaim:false};
 }
 window.gardenRound={afterHarvest:function(g,p){var copy=JSON.parse(JSON.stringify(g));copy.tiles.forEach(function(t){t.chips[p]=null});return preview(copy)},preview:preview,ring:ring};
})()
