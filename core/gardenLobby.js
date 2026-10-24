;(function(){
 'use strict';var renderer=null,meshes=[],choices=[0,1],canvas=null;
 function dispose(){if(renderer){renderer.dispose();renderer=null}meshes=[]}
 function build(){
  if(!renderer)return;meshes.forEach(function(m){renderer.remove(m)});meshes=[];
  var G=lowPolyGL.Geometry,ground=new G();ground.frustum(0,-.28,0,3.4,3.5,.25,14,'#344d43');ground.frustum(0,-.08,0,3.4,3.4,.07,14,'#617a57');
  for(var side=0;side<2;side++){
   var x=side===0?-1.45:1.45,f=config.colony.factions[choices[side]],camp=new G();gardenKingdoms.architecture(camp,x,0,0,choices[side]);meshes.push(renderer.mesh(camp));
   var king=new G();mushroomModel.make(king,f,Crole(choices[side]),side,false,false,3,{hat:0,eyes:1,mouth:1,extra:side+1});
   for(var k=0;k<king.data.length;k+=9){king.data[k]*=.9;king.data[k+1]*=.9;king.data[k+2]*=.9;king.data[k]+=x;king.data[k+2]+=.3}meshes.push(renderer.mesh(king));
   for(var i=0;i<2;i++){var unit=new G();mushroomModel.make(unit,f,i,side,false,false,1,{hat:0,eyes:i,mouth:0});for(var j=0;j<unit.data.length;j+=9){unit.data[j]=unit.data[j]*.28+x+(i===0?-.63:.63);unit.data[j+1]*=.28;unit.data[j+2]=unit.data[j+2]*.28+.65}meshes.push(renderer.mesh(unit))}
  }
  meshes.unshift(renderer.mesh(ground));
 }
 function Crole(i){return Math.min(2,gardenConfig.kingdoms[i].role)}
 function mount(a,b){dispose();canvas=document.getElementById('lobby-canvas');choices=[a,b];try{renderer=lowPolyGL.create(canvas);Object.assign(renderer.camera,{zoom:4.05,pitch:.25,yaw:.03,target:[0,.65,0]});build();canvas.onpointermove=function(e){var r=canvas.getBoundingClientRect();renderer.camera.yaw=(e.clientX-r.left-r.width/2)/r.width*.22};canvas.onpointerleave=function(){if(renderer)renderer.camera.yaw=.03}}catch(e){canvas.hidden=true;document.getElementById('lobby-fallback').hidden=false}}
 function sync(a,b){choices=[a,b];build()}
 function animate(t){if(!renderer)return;renderer.clear(t/1000);meshes.forEach(function(m,i){renderer.draw(m,[0,i===1?Math.sin(t*.0015)*.015:0,0],1,i===1?0:.008)})}
 window.gardenLobby={mount:mount,sync:sync,animate:animate,dispose:dispose,metrics:function(){return {webgl:!!renderer,meshes:meshes.length}}};window.addEventListener('pagehide',dispose);
})()
