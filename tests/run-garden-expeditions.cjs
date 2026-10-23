const assert=require('node:assert/strict');global.window=global;
for(const file of ['store/store','config/colony','core/config','core/gardenMaps','core/gardenSystem','core/gardenConflict','core/gardenBot'])require('../src/'+file+'.js');
let suites=0;function check(name,fn){fn();console.log('PASS '+name);suites++}
function start(seed,map='classic',botStyle='short'){store.clearAll();store.resetState(seed);gardenSystem.init();store.dispatch('GARDEN_START',{a:0,b:1,mode:'solo',map,botStyle});return store.state.garden}
function allConnected(g){const seen=new Set([g.bases[0]]),queue=[g.tiles[g.bases[0]]];while(queue.length){const a=queue.shift();g.tiles.forEach(t=>{if(!seen.has(t.id)&&gardenRules.adjacent(a,t)){seen.add(t.id);queue.push(t)}})}return seen.size===g.tiles.length}
function action(g){store.dispatch('GARDEN_BEGIN');const a=gardenBot.choose(g);assert(a);assert(a.type==='GARDEN_CARD'?!gardenRules.cardReason(g,g.active,a.cardId,a.id,a.mode):gardenRules.actions(g,g.active).some(b=>a.type===b.type&&a.id===b.id));store.dispatch(a.type,a);return a}
check('profiles change topology and dominant biome across 600 generated boards',()=>{
 const signatures=new Set(),sizes=new Set();
 for(const map of ['rain','wind','pickers'])for(let seed=1;seed<=200;seed++){
  const g=start(seed,map),expected={rain:0,wind:2,pickers:1}[map];assert(allConnected(g));
  assert(g.map.counts[expected]>g.map.counts.filter((v,i)=>i!==expected).reduce((a,b)=>Math.max(a,b),0));
  for(let p=0;p<2;p++){assert.equal(new Set(g.tiles.filter(t=>gardenRules.adjacent(t,g.tiles[g.bases[p]])).map(t=>t.type)).size,3);assert.equal(gardenRules.reserve(g,p),8)}
  g.tiles.forEach(t=>{const m=g.tiles.find(m=>m.q===-t.q&&m.r===-t.r);assert(m);if(t.q!==0)assert.equal(t.type,m.type)});
  signatures.add(JSON.stringify(g.tiles.map(t=>[t.q,t.r,t.type,t.fertile])));sizes.add(g.tiles.length);
  if(map==='wind')assert.equal(g.tiles.length,33);if(map==='pickers')assert(g.tiles.length>37);if(map==='rain')assert.equal(g.tiles.length,37);
 }
 assert(signatures.size>500);assert(sizes.size>3);
});
check('same code/profile/style reproduces board and random profile choice',()=>{
 for(const map of ['rain','wind','pickers','random']){let g=start(61,map,'long');const first=JSON.stringify(g);g=start(61,map,'long');assert.equal(JSON.stringify(g),first);assert.equal(g.botStyle,'long');assert.equal(g.map.request,map)}
 const profiles=new Set();for(let seed=1;seed<=100;seed++)profiles.add(start(seed,'random').map.id);assert.equal(profiles.size,3);
});
check('two styles make different harvest decisions on the same legal network',()=>{
 const g=start(42);store.dispatch('GARDEN_BEGIN');const p=g.active;
 g.tiles.filter(t=>gardenRules.adjacent(t,g.tiles[g.bases[p]])).forEach(t=>t.chips[p]={born:0});
 assert(gardenRules.preview(g,p).eligible);g.botStyle='short';assert.equal(gardenBot.choose(g).type,'GARDEN_HARVEST');
 g.botStyle='long';assert.equal(gardenBot.choose(g).type,'GARDEN_GROW');
 g.players[p].score=7;assert.equal(gardenBot.choose(g).type,'GARDEN_HARVEST');
});
check('full games on every expedition: legal, deterministic, no deadlock, styles measurably differ',()=>{
 const stats={short:{harvests:0,length:0,center:0},long:{harvests:0,length:0,center:0}};
 for(const map of ['classic','rain','wind','pickers','random'])for(let seed=1;seed<=60;seed++){
  const g=start(seed,map);while(g.phase!=='over'){
   const style=g.active===0?'short':'long';g.botStyle=style;
   const plan=gardenRules.preview(g,g.active),a=action(g);
   if(a.type==='GARDEN_HARVEST'){stats[style].harvests++;stats[style].length+=plan.count;}
   if(a.type==='GARDEN_GROW'&&g.tiles[a.id].fertile)stats[style].center++;
   assert(g.ply<=48);for(let p=0;p<2;p++){assert(gardenRules.connected(g,p,-1));assert(gardenRules.reserve(g,p)>=0)}
  }
 }
 const meanShort=stats.short.length/stats.short.harvests,meanLong=stats.long.length/stats.long.harvests;
 assert(meanLong>meanShort+1.5);assert(stats.long.center>stats.short.center);console.log(JSON.stringify({stats,meanHarvestSize:{short:meanShort,long:meanLong}}));
});
check('replay with selected style, expedition, dispute metadata and quips',()=>{
 const g=start(48,'pickers','long');while(g.phase!=='over')action(g);
 const snap=JSON.stringify(store.state),history=JSON.parse(JSON.stringify(store.history));
 store.clearAll();store.resetState(48);gardenSystem.init();history.forEach(e=>store.dispatch(e.type,e.payload));assert.equal(JSON.stringify(store.state),snap);
});
check('visual tiers grow with held age and reset on a fresh node, no point modifier',()=>{
 const g=start(19),p=g.active,t=g.tiles.find(t=>gardenRules.adjacent(t,g.tiles[g.bases[p]]));t.chips[p]={born:0};
 assert.equal(gardenRules.tier(g,t,p),1);g.players[p].moves=2;assert.equal(gardenRules.tier(g,t,p),2);g.players[p].moves=5;assert.equal(gardenRules.tier(g,t,p),3);t.chips[p].born=5;assert.equal(gardenRules.tier(g,t,p),1);
});
console.log(suites+' expedition suites passed');
