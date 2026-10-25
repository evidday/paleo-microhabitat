// One continuous world. Camera focus and animation never change the game state.
;(function(){
 'use strict';
 var gpu=null,g=null,key='',items=[],actors=[],land=null,shared={},last=0,cursor=0,previous=null,paused=false,speed=1,introUntil=0,frameKey='',lastBattle=null,priorPhase='',returnAt=-9999;
 var cameraGoal=null,cameraMode='',positions={},G=lowPolyGL.Geometry,W=nurseryWorld,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function clamp(v){return Math.max(0,Math.min(1,v));}function mix(a,b,t){return a+(b-a)*t;}function ease(t){t=clamp(t);return t*t*(3-2*t);}
 function faction(p){return Object.assign({},config.colony.factions[g.players[p].faction],{color:nurseryConfig.teamColors[g.players[p].faction]});}
 function mesh(geo){var m=gpu.mesh(geo);items.push(m);return m;}
 function geometry(fn){var geo=new G();fn(geo);return mesh(geo);}
 function clear(){if(gpu)items.forEach(function(m){gpu.remove(m);});items=[];actors=[];shared={};}
 function body(u,p,detached){var geo=new G();nurseryModels.make(geo,faction(p),u.role,u.id%3,false,detached,u.tier,u.look);if(detached)for(var i=0;i<geo.data.length;i+=9){geo.data[i]*=.7;geo.data[i+1]*=.8;geo.data[i+2]*=.7;}return mesh(geo);}
 function busy(){return g.phase==='battle'||g.phase==='result'||g.phase==='over';}
 function build(){
  clear();if(!gpu||!g.players)return;
  land=geometry(function(geo){
   g.tiles.forEach(function(t){var viewer=g.mode==='solo'?0:g.active,known=nurseryRules.tileKnown(g,t,viewer)&&t.owner>=0,p=W.hex(t),v=[];for(var i=0;i<6;i++){var a=i*Math.PI/3;v.push([p.x+Math.cos(a)*.96,.01,p.z+Math.sin(a)*.96]);}
    for(var i=0;i<6;i++){geo.triangle([p.x,.01,p.z],v[(i+1)%6],v[i],!known?(busy()?'#795d96':'#b17bd6'):busy()?['#6e9aa0','#91ac73','#a28bb5'][t.type]:nurseryConfig.terrainPalette[t.type][(i+t.decor)%3]);geo.quad(v[i],[v[i][0],-.3,v[i][2]],[v[(i+1)%6][0],-.3,v[(i+1)%6][2]],v[(i+1)%6],'#4e365d');}
    if(known&&!busy()&&t.type===0){geo.frustum(p.x+.3,.03,p.z-.2,.32,.32,.01,10,'#97dce1');for(var n=0;n<3;n++)geo.branch([p.x+.1+n*.08,.03,p.z-.4],[p.x+.08+n*.08,.27,p.z-.42],.014,'#4f8167');}
    if(!busy()&&t.type===1){geo.frustum(p.x+.24,.03,p.z-.18,.17,.15,.21,7,'#79523f');geo.frustum(p.x+.24,.24,p.z-.18,.13,.13,.01,7,'#d8b27b');}
    if(!busy()&&t.type===2)for(var j=0;j<3;j++){geo.frustum(p.x+.15+j*.13,.01,p.z-.25,.025,.025,.14,5,'#d5bdd9');geo.ellipsoid(p.x+.15+j*.13,.18,p.z-.25,.09,.045,.09,'#9054a8');}
    if(known&&t.owner>=0){geo.frustum(p.x,.03,p.z,.16,.16,.03,8,faction(t.owner).color);g.tiles.filter(function(n){return n.id>t.id&&n.owner===t.owner&&nurseryRules.tileKnown(g,n,viewer)&&nurseryRules.adjacent(t,n);}).forEach(function(n){var q=W.hex(n);geo.branch([p.x,.07,p.z],[q.x,.07,q.z],.045,faction(t.owner).color);});}
   });
   [0,1].forEach(function(owner){var h=W.home(g,owner),base=W.hex(g.tiles[g.bases[owner]]),color=faction(owner).color;
    geo.box(h.x,-.31,(h.z+base.z)/2,4.3,.3,Math.abs(h.z-base.z)+1.2,'#7ec8a1');geo.frustum(h.x,-.4,h.z,3.75,3.65,.4,12,'#7ec8a1');
    geo.branch([base.x,.08,base.z],[h.x,.08,h.z],.08,color);
    for(var slot=0;slot<6;slot++){var p=W.slot(g,owner,slot);geo.frustum(p.x,.025,p.z,.77,.77,.025,10,slot<3?'#799367':'#627c5f');geo.branch([h.x,.07,h.z],[p.x,.07,p.z],.035,color);}
    gardenKingdoms.architecture(geo,h.x+3.1,.02,h.z,g.players[owner].faction);
    for(var j=0;j<4;j++){var x=h.x-3.5,z=h.z-2+j*1.35;geo.frustum(x,0,z,.12,.1,.5,7,'#635940');geo.ellipsoid(x,.65,z,.3,.4,.3,'#365c44');}
   });
   // The meeting ring is a marking on the same terrain, not another arena island.
   for(var i=0;i<28;i++){var a=i*Math.PI/14,b=(i+1)*Math.PI/14;geo.branch([Math.cos(a)*3.75,.055,Math.sin(a)*3.75],[Math.cos(b)*3.75,.055,Math.sin(b)*3.75],.025,'#d4c789');}
  });
  if(busy())actors=g.battle.frames[0].units.map(function(u){return {u:u,owner:u.owner,m:body(u,u.owner,true)};});
  else g.players.forEach(function(p,owner){p.units.forEach(function(u){actors.push({u:u,owner:owner,m:body(u,owner,false)});});});
  shared.arm=geometry(function(geo){geo.branch([0,0,0],[0,-1,0],.05,'#ffe4aa');});
  shared.joint=geometry(function(geo){geo.ellipsoid(0,0,0,.065,.065,.065,'#ffe4aa');});
  shared.glove=geometry(function(geo){geo.outline=true;geo.ellipsoid(0,0,0,.2,.2,.23,'#ff608a');geo.frustum(0,-.2,0,.1,.11,.08,8,'#ffe6a7');});
  shared.shield=geometry(function(geo){geo.outline=true;geo.box(0,-.15,0,.38,.48,.1,'#b8a2ed');geo.box(0,-.1,.06,.04,.3,.02,'#fff0a7');});
  shared.spore=geometry(function(geo){geo.ellipsoid(0,0,0,.095,.095,.095,'#dcf578');});
  [0,1].forEach(function(owner){shared['team'+owner]=geometry(function(geo){for(var i=0;i<18;i++){var a=i*Math.PI/9,b=(i+1)*Math.PI/9;geo.branch([Math.cos(a)*.43,.07,Math.sin(a)*.43],[Math.cos(b)*.43,.07,Math.sin(b)*.43],.035,faction(owner).color);}});});
  shared.staff=geometry(function(geo){geo.branch([0,-.3,0],[0,.65,0],.035,'#f3f09b');geo.ellipsoid(0,.7,0,.14,.14,.14,'#b9ff66');});
  shared.dagger=geometry(function(geo){geo.frustum(0,0,0,.08,0,.5,4,'#a4ffe5');});
  shared.bomb=geometry(function(geo){geo.ellipsoid(0,0,0,.23,.23,.23,'#492869');geo.branch([0,.2,0],[.08,.42,0],.02,'#ffdf60');});
  shared.target=geometry(function(geo){for(var n=0;n<16;n++){var a=n*Math.PI/8,b=(n+1)*Math.PI/8;geo.branch([Math.cos(a)*.48,.08,Math.sin(a)*.48],[Math.cos(b)*.48,.08,Math.sin(b)*.48],.028,'#ffe89b');}});
 }
 function chooseCamera(){
  var rect=document.getElementById('scene').getBoundingClientRect(),aspect=rect.width/Math.max(1,rect.height),owner=g.active,h=W.home(g,owner);
  if(busy())cameraGoal={target:[0,.65,0],zoom:Math.max(5.8,4.1*aspect),pitch:.68,yaw:Math.PI/2};
  else if(g.view==='nursery')cameraGoal={target:[h.x,.6,h.z+(owner===0?2:-2)],zoom:Math.max(4.8,2.7*aspect),pitch:.66,yaw:owner===0?0:Math.PI};
  else cameraGoal={target:[0,.4,0],zoom:innerWidth>800?Math.max(10.8,7.8*aspect):Math.max(8.8,10.3*aspect),pitch:innerWidth>800?.52:.82,yaw:innerWidth>800?.7:0};
 }
 function sync(state){
  if(priorPhase==='result'&&state.phase!=='result'&&state.phase!=='over')returnAt=last;
  g=state;
  if(g.phase==='battle'&&lastBattle!==g.battle){lastBattle=g.battle;cursor=0;previous=null;paused=false;introUntil=last+(reduced?100:nurseryConfig.introMs);frameKey='';}
  if(g.phase==='result'||g.phase==='over')cursor=g.battle.frames.length-1;
  var next=g.revision+':'+g.phase;
  if(next!==key){key=next;build();}
  chooseCamera();if(gpu&&!busy())pointers();priorPhase=g.phase;
 }
 function drawActor(actor,p,options){
  var u=actor.u,scale=options.scale,yaw=options.yaw,hit=options.hit,roll=options.roll||0,hop=options.hop||0;
  gpu.draw(shared['team'+actor.owner],[p.x,0,p.z],1+(u.tier-1)*.12);gpu.draw(actor.m,[p.x,.05+hop,p.z],scale,0,yaw,hit?.8:0,roll);
  var rig=combatRig.pose({x:p.x,y:.05+hop,z:p.z,yaw:yaw,roll:roll,tier:u.tier,role:u.role,scale:scale,moving:options.moving,reduced:reduced,phase:cursor,strike:options.strike||0,step:Math.floor(cursor)});
  rig.hands.forEach(function(hand,n){[[rig.shoulders[n],rig.elbows[n]],[rig.elbows[n],hand]].forEach(function(pair){var bone=combatRig.bone(pair[0],pair[1]);gpu.draw(shared.arm,pair[0],1,0,bone.yaw,0,bone.roll,[1,bone.length,1]);});gpu.draw(u.role===1?shared.glove:shared.joint,hand,rig.scale,0,yaw);});
  if(u.role===0)gpu.draw(shared.shield,rig.hands[0],rig.scale,0,yaw,hit?.7:0);if(u.role===3)gpu.draw(shared.staff,rig.hands[1],rig.scale,0,yaw);if(u.role===4)rig.hands.forEach(function(hand){gpu.draw(shared.dagger,hand,rig.scale,0,yaw);});if(u.role===5)gpu.draw(shared.bomb,rig.hands[1],rig.scale,0,yaw);
  return rig;
 }
 function battle(t){
  var max=g.battle.frames.length-1,rally=reduced?1:ease((t-introUntil)/1100);
  if(previous!==null&&!paused&&rally>=1&&g.phase==='battle')cursor=Math.min(max,cursor+Math.min(t-previous,100)/nurseryConfig.stepMs*speed);
  previous=t;var i=Math.min(max,Math.floor(cursor)),part=cursor-i,a=g.battle.frames[i],b=g.battle.frames[Math.min(i+1,max)];positions={};
  actors.forEach(function(actor){var u=a.units.find(function(n){return n.id===actor.u.id;}),v=b.units.find(function(n){return n.id===u.id;}),p=W.battle(u),q=W.battle(v),k=ease(part/.55),moving=u.x!==v.x||u.y!==v.y;
   var d=b.decisions.find(function(d){return d.unit===u.id;}),target=d&&a.units.find(function(n){return n.id===d.target;}),targetPos=target&&W.battle(target),yaw=targetPos?Math.atan2(targetPos.x-p.x,targetPos.z-p.z):u.owner===0?Math.PI:0;
   var facing=Math.atan2(Math.sin(yaw-Math.PI/2),Math.cos(yaw-Math.PI/2));yaw=Math.PI/2+Math.max(-1.1,Math.min(1.1,facing));
   p={x:mix(p.x,q.x,k),z:mix(p.z,q.z,k)};
   if(rally<1){var resident=g.players[u.owner].units.find(function(n){return n.id===u.sourceId;}),home=W.slot(g,u.owner,resident?resident.slot:0);p.x=mix(home.x,p.x,rally);p.z=mix(home.z,p.z,rally);moving=true;}
   var hp=part>=.76?v.hp:u.hp,hit=b.events.some(function(e){return e.to===u.id&&e.damage>0;})&&part>=.76,knocked=u.hp>0&&v.hp===0&&part>=.76;
   var death=knocked?clamp((part-.76)/.24):0,scale=u.hp<=0?0:.98*(1-death*.5),hop=moving&&!reduced?Math.abs(Math.sin((cursor+rally*2)*Math.PI*4))*.12:0;
   if(d&&d.action==='jump'&&!reduced)hop+=Math.sin(k*Math.PI)*1.2;var roll=reduced?0:knocked?death*1.5:hit?Math.sin((part-.76)*40)*.17:moving?Math.sin(cursor*12)*.055:0;
   if(knocked){p.x+=(u.owner===0?-1:1)*death*.5;hop+=Math.sin(death*Math.PI)*.25;}
   positions[u.id]={x:p.x,z:p.z,hp:hp,u:u,knocked:knocked,death:death};
   if(scale>0){var rig=drawActor(actor,p,{scale:scale,yaw:yaw,hit:hit,roll:roll,hop:hop,moving:moving,strike:combatRig.attack(part,d&&d.action==='attack')});positions[u.id].muzzle=rig.hands[1];}
  });
  b.events.forEach(function(e){var p=positions[e.from],q=positions[e.to];if(!p||!q||part<.2||part>.76)return;if(e.kind==='heal'){var h=(part-.2)/.56;gpu.draw(shared.spore,[mix(p.x,q.x,h),.8+Math.sin(h*Math.PI)*.5,mix(p.z,q.z,h)],1.3);return;}gpu.draw(shared.target,[q.x,0,q.z]);if(e.kind!=='spore')return;var k=clamp((part-.2)/.56),m=p.muzzle||[p.x,.65,p.z];for(var n=0;n<3;n++){var v=Math.max(0,k-n*.06);gpu.draw(p.u.role===5?shared.bomb:shared.spore,[mix(m[0],q.x,v),mix(m[1],.75,v)+Math.sin(v*Math.PI)*.55,mix(m[2],q.z,v)],1.3-n*.25);}});
  labels(b,part);
  var stamp=i+':'+(part>=.76)+':'+speed+':'+(cursor>=max)+':'+(rally<1);
  if(stamp!==frameKey){frameKey=stamp;var status=document.getElementById('battle-status');if(status)status.textContent=rally<1?'🍄 → ⚔':cursor>=max?'🏁 Итог готов':Math.ceil(cursor)+' / '+max+' · ×'+speed;
   var feed=document.getElementById('battle-feed');if(feed){var ev=g.battle.frames.slice(1,Math.min(max,part>=.76?i+1:i)+1).flatMap(function(f){return f.events;}).slice(-3);feed.innerHTML=ev.map(function(e){var from=g.battle.frames[0].units.find(function(u){return u.id===e.from;}),to=g.battle.frames[0].units.find(function(u){return u.id===e.to;});return '<span style="--team:'+faction(from.owner).color+'">'+nurseryConfig.roles[from.role].icon+' <b>→</b> '+nurseryConfig.roles[to.role].icon+' <strong>'+(e.kind==='heal'?'+'+e.heal:'−'+e.damage)+'♥</strong></span>';}).join('')||'🍄 🍄 → ⚔ ← 🍄 🍄';}
  }
  document.getElementById('vs').hidden=t>=introUntil||g.phase!=='battle';
 }
 function labels(frame,part){
  var canvas=document.getElementById('scene-labels'),base=document.getElementById('scene-canvas'),ctx=canvas.getContext('2d'),r=base.getBoundingClientRect();if(canvas.width!==base.width||canvas.height!==base.height){canvas.width=base.width;canvas.height=base.height;}ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.scale(canvas.width/r.width,canvas.height/r.height);ctx.textAlign='center';var used=[];
  Object.keys(positions).sort(function(a,b){return positions[a].z-positions[b].z;}).forEach(function(id){var p=positions[id];if(p.hp<=0&&!p.knocked)return;var q=gpu.project([p.x,1.8,p.z]),w=50;
   if(p.knocked){ctx.font='24px Segoe UI Emoji';ctx.fillText('💫',q.x,q.y-10);return;}
   var y=q.y;while(used.some(function(a){return Math.abs(a.x-q.x)<w&&Math.abs(a.y-y)<27;}))y-=27;used.push({x:q.x,y:y});
   ctx.fillStyle='#142b2a';ctx.fillRect(q.x-w/2,y-9,w,7);ctx.fillStyle=faction(p.u.owner).color;ctx.fillRect(q.x-w/2,y-9,w*p.hp/p.u.maxHp,7);ctx.font='bold 12px Segoe UI';ctx.lineWidth=3;ctx.strokeStyle='#142925';ctx.fillStyle='#fff1c7';var text=nurseryConfig.roles[p.u.role].icon+' '+('★'.repeat(p.u.tier));ctx.strokeText(text,q.x,y-15);ctx.fillText(text,q.x,y-15);
  });
  if(part>=.76&&part<.99)frame.events.forEach(function(e,n){var a=positions[e.from],b=positions[e.to];if(!a||!b)return;var q=gpu.project([b.x,1.3,b.z]);ctx.font='bold 20px Segoe UI';ctx.fillStyle='#ffed9d';ctx.strokeStyle='#35243e';ctx.lineWidth=5;var txt=e.kind==='heal'?'💚 +'+e.heal:(e.absorbed?'🛡':'💥')+' −'+e.damage;ctx.strokeText(txt,q.x+(n%2?18:-18),q.y-(part-.76)*90);ctx.fillText(txt,q.x+(n%2?18:-18),q.y-(part-.76)*90);});
 }
 function pointers(){if(!gpu)return;var wide=!g.panel;
  var stable=cameraGoal&&Math.abs(gpu.camera.zoom-cameraGoal.zoom)<.06&&Math.abs(gpu.camera.pitch-cameraGoal.pitch)<.025&&Math.abs(Math.atan2(Math.sin(gpu.camera.yaw-cameraGoal.yaw),Math.cos(gpu.camera.yaw-cameraGoal.yaw)))<.025&&gpu.camera.target.every(function(n,i){return Math.abs(n-cameraGoal.target[i])<.04;});
  document.getElementById('scene').classList.toggle('camera-moving',!stable);
  document.querySelectorAll('[data-scene-slot]').forEach(function(el){var p=W.slot(g,g.active,+el.dataset.sceneSlot),q=gpu.project([p.x,.05,p.z]);el.style.left=q.x+'px';el.style.top=q.y+'px';el.hidden=wide;});
  document.querySelectorAll('[data-scene-tile]').forEach(function(el){var t=g.tiles[+el.dataset.sceneTile],p=W.hex(t),q=gpu.project([p.x,.07,p.z]);el.style.left=q.x+'px';el.style.top=q.y+'px';el.hidden=q.x<15||q.x>document.getElementById('scene').clientWidth-15||q.y<15||q.y>document.getElementById('scene').clientHeight-15;});
  document.querySelectorAll('[data-home]').forEach(function(el){var p=W.home(g,+el.dataset.home),q=gpu.project([p.x,.05,p.z+1.5]);el.style.left=q.x+'px';el.style.top=q.y+'px';el.hidden=+el.dataset.home===g.active&&!wide;});
 }
 function animate(t){last=t;if(!g||!g.players)return;
  if(!gpu){if(g.phase==='battle'){document.getElementById('vs').hidden=t>=introUntil;var f=g.battle.frames[Math.floor(cursor)],feed=document.getElementById('battle-feed');if(previous!==null&&!paused&&t>=introUntil)cursor=Math.min(g.battle.frames.length-1,cursor+Math.min(t-previous,100)/nurseryConfig.stepMs*speed);previous=t;if(feed)feed.textContent=f.events.map(function(e){return '⚔ → −'+e.damage+'♥';}).join(' ')||'🍄 → ⚔';}return;}
  if(g.phase==='battle'){
   var rect=document.getElementById('scene').getBoundingClientRect(),aspect=rect.width/Math.max(1,rect.height),arrival=reduced?1:ease((t-introUntil)/1100),wideZoom=innerWidth>800?Math.max(10.8,7.8*aspect):Math.max(8.8,10.3*aspect);
   cameraGoal={target:[0,mix(.4,.65,arrival),0],zoom:mix(wideZoom,Math.max(5.8,3.3*aspect),arrival),pitch:mix(innerWidth>800?.52:.82,.68,arrival),yaw:mix(innerWidth>800?.7:0,Math.PI/2,arrival)};
  }
  if(cameraGoal){var k=reduced?1:.09;gpu.camera.zoom=mix(gpu.camera.zoom,cameraGoal.zoom,k);gpu.camera.pitch=mix(gpu.camera.pitch,cameraGoal.pitch,k);gpu.camera.yaw+=Math.atan2(Math.sin(cameraGoal.yaw-gpu.camera.yaw),Math.cos(cameraGoal.yaw-gpu.camera.yaw))*k;gpu.camera.target=gpu.camera.target.map(function(n,i){return mix(n,cameraGoal.target[i],k);});}
  gpu.clear(t/1000);gpu.draw(land);
  if(busy())battle(t);
  else{
   var coming=reduced?1:ease((t-returnAt)/850);
   actors.forEach(function(actor){var p=W.slot(g,actor.owner,actor.u.slot),u=lastBattle&&lastBattle.frames[lastBattle.frames.length-1].units.find(function(n){return n.sourceId===actor.u.id;});if(coming<1&&u){var a=W.battle(u);p.x=mix(a.x,p.x,coming);p.z=mix(a.z,p.z,coming);}var hop=Math.sin(t*.003+actor.u.id)*.025;gpu.draw(actor.m,[p.x,.05+hop,p.z],.8+Math.min(5,actor.u.survived)*.012,0,actor.owner===0?0:Math.PI);});
   // Decorative supply flow follows owned terrain back to its real home base.
   g.tiles.filter(function(t){return t.owner>=0&&t.base<0&&nurseryRules.tileKnown(g,t,g.mode==='solo'?0:g.active);}).forEach(function(tile){var a=W.hex(tile),h=W.home(g,tile.owner),k=(t/4500+tile.id*.19)%1;gpu.draw(shared.spore,[mix(a.x,h.x,k),.18+Math.sin(k*Math.PI)*.2,mix(a.z,h.z,k)],.55);});pointers();
  }
 }
 function init(){try{gpu=lowPolyGL.create(document.getElementById('scene-canvas'));gpu.camera.target=[0,.4,0];gpu.camera.zoom=12;gpu.camera.yaw=0;gpu.camera.pitch=.82;}catch(e){document.body.classList.add('no-webgl');}}
 window.nurseryView={init:init,sync:sync,animate:animate,pause:function(){paused=!paused;return paused;},speed:function(){speed=speed===1?2:1;return speed;},skipIntro:function(){introUntil=0;},replay:function(){cursor=0;previous=null;paused=false;frameKey='';},metrics:function(){return {cursor:cursor,meshes:items.length,webgl:!!gpu,worldTiles:g&&g.tiles?g.tiles.length:0,homes:2,camera:gpu?JSON.parse(JSON.stringify(gpu.camera)):null};},dispose:function(){clear();if(gpu)gpu.dispose();gpu=null;}};
})();
