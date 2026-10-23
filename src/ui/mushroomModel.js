;(function(){'use strict';
function mushroom(geo,f,role,variant,small,noEquipment,tier,look){
geo.outline=true;look=look||{};tier=tier||1;var start=geo.data.length,style=look.hat===1?'elf':look.hat===2?'brute':look.hat===3?'chaos':f.style,hatColor=look.color?['', '#ff5983','#a777ff','#9dde42','#ffba45','#29c5c1'][look.color]:f.color;
var chunky=style==='brute',tall=style==='elf',stem=small?.22:tall?1.25:chunky?.95:1.1,cap=small?.26:chunky?.66:.58,skin='#ffe4aa';
geo.frustum(0,0,0,small?.06:.23,small?.06:.2,stem,8,skin);geo.frustum(0,stem-.06,0,cap,.2,.1,8,'#f8cba2');
if(tall)geo.frustum(0,stem,0,cap,0,.68,7,hatColor);else if(style==='chaos'){geo.frustum(0,stem,0,cap,.25,.28,8,hatColor);geo.frustum(-.34,stem+.16,0,.12,0,.35,5,hatColor);geo.frustum(.32,stem+.17,0,.14,0,.4,5,hatColor)}else{geo.frustum(0,stem,0,cap,.46,.2,10,hatColor);geo.frustum(0,stem+.2,0,.46,0,.22,10,hatColor)}
if(!small){geo.frustum(0,.1,0,.245,.24,.11,8,f.color);for(var i=0;i<4;i++){var a=i*2+variant;geo.ellipsoid(Math.cos(a)*cap*.5,stem+.23,Math.sin(a)*cap*.5,.09,.025,.065,'#fff7d6')}
geo.ellipsoid(0,stem*.63,.17,.29,.31,.2,skin);var eyes=look.eyes||0,mouth=look.mouth||0;[-1,1].forEach(function(side){var x=side*.17,y=stem*.72;geo.ellipsoid(x,y,.39,.155,.18,.12,'#fffaf0');if(eyes===2){geo.branch([x-.055,y-.05,.53],[x+.055,y+.05,.53],.022,'#40233e');geo.branch([x+.055,y-.05,.53],[x-.055,y+.05,.53],.022,'#40233e')}else{geo.ellipsoid(x+(eyes===1?.045:side*.015),y-.025,.52,.055,.075,.025,'#39233e');geo.branch([x-side*.13,y+.17,.4],[x+side*.09,y+.1,.52],eyes===1?.035:.025,hatColor)}});
geo.ellipsoid(0,stem*.39,.36,.13,.09,.065,'#5b2447');if(mouth===1){geo.ellipsoid(.04,stem*.3,.42,.075,.05,.13,'#ff77ac')}else {geo.frustum(-.05,stem*.37,.43,.025,0,.07,4,'#fff9db');geo.frustum(.05,stem*.37,.43,.025,0,.07,4,'#fff9db')}
if(look.extra===1){geo.branch([-.3,stem+.25,0],[-.47,stem+.7,0],.04,'#ffe8a8');geo.branch([.3,stem+.25,0],[.47,stem+.7,0],.04,'#ffe8a8')}if(look.extra===2){geo.branch([0,stem+.3,0],[.1,stem+.8,0],.035,hatColor);geo.ellipsoid(.1,stem+.8,0,.12,.12,.12,'#ffe961')}
if(!noEquipment){[-1,1].forEach(function(side){geo.branch([side*.2,stem*.56,.06],[side*.34,.4,.22],.055,skin);geo.ellipsoid(side*.34,.4,.22,.065,.065,.065,skin)});if(role===0){geo.box(-.28,.12,.18,.3,.4,.1,'#b9a4f0')}else if(role===1){geo.ellipsoid(-.38,.4,.24,.21,.2,.2,'#ff608a');geo.ellipsoid(.38,.4,.24,.21,.2,.2,'#ff608a');geo.frustum(-.38,.22,.24,.12,.13,.1,8,'#ffdd95');geo.frustum(.38,.22,.24,.12,.13,.1,8,'#ffdd95')}else geo.ellipsoid(.27,.35,.15,.16,.2,.13,'#a8df50')}
if(tier>=2){geo.frustum(0,stem-.04,0,cap*1.04,cap*1.04,.06,10,tier===3?'#ffd752':'#c8d5ff');if(tier===3)for(var n=0;n<5;n++){var a=n*Math.PI*2/5;geo.frustum(Math.cos(a)*.22,stem+.34,Math.sin(a)*.22,.07,0,.28,4,'#ffd752')}}}
var scale=small?.6:1+(tier-1)*.12;for(var k=start;k<geo.data.length;k+=9){geo.data[k]*=scale;geo.data[k+1]*=scale;geo.data[k+2]*=scale}
}
window.mushroomModel={make:mushroom};})()
