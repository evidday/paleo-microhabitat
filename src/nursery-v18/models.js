;(function(){
 'use strict';
 function make(geo,faction,role,variant,small,detached,tier,look){
  var rare=look&&look.species>=6,r=nurseryConfig.roles[role],f=Object.assign({},faction,{color:rare?['#adffd9','#ffb96c','#94cfff','#ecff85','#ffa9fb','#ffe98b'][role]:r.color}),l=Object.assign({},look,{hat:[2,0,1,1,3,2][role]});
  mushroomModel.make(geo,f,role<3?role:2,variant,small,role>=3||detached,tier,l);
  var begin=geo.data.length;if(look&&look.mutations){geo.box(-.17,.65,.4,.2,.06,.035,'#ff8eb8');geo.box(-.17,.65,.425,.04,.15,.025,'#f5ff9a');}if(rare){geo.frustum(0,.47,.42,.09,0,.17,4,'#fff37a');}
  if(role===3){geo.box(0,.42,.4,.25,.08,.03,'#fffeec');geo.box(0,.34,.4,.08,.25,.03,'#fffeec');}
  if(role===4){geo.box(0,.71,.44,.58,.15,.06,'#36234e');geo.ellipsoid(-.16,.74,.51,.08,.025,.02,'#f5ff71');geo.ellipsoid(.16,.74,.51,.08,.025,.02,'#f5ff71');}
  if(role===5){geo.ellipsoid(-.16,.68,.48,.15,.16,.08,'#3a2559');geo.ellipsoid(.16,.68,.48,.15,.16,.08,'#3a2559');geo.ellipsoid(-.16,.68,.55,.09,.1,.02,'#8be9ff');geo.ellipsoid(.16,.68,.55,.09,.1,.02,'#8be9ff');}
  if(role>=3&&!detached){geo.branch([.2,.6,0],[.4,.4,.24],.05,'#ffe4aa');
   if(role===3){geo.branch([.4,.2,.24],[.4,1.05,.24],.035,'#f3f09b');geo.ellipsoid(.4,1.08,.24,.14,.14,.14,'#b9ff66');}
   if(role===4)geo.frustum(.4,.38,.3,.09,0,.5,4,'#9cf8e6');
   if(role===5){geo.ellipsoid(.4,.43,.3,.23,.23,.23,'#432a65');geo.branch([.4,.65,.3],[.5,.83,.3],.02,'#ffe466');}
  }
  var scale=1+(tier-1)*.12;for(var i=begin;i<geo.data.length;i+=9){geo.data[i]*=scale;geo.data[i+1]*=scale;geo.data[i+2]*=scale;}
 }
 function portrait(role,tier,kind){var r=nurseryConfig.roles[role],cap=role===2||role===3?'M18 68L80 8L144 68Z':role===4?'M10 70L26 32L40 49L60 12L83 38L112 14L128 49L147 37L150 70Z':'M10 69Q22 17 80 24Q142 17 150 69Z';
  return '<svg viewBox="0 0 160 145" aria-hidden="true"><path d="M43 62H117L127 128Q80 147 33 128Z" fill="#ffedc7" stroke="#30234f" stroke-width="5"/><path d="'+cap+'" fill="'+r.color+'" stroke="#30234f" stroke-width="5"/><ellipse cx="58" cy="87" rx="17" ry="20" fill="white" stroke="#30234f" stroke-width="4"/><ellipse cx="101" cy="87" rx="17" ry="20" fill="white" stroke="#30234f" stroke-width="4"/><circle cx="63" cy="89" r="7" fill="#30234f"/><circle cx="96" cy="89" r="7" fill="#30234f"/><path d="M47 68L71 77M113 68L89 77" stroke="#30234f" stroke-width="7"/><path d="M63 119L79 109L98 120L90 130H68Z" fill="#40244e"/><text x="130" y="132" font-size="43" text-anchor="middle">'+r.icon+'</text><text x="20" y="139" font-size="17" fill="#fff7ac">'+'★'.repeat(tier||1)+'</text>'+(kind>=6?'<text x="135" y="24" font-size="23" fill="#fff595">✧</text>':'')+'</svg>';
 }
 window.nurseryModels={make:make,portrait:portrait};
})();
