const {chromium}=(()=>{try{return require('playwright')}catch(e){return require(require('node:path').join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}})();
const{pathToFileURL}=require('node:url'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true}),base=process.env.GARDEN_TEST_URL||pathToFileURL(path.resolve('src/index.html')).href;
for(const width of [390,1440]){
 const ctx=await b.newContext({viewport:{width,height:950},isMobile:width<700,hasTouch:width<700}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base.split('?')[0]+'?seed=42&v=11');await p.locator('#game-mode').selectOption('hotseat');await p.locator('#map-profile').selectOption('classic');await p.locator('#start').click();await p.locator('#begin').click();
 const first=await p.evaluate(()=>store.state.garden.active);
 await p.locator('#open-hand').click();assert.equal(await p.locator('.hand-card').count(),3);
 let data=await p.evaluate(()=>({card:store.state.garden.players[store.state.garden.active].hand.find(c=>c.kind==='spitter').id,target:gardenRules.actions(store.state.garden,store.state.garden.active).find(a=>a.type==='GARDEN_GROW').id}));
 await p.locator('[data-card="'+data.card+'"]').click();await p.locator('#card-target').selectOption(String(data.target));await p.screenshot({path:width<700?'garden-v11-hand-mobile.png':'garden-v11-hand-desktop.png'});await p.locator('#play-card').click();
 assert.equal(await p.evaluate(({id,owner})=>store.state.garden.tiles[id].chips[owner].role,{id:data.target,owner:first}),2);
 await p.locator('#begin').click();await p.evaluate(()=>{const g=store.state.garden,a=gardenRules.actions(g,g.active).find(a=>a.type==='GARDEN_GROW');store.dispatch(a.type,a)});await p.locator('#begin').click();
 await p.locator('#open-hand').click();await p.locator('[data-card]').first().click();await p.locator('#card-mode').selectOption('feed');await p.locator('#card-target').selectOption(String(data.target));await p.locator('#play-card').click();assert(await p.evaluate(({id,owner})=>gardenRules.tier(store.state.garden,store.state.garden.tiles[id],owner)>=2,{id:data.target,owner:first}));
 // Separate starting hand for a real 2-for-1 exchange through UI.
 await p.reload();await p.locator('#game-mode').selectOption('hotseat');await p.locator('#map-profile').selectOption('classic');await p.locator('#start').click();await p.locator('#begin').click();await p.locator('#open-hand').click();const ids=await p.locator('[data-card]').evaluateAll(bs=>bs.slice(0,2).map(b=>b.dataset.card));for(const id of ids)await p.locator('[data-card="'+id+'"]').click();await p.locator('[data-trade="brawler"]').click();assert.equal(await p.evaluate(()=>store.state.garden.lastAction.kind),'trade');assert.equal(await p.evaluate(()=>store.state.garden.players[store.state.garden.lastAction.owner].hand.length),2);
 // A connected deterministic battle fixture; execute the actual fight via the field list/button.
 const forecast=await p.evaluate(()=>{
  const g=store.state.garden;g.active=0;g.phase='play';g.selected=-1;g.lastAction=null;g.version++;g.tiles.forEach(t=>t.chips=[null,null]);
  function t(q,r){return g.tiles.find(t=>t.q===q&&t.r===r)}function put(owner,q,r,rank,role,type){const a=t(q,r);a.chips[owner]={born:0,rankFloor:rank,role};if(type!==undefined)a.type=type;return a}
  put(0,-2,0,1,3,1);put(0,-1,0,3,1,2);put(1,2,0,1,3,1);put(1,1,0,1,3,2);const target=put(1,0,0,1,0,0);put(1,-1,1,1,2,1);put(1,-2,1,1,3,2);
  store.dispatch('GARDEN_SELECT',target.id);const plan=gardenConflict.preview(g,target.id,0);window.originalCamera=gardenView.metrics().camera;return plan;
 });
 assert.equal(forecast.outcome,'win');assert.equal(forecast.removed[1].length,3);assert((await p.locator('.fight-preview').textContent()).includes('ваших 0, чужих 3'));assert((await p.locator('.fight-preview').innerText()).includes('7'));assert((await p.locator('.fight-preview').innerText()).includes('3'));assert((await p.locator('#grow').innerText()).includes('Драться'));
 await p.screenshot({path:width<700?'garden-v11-forecast-mobile.png':'garden-v11-forecast-desktop.png'});
 await p.locator('#grow').click();assert(await p.locator('#duel-overlay').isVisible());assert.equal(await p.locator('#duel-overlay .fighter-card').count(),2);assert((await p.locator('#duel-overlay').innerText()).includes('VS'));await p.screenshot({path:width<700?'garden-v11-vs-mobile.png':'garden-v11-vs-desktop.png'});
 const state=await p.evaluate(()=>JSON.stringify(store.state));await p.waitForTimeout(1900);assert(await p.locator('#duel-overlay').isHidden());assert(await p.evaluate(()=>gardenView.metrics().camera.zoom<4));await p.screenshot({path:width<700?'garden-v11-fight-mobile.png':'garden-v11-fight-desktop.png'});await p.waitForTimeout(2900);assert.equal(await p.evaluate(()=>JSON.stringify(store.state)),state);assert.equal(await p.evaluate(()=>gardenView.metrics().skirmish),false);assert.equal(await p.evaluate(()=>gardenRules.reserve(store.state.garden,1)),6);assert.equal(await p.evaluate(()=>store.state.garden.players[0].score),0);assert.deepEqual(await p.evaluate(()=>gardenView.metrics().camera),await p.evaluate(()=>window.originalCamera));assert.deepEqual(errors,[]);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 // Spitter emits visible projectiles in a second role-specific duel.
 await p.evaluate(()=>{const g=store.state.garden,t=g.tiles.find(t=>t.q===0&&t.r===0);g.active=0;g.phase='play';g.lastAction=null;g.version++;t.chips[0]=null;t.chips[1]={born:0,rankFloor:2,role:2};t.type=2;store.dispatch('GARDEN_SELECT',t.id)});
 await p.locator('#grow').click();assert.equal(await p.evaluate(()=>store.state.garden.lastAction.battle.defense.role),2);await p.locator('#skip-vs').click();await p.waitForTimeout(500);await p.screenshot({path:width<700?'garden-v11-spitter-mobile.png':'garden-v11-spitter-desktop.png'});assert.deepEqual(errors,[]);
 console.log('PASS v11 '+width+': hand plant/feed/trade, T3 vs T1 forecast, VS, zoomed 3D fight, exact branch refund, camera restore, state unchanged by animation, no errors/overflow.');await ctx.close();
}
await b.close()})().catch(e=>{console.error(e);process.exit(1)});
