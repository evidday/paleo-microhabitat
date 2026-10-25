// Simultaneous continuous movement: no purchase-order priority or grid-path chasing.
;(function(){
 'use strict';
 function copy(v){return JSON.parse(JSON.stringify(v));}
 function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
 function tie(a,b,owner){return a.y-b.y||a.role-b.role||(owner===0?a.x-b.x:b.x-a.x);}
 function near(u,a,b){var d=distance(u,a)-distance(u,b);return Math.abs(d)>.000001?d:tie(a,b,u.owner);}
 function simulate(initial){
  var units=copy(initial),frames=[],winner=null,criterion='',reason='';
  function frame(events,decisions){frames.push({units:copy(units),events:events,decisions:decisions,deaths:units.filter(function(u){return u.hp<=0&&events.some(function(e){return e.to===u.id&&e.damage>0;});}).map(function(u){return u.id;})});}
  function end(){var alive=[0,1].map(function(p){return units.some(function(u){return u.owner===p&&u.hp>0;});});if(alive[0]&&alive[1])return false;winner=alive[0]?0:alive[1]?1:-1;criterion='elimination';reason=winner<0?'Оба отряда нокаутированы одновременно.':'Один отряд остался на ногах.';return true;}
  frame([],[]);
  for(var step=0;step<36;step++){
   if(end())break;
   var alive=units.filter(function(u){return u.hp>0;}),events=[],decisions=[],moves=[],heals=[];
   var intents=alive.map(function(u){
    var enemies=alive.filter(function(e){return e.owner!==u.owner;}).sort(function(a,b){return near(u,a,b);}),target=enemies[0];
    if(u.jump&&!u.jumped){target=enemies.slice().sort(function(a,b){var priority=((b.heal?5:0)+b.range)-((a.heal?5:0)+a.range),d=distance(u,b)-distance(u,a);return priority||(Math.abs(d)>.000001?d:tie(a,b,u.owner));})[0];return {u:u,target:target,action:'jump'};}
    if(u.heal&&step%2===0){var patient=alive.filter(function(a){return a.owner===u.owner&&a.hp<a.maxHp&&distance(u,a)<=u.range+.001;}).sort(function(a,b){return a.hp/a.maxHp-b.hp/b.maxHp||tie(a,b,u.owner);})[0];if(patient)return {u:u,target:patient,action:'heal'};}
    return {u:u,target:target,action:distance(u,target)<=u.range+.001?'attack':'move'};
   });
   intents.forEach(function(intent){var u=intent.u,target=intent.target,dist=distance(u,target),d={unit:u.id,target:target.id,x:u.x,y:u.y,targetX:target.x,targetY:target.y,distance:dist,range:u.range,action:intent.action};decisions.push(d);
    function hit(to,damage,kind){var absorbed=Math.min(Math.max(0,damage-1),to.armor||0);events.push({from:u.id,to:to.id,damage:damage-absorbed,absorbed:absorbed,effective:0,kind:kind,fromX:u.x,fromY:u.y,toX:to.x,toY:to.y,distance:distance(u,to),range:u.range});}
    if(intent.action==='heal'){heals.push({from:u.id,to:target.id,amount:u.heal});return;}
    if(intent.action==='attack'){hit(target,u.damage,u.range>1?'spore':'melee');if(u.splash)alive.filter(function(e){return e.owner!==u.owner&&e.id!==target.id&&distance(e,target)<=1.65;}).forEach(function(e){hit(e,Math.max(1,Math.floor(u.damage/2)),'splash');});return;}
    if(intent.action==='jump'){
     var candidates=[{x:target.x+(u.owner===0?-.85:.85),y:target.y},{x:target.x,y:target.y+.85},{x:target.x,y:target.y-.85}];
     var spot=candidates.find(function(p){return p.x>=0&&p.x<=6&&p.y>=0&&p.y<=4&&!alive.some(function(v){return v.id!==u.id&&distance(p,v)<.7;});});
     if(spot){moves.push({id:u.id,x:spot.x,y:spot.y});d.endX=spot.x;d.endY=spot.y;}else d.action='move';u.jumped=true;
     if(spot)return;
    }
    var other=intents.find(function(i){return i.u.id===target.id;}),closing=other&&(other.action==='move')?2:1;
    var amount=Math.min(.85,Math.max(0,(dist-u.range)/closing));moves.push({id:u.id,x:u.x+(target.x-u.x)/(dist||1)*amount,y:u.y+(target.y-u.y)/(dist||1)*amount});d.endX=moves[moves.length-1].x;d.endY=moves[moves.length-1].y;
   });
   moves.forEach(function(m){var u=units.find(function(u){return u.id===m.id;});u.x=m.x;u.y=m.y;});
   // Pairwise corrections are accumulated before applying, so array order cannot select a winner.
   for(var pass=0;pass<2;pass++){
    var shifts=alive.map(function(u){return {id:u.id,x:0,y:0};});
    for(var i=0;i<alive.length;i++)for(var j=i+1;j<alive.length;j++){
     var a=alive[i],b=alive[j],dist=distance(a,b);if(dist>=.72)continue;
     var dx=(a.x-b.x)/(dist||1),dy=(a.y-b.y)/(dist||1);if(dist<.00001){if(a.owner!==b.owner){dx=a.owner===0?-1:1;dy=0;}else{dx=0;dy=a.id%100<b.id%100?-1:1;}}
     var push=(.72-dist)/2;shifts[i].x+=dx*push;shifts[i].y+=dy*push;shifts[j].x-=dx*push;shifts[j].y-=dy*push;
    }
    shifts.forEach(function(s){var u=units.find(function(u){return u.id===s.id;});u.x=Math.max(0,Math.min(6,u.x+s.x));u.y=Math.max(0,Math.min(4,u.y+s.y));});
   }
   units.forEach(function(u){u.x=Math.round(u.x*1000000)/1000000;u.y=Math.round(u.y*1000000)/1000000;});
   units.forEach(function(target){var hits=events.filter(function(e){return e.to===target.id;}),total=hits.reduce(function(n,e){return n+e.damage;},0),effective=Math.min(target.hp,total);hits.forEach(function(e){e.effective=total?effective*e.damage/total:0;});target.hp=Math.max(0,target.hp-total);});
   heals.forEach(function(h){var target=units.find(function(u){return u.id===h.to;});if(target.hp<=0)return;var amount=Math.min(h.amount,target.maxHp-target.hp);if(!amount)return;target.hp+=amount;events.push({from:h.from,to:h.to,damage:0,heal:amount,effective:0,kind:'heal'});});
   frame(events,decisions);
  }
  if(winner===null&&!end()){var hp=[0,1].map(function(p){return units.filter(function(u){return u.owner===p;}).reduce(function(n,u){return n+u.hp/u.maxHp;},0);});winner=Math.abs(hp[0]-hp[1])<.00001?-1:hp[0]>hp[1]?0:1;criterion='health';reason='Лимит 36 шагов: оставшееся здоровье '+hp.map(function(n){return n.toFixed(2);}).join(' : ')+'.';}
  var fighters=initial.map(function(u){var end=units.find(function(v){return v.id===u.id;}),mine=frames.flatMap(function(f){return f.events;}).filter(function(e){return e.from===u.id;});return Object.assign({},u,{hp:end.hp,dealt:mine.reduce(function(n,e){return n+e.effective;},0),healed:mine.reduce(function(n,e){return n+(e.heal||0);},0),hits:mine.filter(function(e){return e.damage>0;}).length,spores:mine.filter(function(e){return e.kind==='spore';}).length,taken:Math.max(0,u.hp-end.hp)});});
  return {frames:frames,winner:winner,reason:reason,criterion:criterion,summary:{steps:frames.length-1,fighters:fighters,teams:[0,1].map(function(p){var team=fighters.filter(function(u){return u.owner===p;});return {initial:team.length,alive:team.filter(function(u){return u.hp>0;}).length,hp:team.reduce(function(n,u){return n+u.hp;},0),maxHp:team.reduce(function(n,u){return n+u.maxHp;},0),dealt:team.reduce(function(n,u){return n+u.dealt;},0),healed:team.reduce(function(n,u){return n+u.healed;},0)};})}};
 }
 window.nurseryCombat={simulate:simulate,distance:distance};
})();
