;(function(){
 'use strict';
 function adjacent(a,b){return Math.max(Math.abs(a.q-b.q),Math.abs(a.r-b.r),Math.abs(a.q+a.r-b.q-b.r))===1;}
 function connected(tiles){var seen=new Set([tiles[0]]),queue=[tiles[0]];while(queue.length){var t=queue.shift();tiles.forEach(function(n){if(!seen.has(n)&&adjacent(t,n)){seen.add(n);queue.push(n);}});}return seen.size===tiles.length;}
 function generate(profile){
  var generated=gardenMaps.generate(profile||'random'),tiles=generated.tiles,shape=store.prng.next(0,3);
  var candidates=tiles.filter(function(t){return t.q<0&&t.base<0&&tiles.filter(function(b){return b.base>=0;}).every(function(b){return !adjacent(b,t);});});
  candidates.forEach(function(t){var edge=Math.max(Math.abs(t.q),Math.abs(t.r),Math.abs(t.q+t.r)),cut=shape===0?edge===generated.info.radius&&store.prng.next(0,2)===0:shape===1?Math.abs(t.r)>1&&store.prng.next(0,3)===0:shape===2?edge<generated.info.radius&&store.prng.next(0,5)===0:store.prng.next(0,7)===0;
   if(!cut)return;var remaining=tiles.filter(function(n){return !(n.q===t.q&&n.r===t.r||n.q===-t.q&&n.r===-t.r);});if(remaining.length>=25&&connected(remaining))tiles=remaining;
  });
  tiles.forEach(function(t,i){t.id=i;t.site='plain';t.yield=1;t.rare=-1;});
  var spots=tiles.filter(function(t){return t.q<0&&t.base<0&&Math.abs(t.q)<generated.info.radius;});
  ['ruin','market','spring'].forEach(function(site){if(!spots.length)return;var base=tiles.find(function(n){return n.base===0;}),side=spots.filter(function(n){return n.r!==0;}).sort(function(a,b){function d(n){return Math.max(Math.abs(n.q-base.q),Math.abs(n.r-base.r),Math.abs(n.q+n.r-base.q-base.r));}return d(a)-d(b)||a.id-b.id;}),pick=side.length?side[store.prng.next(0,Math.min(2,side.length-1))]:spots[0],index=spots.indexOf(pick),t=spots.splice(index,1)[0],mirror=tiles.find(function(n){return n.q===-t.q&&n.r===-t.r;}),rare=6+store.prng.next(0,5);[t,mirror].forEach(function(n){if(!n)return;n.site=site;n.yield=site==='spring'?2:1;n.rare=site==='ruin'?rare:-1;});});
  for(var extra=0;extra<2&&spots.length;extra++){var n=spots.splice(store.prng.next(0,spots.length-1),1)[0],pair=tiles.find(function(t){return t.q===-n.q&&t.r===-n.r;}),used=tiles.filter(function(t){return t.q<0&&t.site==='ruin';}).map(function(t){return t.rare;}),pool=[6,7,8,9,10,11].filter(function(id){return used.indexOf(id)<0;}),kind=pool[store.prng.next(0,pool.length-1)];[n,pair].forEach(function(t){if(t){t.site='ruin';t.rare=kind;}});}
  var center=tiles.find(function(t){return t.q===0&&t.r===0;});if(center){center.site='spring';center.yield=2;}
  return {tiles:tiles,bases:[0,1].map(function(p){return tiles.find(function(t){return t.base===p;}).id;}),info:Object.assign({},generated.info,{name:['Поляна бухт','Извилистый проход','Лесные окна','Споровая мозаика'][shape],variant:shape})};
 }
 window.nurseryMap={generate:generate};
})();
