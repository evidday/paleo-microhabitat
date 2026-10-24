// Presentation only: plays the exact frames calculated by battleSystem.
;(function(){
    'use strict';
    var gpu=null,g=null,key='',items=[],actors=[],land=null,shared={},last=0,cursor=0,previous=null,paused=false,speed=1,introUntil=0,frameKey=-1,lastBattle=null;
    var G=lowPolyGL.Geometry, reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    function mesh(geo){var m=gpu.mesh(geo);items.push(m);return m;}
    function geometry(fn){var geo=new G();fn(geo);return mesh(geo);}
    function clear(){if(gpu)items.forEach(function(m){gpu.remove(m);});items=[];actors=[];shared={};}
    function faction(p){return config.colony.factions[g.players[p].faction];}
    function slot(n){return {x:(n%3-1)*2.35,z:n<3?-1.15:1.45};}
    function hex(t){return {x:Math.sqrt(3)*(t.q+t.r/2),z:t.r*1.5};}
    function body(u,p,detached){var geo=new G();mushroomModel.make(geo,faction(p),u.role,u.id%3,false,detached,u.tier,u.look);if(detached)for(var k=0;k<geo.data.length;k+=9){geo.data[k]*=.7;geo.data[k+1]*=.8;geo.data[k+2]*=.7;}return mesh(geo);}
    function build(){
        clear();if(!gpu||!g.players)return;
        var fighting=g.phase==='battle'||g.phase==='result'||g.phase==='over',map=g.view==='map'&&!fighting;
        gpu.camera.yaw=0;gpu.camera.pitch=map?.95:fighting?.78:.48;gpu.camera.target=map?[0,0,0]:[0,.65,0];
        var rect=document.getElementById('scene').getBoundingClientRect();
        gpu.camera.zoom=map?8.5:5.1;
        // Orthographic fit on wide/short as well as portrait canvases.
        if(map)gpu.camera.zoom=Math.max(8.5,6*rect.width/Math.max(rect.height,1));
        else gpu.camera.zoom=Math.max(4.4,2.8*rect.width/Math.max(rect.height,1));
        if(fighting)gpu.camera.zoom=Math.max(5.8,4*rect.width/Math.max(rect.height,1));
        if(map){land=geometry(function(geo){
            g.tiles.forEach(function(t){var p=hex(t),verts=[];for(var i=0;i<6;i++){var a=Math.PI/6+i*Math.PI/3;verts.push([p.x+Math.cos(a)*.95,0,p.z+Math.sin(a)*.95]);}
                var col=gardenConfig.colors[t.type];for(var i=0;i<6;i++){geo.triangle([p.x,0,p.z],verts[(i+1)%6],verts[i],col);geo.quad(verts[i],[verts[i][0],-.3,verts[i][2]],[verts[(i+1)%6][0],-.3,verts[(i+1)%6][2]],verts[(i+1)%6],'#4f5362');}
                if(t.type===0)geo.frustum(p.x+.23,.02,p.z-.15,.31,.31,.01,9,'#9ee8ea');
                if(t.type===1){geo.frustum(p.x+.25,0,p.z-.12,.17,.14,.23,7,'#79523f');geo.frustum(p.x+.25,.23,p.z-.12,.13,.13,.01,7,'#d6b279');}
                if(t.type===2)for(var j=0;j<3;j++){geo.frustum(p.x+.2+j*.1,0,p.z-.25,.025,.025,.18,5,'#d6bfdc');geo.ellipsoid(p.x+.2+j*.1,.18,p.z-.25,.09,.05,.09,'#9054a8');}
                if(t.owner>=0){geo.frustum(p.x,.025,p.z,.39,.39,.018,12,faction(t.owner).color);g.tiles.filter(function(n){return n.id>t.id&&n.owner===t.owner&&nurseryRules.adjacent(t,n);}).forEach(function(n){var q=hex(n);geo.branch([p.x,.07,p.z],[q.x,.07,q.z],.045,faction(t.owner).color);});}
                if(t.base>=0)gardenKingdoms.architecture(geo,p.x,.05,p.z,g.players[t.base].faction);
            });
        });return;}
        land=geometry(function(geo){
            if(fighting){geo.frustum(0,-.35,0,6.2,6.2,.35,12,'#456c59');geo.frustum(0,.01,0,5.7,5.7,.02,12,'#66876b');for(var i=0;i<12;i++){var a=i*Math.PI/6,b=(i+1)*Math.PI/6;geo.branch([Math.cos(a)*5.65,.05,Math.sin(a)*5.65],[Math.cos(b)*5.65,.05,Math.sin(b)*5.65],.04,'#e1bf7b');}}
            else{geo.box(0,-.3,0,8.4,.3,6.2,'#4a695d');geo.box(0,-.38,0,8.7,.1,6.5,'#bd9863');for(var i=0;i<6;i++){var p=slot(i);geo.frustum(p.x,.01,p.z,.82,.82,.03,6,i<3?'#718d69':'#547971');}}
            for(var side=-1;side<=1;side+=2)for(var j=0;j<5;j++){var edge=fighting?6:4.1;geo.frustum(side*edge,-.2,j*1.2-2.3,.28,.15,1.1,6,'#254a42');geo.ellipsoid(side*edge,.8,j*1.2-2.3,.55,.6,.6,'#315b47');}
        });
        if(fighting){actors=g.battle.frames[0].units.map(function(u){return {u:u,m:body(u,u.owner,true)};});
            shared.arm=geometry(function(geo){geo.branch([0,0,0],[0,-1,0],.05,'#ffe4aa');});
            shared.joint=geometry(function(geo){geo.ellipsoid(0,0,0,.065,.065,.065,'#ffe4aa');});
            shared.glove=geometry(function(geo){geo.outline=true;geo.ellipsoid(0,0,0,.2,.2,.23,'#ff608a');});
            shared.shield=geometry(function(geo){geo.outline=true;geo.box(0,-.15,0,.36,.48,.1,'#b8a2ed');geo.box(0,-.1,.06,.04,.3,.02,'#fff0a7');});
            shared.spore=geometry(function(geo){geo.ellipsoid(0,0,0,.095,.095,.095,'#dcf578');});
        }else actors=g.players[g.active].units.map(function(u){return {u:u,m:body(u,g.active,false)};});
    }
    function sync(state){
        var entering=state.phase==='battle'&&lastBattle!==state.battle;
        g=state;
        if(entering){lastBattle=state.battle;cursor=0;previous=null;paused=false;introUntil=last+(reduced?150:nurseryConfig.introMs);frameKey=-1;}
        if(g.phase==='result'||g.phase==='over')cursor=g.battle.frames.length-1;
        var next=g.revision+':'+g.phase+':'+g.view;
        if(next!==key){key=next;build();}
    }
    function drawBattle(t){
        var max=g.battle.frames.length-1;
        if(previous!==null&&!paused&&t>=introUntil&&g.phase==='battle')cursor=Math.min(max,cursor+Math.min(t-previous,100)/nurseryConfig.stepMs*speed);
        previous=t;
        var i=Math.min(max,Math.floor(cursor)),part=cursor-i,a=g.battle.frames[i],b=g.battle.frames[Math.min(i+1,max)],positions={};
        actors.forEach(function(actor){var u=a.units.find(function(v){return v.id===actor.u.id;}),v=b.units.find(function(v){return v.id===u.id;}),d=b.decisions.find(function(d){return d.unit===u.id;}),target=d&&a.units.find(function(v){return v.id===d.target;});
            var k=Math.min(1,part/.55),x=(u.x+(v.x-u.x)*k-3)*1.6,z=(u.y+(v.y-u.y)*k-2)*1.6;
            var moving=u.x!==v.x||u.y!==v.y,y=moving&&!reduced?Math.abs(Math.sin(part*Math.PI*4))*.08:.04;
            var yaw=target?Math.atan2(target.x-u.x,target.y-u.y):u.owner===0?Math.PI/3:-Math.PI/3;
            var hit=b.events.some(function(e){return e.to===u.id;})&&part>=.76;
            var hp=part>=.76?v.hp:u.hp,scale=hp<=0?0:.9;
            positions[u.id]={x:x,y:y,z:z,hp:hp,u:u};if(!scale)return;
            gpu.draw(actor.m,[x,y,z],scale,0,yaw,hit?.8:0,moving&&!reduced?Math.sin(cursor*12)*.04:0);
            var rig=combatRig.pose({x:x,y:y,z:z,yaw:yaw,tier:u.tier,role:u.role,scale:scale,moving:moving,reduced:reduced,phase:cursor,strike:combatRig.attack(part,d&&d.action==='attack'),step:i});
            rig.hands.forEach(function(hand,n){[[rig.shoulders[n],rig.elbows[n]],[rig.elbows[n],hand]].forEach(function(pair){var bone=combatRig.bone(pair[0],pair[1]);gpu.draw(shared.arm,pair[0],1,0,bone.yaw,0,bone.roll,[1,bone.length,1]);});gpu.draw(u.role===1?shared.glove:shared.joint,hand,rig.scale,0,yaw);});
            if(u.role===0)gpu.draw(shared.shield,rig.hands[0],rig.scale,0,yaw);
        });
        b.events.forEach(function(e){var p=positions[e.from],q=positions[e.to];if(!p||!q||e.kind!=='spore'||part<.2||part>.76)return;var n=(part-.2)/.56;gpu.draw(shared.spore,[p.x+(q.x-p.x)*n,.6+Math.sin(n*Math.PI)*.4,p.z+(q.z-p.z)*n],1.2);});
        labels(positions,b,part);
        var stamp=i+':'+(part>=.76)+':'+paused+':'+speed+':'+(cursor>=max);
        if(stamp!==frameKey){frameKey=stamp;var status=document.getElementById('battle-status');if(status)status.textContent=cursor>=max?'Бой завершён — откройте итог':'Шаг '+i+' / '+max+' · ×'+speed;
            var feed=document.getElementById('battle-feed');if(feed){var ev=g.battle.frames.slice(1,Math.min(max,part>=.76?i+1:i)+1).flatMap(function(f){return f.events;}).slice(-3);feed.innerHTML=ev.map(function(e){var from=g.battle.frames[0].units.find(function(u){return u.id===e.from;}),to=g.battle.frames[0].units.find(function(u){return u.id===e.to;});return '<span>'+nurseryConfig.roles[from.role].icon+' И'+(from.owner+1)+' → '+nurseryConfig.roles[to.role].icon+' И'+(to.owner+1)+' <b>−'+e.damage+' HP</b></span>';}).join('')||'Грибы сближаются. Дипломатия закончилась.';}
        }
        document.getElementById('vs').hidden=t>=introUntil||g.phase!=='battle';
    }
    function labels(positions,frame,part){var canvas=document.getElementById('scene-labels'),base=document.getElementById('scene-canvas'),ctx=canvas.getContext('2d'),r=base.getBoundingClientRect();canvas.width=base.width;canvas.height=base.height;ctx.scale(canvas.width/r.width,canvas.height/r.height);ctx.textAlign='center';
        Object.keys(positions).forEach(function(id){var p=positions[id];if(p.hp<=0)return;var q=gpu.project([p.x,1.65,p.z]),w=44;ctx.fillStyle='#162b2c';ctx.fillRect(q.x-w/2,q.y-14,w,6);ctx.fillStyle=faction(p.u.owner).color;ctx.fillRect(q.x-w/2,q.y-14,w*p.hp/p.u.maxHp,6);ctx.font='bold 12px Segoe UI';ctx.lineWidth=3;ctx.strokeStyle='#142925';ctx.fillStyle='#fff1c7';var text=nurseryConfig.roles[p.u.role].icon+' T'+p.u.tier+' '+p.hp;ctx.strokeText(text,q.x,q.y-19);ctx.fillText(text,q.x,q.y-19);});
        if(part>=.76)frame.events.forEach(function(e){var a=positions[e.from],b=positions[e.to];if(!a||!b)return;var p=gpu.project([a.x,.7,a.z]),q=gpu.project([b.x,.7,b.z]);ctx.strokeStyle=faction(a.u.owner).color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();ctx.font='bold 17px Segoe UI';ctx.fillStyle='#fff5ac';ctx.strokeStyle='#3d2543';ctx.lineWidth=4;ctx.strokeText('−'+e.damage,q.x,q.y-6);ctx.fillText('−'+e.damage,q.x,q.y-6);});
    }
    function positionButtons(){if(!gpu||!g.players)return;var fighting=g.phase==='battle'||g.phase==='result'||g.phase==='over';if(fighting)return;
        document.querySelectorAll('[data-scene-slot]').forEach(function(el){var p=slot(+el.dataset.sceneSlot),q=gpu.project([p.x,.05,p.z]);el.style.left=q.x+'px';el.style.top=q.y+'px';});
        document.querySelectorAll('[data-scene-tile]').forEach(function(el){var p=hex(g.tiles[+el.dataset.sceneTile]),q=gpu.project([p.x,.1,p.z]);el.style.left=q.x+'px';el.style.top=q.y+'px';});
    }
    function animate(t){last=t;if(!g||!g.players)return;if(!gpu){
        if(g.phase==='battle'){document.getElementById('vs').hidden=t>=introUntil;if(previous!==null&&!paused&&t>=introUntil)cursor=Math.min(g.battle.frames.length-1,cursor+Math.min(t-previous,100)/nurseryConfig.stepMs*speed);previous=t;var f=g.battle.frames[Math.floor(cursor)],status=document.getElementById('battle-status'),feed=document.getElementById('battle-feed');if(status)status.textContent='Шаг '+Math.floor(cursor)+' / '+(g.battle.frames.length-1);if(feed)feed.textContent=f.events.map(function(e){return '#'+e.from+' → #'+e.to+' −'+e.damage+' HP';}).join(' · ')||'Грибы сближаются';}return;
        }
        if(g.phase==='battle'&&!reduced){
            var alive=g.battle.frames[Math.floor(cursor)].units.filter(function(u){return u.hp>0;});
            if(alive.length){var xs=alive.map(function(u){return (u.x-3)*1.6;}),zs=alive.map(function(u){return (u.y-2)*1.6;});
                var minX=Math.min.apply(null,xs),maxX=Math.max.apply(null,xs),minZ=Math.min.apply(null,zs),maxZ=Math.max.apply(null,zs),rect=document.getElementById('scene').getBoundingClientRect();
                var desired=Math.max(3.1,(maxX-minX)/2+1.1,((maxZ-minZ)*.36+1.25)*rect.width/Math.max(1,rect.height));
                gpu.camera.zoom+=(desired-gpu.camera.zoom)*.06;gpu.camera.target[0]+=((minX+maxX)/2-gpu.camera.target[0])*.06;gpu.camera.target[2]+=((minZ+maxZ)/2-gpu.camera.target[2])*.06;
            }
        }
        gpu.clear(t/1000);gpu.draw(land);
        if(g.phase==='battle'||g.phase==='result'||g.phase==='over')drawBattle(t);
        else{actors.forEach(function(a){var p=slot(a.u.slot),age=1+Math.min(5,a.u.survived)*.015;gpu.draw(a.m,[p.x,.04+Math.sin(t*.002+a.u.id)*.015,p.z],age,0,0);});positionButtons();}
    }
    function init(){try{gpu=lowPolyGL.create(document.getElementById('scene-canvas'));}catch(e){document.body.classList.add('no-webgl');}}
    window.nurseryView={init:init,sync:sync,animate:animate,
        pause:function(){paused=!paused;},speed:function(){speed=speed===1?2:1;},skipIntro:function(){introUntil=0;},
        replay:function(){cursor=0;previous=null;paused=false;frameKey=-1;},
        metrics:function(){return {cursor:cursor,meshes:items.length,webgl:!!gpu};},
        dispose:function(){clear();if(gpu)gpu.dispose();gpu=null;}};
})();
