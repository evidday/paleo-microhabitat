// Simultaneous continuous movement: no purchase-order priority or grid-path chasing.
;(function(){
 'use strict';
 function copy(v){return JSON.parse(JSON.stringify(v));}
 function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
 function tie(a,b,owner){return a.y-b.y||a.role-b.role||(owner===0?a.x-b.x:b.x-a.x);}
 function near(u,a,b){var d=distance(u,a)-distance(u,b);return Math.abs(d)>.000001?d:tie(a,b,u.owner);}
 function simulate(initial,environment){
  var units=copy(initial),frames=[],winner=null,criterion='',reason='',env=environment||null;
  function supported(p){if(!env||!env.grid)return true;var x=Math.round(p.x/env.step),y=Math.round(p.y/env.step);return x>=0&&x<=24&&y>=0&&y<env.rows&&!!env.grid[x*env.rows+y];}
  units.forEach(function(u){if(supported(u))return;var choices=[];for(var x=0;x<=6;x+=.25)for(var y=0;y<=4;y+=.25){var p={x:x,y:y};if(supported(p))choices.push(p);}choices.sort(function(a,b){return distance(u,a)-distance(u,b)||tie(a,b,u.owner);});if(choices.length){u.x=choices[0].x;u.y=choices[0].y;}});

  function frame(events,decisions){frames.push({units:copy(units),events:events,decisions:decisions,deaths:units.filter(function(u){return u.hp<=0&&events.some(function(e){return e.to===u.id&&e.damage>0;});}).map(function(u){return u.id;})});}
  function end(){var alive=[0,1].map(function(p){return units.some(function(u){return u.owner===p&&u.hp>0;});});if(alive[0]&&alive[1])return false;winner=alive[0]?0:alive[1]?1:-1;criterion='elimination';reason=winner<0?'Оба отряда нокаутированы одновременно.':'Один отряд остался на ногах.';return true;}
  frame([],[]);
  for(var step=0;step<36;step++){
   if(end())break;
   var alive=units.filter(function(u){return u.hp>0;}),events=[],decisions=[],moves=[],heals=[],pushes=[];
   var intents=alive.map(function(u){
    var enemies=alive.filter(function(e){return e.owner!==u.owner;}).sort(function(a,b){return near(u,a,b);}),target=enemies[0];
    if(u.reload>0){u.reload--;return {u:u,target:target,action:'reload'};}if(u.jump&&(!u.jumped||u.ability&&step%8===0&&(u.jumps||0)<u.ability+1)){target=enemies.slice().sort(function(a,b){var priority=((b.heal?5:0)+b.range)-((a.heal?5:0)+a.range),d=distance(u,b)-distance(u,a);return priority||(Math.abs(d)>.000001?d:tie(a,b,u.owner));})[0];return {u:u,target:target,action:'jump'};}
    if(u.heal&&step%2===0){var patient=alive.filter(function(a){return a.owner===u.owner&&a.hp<a.maxHp&&distance(u,a)<=u.range+.001;}).sort(function(a,b){return a.hp/a.maxHp-b.hp/b.maxHp||tie(a,b,u.owner);})[0];if(patient)return {u:u,target:patient,action:'heal'};}
    return {u:u,target:target,action:distance(u,target)<=u.range+.001?'attack':'move'};
   });
   intents.forEach(function(intent){var u=intent.u,target=intent.target,dist=distance(u,target),d={unit:u.id,target:target.id,x:u.x,y:u.y,targetX:target.x,targetY:target.y,distance:dist,range:u.range,action:intent.action};decisions.push(d);
    function hit(to,damage,kind){if(u.range>1&&intents.some(function(i){return i.u.id===to.id&&i.action==='jump';})){events.push({from:u.id,to:to.id,damage:0,absorbed:0,effective:0,kind:'evade',fromX:u.x,fromY:u.y,toX:to.x,toY:to.y,distance:distance(u,to),range:u.range});return;}var absorbed=Math.min(Math.max(0,damage-(kind==='splash'?0:1)),to.armor||0);events.push({from:u.id,to:to.id,damage:damage-absorbed,absorbed:absorbed,effective:0,kind:kind,fromX:u.x,fromY:u.y,toX:to.x,toY:to.y,distance:distance(u,to),range:u.range});}
    if(intent.action==='reload')return;if(intent.action==='heal'){heals.push({from:u.id,to:target.id,amount:u.heal});if(u.ability&&step%6===0)d.cast=nurseryConfig.abilities[u.role];if(u.ability&&step%6===0)alive.filter(function(a){return a.owner===u.owner&&a.id!==target.id&&a.hp<a.maxHp;}).slice(0,u.ability).forEach(function(a){heals.push({from:u.id,to:a.id,amount:u.heal});});return;}
    if(intent.action==='attack'){if(u.damage<=0){d.action='guard';return;}var cast=u.ability&&step%3===0,bonus=cast&&(u.role===1||u.role===5)?u.ability:0;hit(target,u.damage+bonus,u.range>1?'spore':'melee');if(cast&&u.role===2){var acid=events[events.length-1];acid.acid=u.ability;}if(cast)d.cast=nurseryConfig.abilities[u.role];if(u.role===1)u.punches=(u.punches||0)+1;if(u.role===1&&u.damage>=5&&u.punches%3===0)pushes.push({from:u.id,to:target.id,x:(target.x-u.x)/(dist||1)*.45/(1+(target.armor||0)*.25),y:(target.y-u.y)/(dist||1)*.45/(1+(target.armor||0)*.25)});if(u.splash){u.reload=1;alive.filter(function(e){return e.owner!==u.owner&&e.id!==target.id&&distance(e,target)<=(u.splashRadius||1.65);}).sort(function(a,b){return distance(a,target)-distance(b,target)||tie(a,b,u.owner);}).slice(0,2).forEach(function(e){hit(e,Math.max(1,Math.floor(u.damage/2)),'splash');});}return;}
    if(intent.action==='jump'){if(u.jumped)d.cast=nurseryConfig.abilities[u.role];
     var candidates=[{x:target.x+(u.owner===0?-.85:.85),y:target.y},{x:target.x,y:target.y+.85},{x:target.x,y:target.y-.85}];
     var spot=candidates.find(function(p){return p.x>=0&&p.x<=6&&p.y>=0&&p.y<=4&&supported(p)&&!alive.some(function(v){return v.id!==u.id&&distance(p,v)<.7;});});
     if(spot){moves.push({id:u.id,x:spot.x,y:spot.y});d.endX=spot.x;d.endY=spot.y;}else d.action='move';u.jumped=true;u.jumps=(u.jumps||0)+1;
     if(spot)return;
    }
    var other=intents.find(function(i){return i.u.id===target.id;}),closing=other&&(other.action==='move')?2:1;
    var amount=Math.min(u.move||.85,Math.max(0,(dist-u.range)/closing));moves.push({id:u.id,x:u.x+(target.x-u.x)/(dist||1)*amount,y:u.y+(target.y-u.y)/(dist||1)*amount});d.endX=moves[moves.length-1].x;d.endY=moves[moves.length-1].y;
   });
   function fall(u,from){if(events.some(function(e){return e.to===u.id&&e.kind==='fall';}))return;u.fell=true;events.push({from:from===undefined?u.id:from,to:u.id,damage:u.hp,absorbed:0,effective:0,kind:'fall',fromX:u.x,fromY:u.y,toX:u.x,toY:u.y,distance:0,range:0});}
   moves.forEach(function(m){var u=units.find(function(u){return u.id===m.id;}),d=decisions.find(function(d){return d.unit===u.id;}),dx=m.x-u.x,dy=m.y-u.y,len=Math.hypot(dx,dy)||1;u.walked=(u.walked||0)+(len>.1?1:0);if(env&&env.ground===0&&!u.grip&&u.walked%3===0&&len>.1){m.x=u.x-dy/len*.45;m.y=u.y+dx/len*.45;d.action='slip';events.push({from:u.id,to:u.id,damage:0,effective:0,kind:'slip',fromX:u.x,fromY:u.y,toX:m.x,toY:m.y});if(!supported(m)){u.x=m.x;u.y=m.y;fall(u);return;}}else if(!supported(m)){var alternatives=[{x:m.x-dy/len*.6,y:m.y+dx/len*.6},{x:m.x+dy/len*.6,y:m.y-dx/len*.6},{x:u.x,y:u.y}],safe=alternatives.find(function(p){return p.x>=0&&p.x<=6&&p.y>=0&&p.y<=4&&supported(p);});m=safe||u;d.action='sidestep';}u.x=m.x;u.y=m.y;d.endX=u.x;d.endY=u.y;});

   // Pairwise corrections are accumulated before applying, so array order cannot select a winner.
   for(var pass=0;pass<2;pass++){
    var shifts=alive.map(function(u){return {id:u.id,x:0,y:0};});
    for(var i=0;i<alive.length;i++)for(var j=i+1;j<alive.length;j++){
     var a=alive[i],b=alive[j],dist=distance(a,b);if(dist>=nurseryConfig.separation)continue;
     var dx=(a.x-b.x)/(dist||1),dy=(a.y-b.y)/(dist||1);if(dist<.00001){if(a.owner!==b.owner){dx=a.owner===0?-1:1;dy=0;}else{dx=0;dy=a.id%100<b.id%100?-1:1;}}
     var push=(nurseryConfig.separation-dist)/2;shifts[i].x+=dx*push;shifts[i].y+=dy*push;shifts[j].x-=dx*push;shifts[j].y-=dy*push;
    }
    shifts.forEach(function(s){var u=units.find(function(u){return u.id===s.id;});var p={x:Math.max(0,Math.min(6,u.x+s.x)),y:Math.max(0,Math.min(4,u.y+s.y))};if(supported(p)){u.x=p.x;u.y=p.y;}});
   }
   pushes.forEach(function(push){var u=units.find(function(u){return u.id===push.to;}),p={x:Math.max(0,Math.min(6,u.x+push.x)),y:Math.max(0,Math.min(4,u.y+push.y))};u.x=p.x;u.y=p.y;if(!supported(p))fall(u,push.from);});
   units.forEach(function(u){u.x=Math.round(u.x*1000000)/1000000;u.y=Math.round(u.y*1000000)/1000000;});
   units.forEach(function(target){var hits=events.filter(function(e){return e.to===target.id;}),total=hits.reduce(function(n,e){return n+e.damage;},0),effective=Math.min(target.hp,total);hits.forEach(function(e){e.effective=total?effective*e.damage/total:0;});target.hp=Math.max(0,target.hp-total);});
   events.filter(function(e){return e.acid&&e.damage>0;}).forEach(function(e){var target=units.find(function(u){return u.id===e.to;});target.armor=Math.max(0,(target.armor||0)-e.acid);});
   heals.forEach(function(h){var target=units.find(function(u){return u.id===h.to;});if(target.hp<=0)return;var amount=Math.min(h.amount,target.maxHp-target.hp);if(!amount)return;target.hp+=amount;events.push({from:h.from,to:h.to,damage:0,heal:amount,effective:0,kind:'heal'});});
   frame(events,decisions);
  }
  if(winner===null&&!end()){var hp=[0,1].map(function(p){return units.filter(function(u){return u.owner===p;}).reduce(function(n,u){return n+u.hp/u.maxHp;},0);});winner=Math.abs(hp[0]-hp[1])<.00001?-1:hp[0]>hp[1]?0:1;criterion='health';reason='Лимит 36 шагов: оставшееся здоровье '+hp.map(function(n){return n.toFixed(2);}).join(' : ')+'.';}
  var fighters=initial.map(function(u){var end=units.find(function(v){return v.id===u.id;}),mine=frames.flatMap(function(f){return f.events;}).filter(function(e){return e.from===u.id;});return Object.assign({},u,{hp:end.hp,dealt:mine.reduce(function(n,e){return n+e.effective;},0),healed:mine.reduce(function(n,e){return n+(e.heal||0);},0),hits:mine.filter(function(e){return e.damage>0;}).length,spores:mine.filter(function(e){return e.kind==='spore';}).length,taken:Math.max(0,u.hp-end.hp)});});
  return {environment:env,frames:frames,winner:winner,reason:reason,criterion:criterion,summary:{steps:frames.length-1,fighters:fighters,teams:[0,1].map(function(p){var team=fighters.filter(function(u){return u.owner===p;});return {initial:team.length,alive:team.filter(function(u){return u.hp>0;}).length,hp:team.reduce(function(n,u){return n+u.hp;},0),maxHp:team.reduce(function(n,u){return n+u.maxHp;},0),dealt:team.reduce(function(n,u){return n+u.dealt;},0),healed:team.reduce(function(n,u){return n+u.healed;},0)};})}};
 }
 window.nurseryCombat={simulate:simulate,distance:distance};
})();
