;(function(){
 'use strict';var C=gardenConfig;
 function look(value){return Object.assign({},value||{},{hat:0})}
 function architecture(geo,x,y,z,index){
  var f=config.colony.factions[index],type=C.kingdoms[index].architecture;
  geo.frustum(x,y-.03,z,.8,.77,.16,8,'#725a48');
  if(type==='citadel'){
   [-1,1].forEach(function(side){geo.frustum(x+side*.48,y,z-.42,.18,.18,.7,6,'#a99580');geo.frustum(x+side*.48,y+.7,z-.42,.27,0,.32,6,f.color)});
   geo.box(x-.45,y,z-.52,.9,.3,.16,'#a99580');
  }else if(type==='spires'){
   [-1,1].forEach(function(side){geo.frustum(x+side*.54,y,z-.4,.23,0,1.12,5,f.color);geo.ellipsoid(x+side*.54,y+.72,z-.27,.08,.08,.08,'#b7f55b')});
  }else if(type==='stockade'){
   for(var i=0;i<7;i++){var a=Math.PI*.13+i*Math.PI*.12;geo.frustum(x+Math.cos(a)*.72,y,z-Math.sin(a)*.65,.09,.04,.5+(i%2)*.18,5,'#856549')}
   geo.frustum(x-.62,y,z-.3,.17,.14,.85,6,'#72523d');geo.box(x-.8,y+.65,z-.3,.36,.18,.14,f.color);
  }else{
   [-1,1].forEach(function(side){geo.branch([x+side*.6,y,z-.35],[x+side*.5,y+.9,z-.45],.055,'#c8a16b');geo.ellipsoid(x+side*.5,y+.9,z-.45,.27,.3,.24,f.color)});
  }
  geo.branch([x+.68,y,z+.06],[x+.68,y+1.08,z+.06],.025,'#ead5ac');
  geo.quad([x+.68,y+1.02,z+.06],[x+1.02,y+.93,z+.06],[x+.96,y+.65,z+.06],[x+.68,y+.7,z+.06],f.color);
 }
 window.gardenKingdoms={look:look,architecture:architecture};
})()
