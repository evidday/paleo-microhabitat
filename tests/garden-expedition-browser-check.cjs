const {chromium}=(()=>{try{return require('playwright')}catch(e){return require(require('node:path').join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}})();
const {pathToFileURL}=require('node:url');const path=require('node:path');const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const base=process.env.GARDEN_TEST_URL||pathToFileURL(path.resolve('src/garden-v12.html')).href;
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:950},isMobile:width<700,hasTouch:width<700});const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base.split('?')[0]+'?seed=42&v=10');
  assert.equal(await p.locator('#map-profile').inputValue(),'random');
  await p.locator('#bot-style').selectOption('long');assert((await p.locator('#bot-description').innerText()).includes('семи'));
  await p.locator('#map-profile').selectOption('wind');assert((await p.locator('#map-description').innerText()).includes('33'));
  await p.screenshot({path:width<700?'garden-v10-setup-mobile.png':'garden-v10-setup-desktop.png',fullPage:true});
  await p.locator('#game-mode').selectOption('hotseat');await p.locator('#start').click();
  assert.equal(await p.evaluate(()=>store.state.garden.map.id),'wind');assert.equal(await p.evaluate(()=>store.state.garden.botStyle),'long');
  assert.equal(await p.evaluate(()=>store.state.garden.tiles.length),33);
  await p.locator('#begin').click();assert(await p.locator('.coach').isVisible());
  assert((await p.locator('.coach').innerText()).includes('Нажмите'));
  async function grow(id){await p.locator('#camera summary').click();await p.locator('#tile-list [data-tile="'+id+'"]').click();await p.locator('#camera summary').click();assert(await p.locator('#grow').isEnabled());await p.locator('#grow').click()}
  let found=false;
  for(let i=0;i<14;i++){
   if(i)await p.locator('#begin').click();
   const id=await p.evaluate(()=>{const g=store.state.garden;const legal=gardenRules.actions(g,g.active).filter(a=>a.type==='GARDEN_GROW'||a.type==='GARDEN_FIGHT');const origin={q:0,r:0};function d(t){return Math.max(Math.abs(t.q),Math.abs(t.r),Math.abs(t.q+t.r))}return legal.sort((a,b)=>d(g.tiles[a.id])-d(g.tiles[b.id])||a.id-b.id)[0].id});
   await grow(id);
   assert(await p.locator('[data-stock-delta="-1"]').count()>0);
   if(await p.evaluate(()=>store.state.garden.lastAction.skirmish)){
    found=true;await p.waitForTimeout(350);assert(await p.evaluate(()=>gardenView.metrics().skirmish));
    assert((await p.locator('#activity').textContent()).toLowerCase().includes('драка'));
    const plan=await p.evaluate(()=>gardenRules.preview(store.state.garden,store.state.garden.lastAction.owner));assert(['win','loss','draw'].includes(await p.evaluate(()=>store.state.garden.lastAction.battle.outcome)));
    await p.screenshot({path:width<700?'garden-v10-brawl-mobile.png':'garden-v10-brawl-desktop.png'});
    const fightState=await p.evaluate(()=>JSON.stringify(store.state.garden.tiles));await p.waitForTimeout(await p.evaluate(()=>gardenConfig.combat.introMs+gardenConfig.skirmishMs+100));assert.equal(await p.evaluate(()=>JSON.stringify(store.state.garden.tiles)),fightState,'Animation does not change game state');assert(await p.evaluate(()=>store.state.garden.phase==='roundBattle'||!gardenView.metrics().skirmish));
    break;
   }
  }
  assert(found,'Greedy routes meet and trigger 3D skirmish');
  await p.locator('#begin').click();assert(await p.evaluate(()=>store.state.garden.tiles.some(t=>t.chips.some(c=>c!==null))));
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
  console.log('PASS v10 '+width+': opponent/map selection, wind topology, coach, -1 stock delta, real shared-cell skirmish + end, no errors/overflow.');
  await context.close();
 }
 // A fresh expedition removes the explicit code, while retaining style/profile.
 const p=await browser.newPage();await p.goto(base.split('?')[0]+'?seed=42&v=10');await p.locator('#bot-style').selectOption('long');await p.locator('#map-profile').selectOption('pickers');await p.locator('#new-map').click();await p.waitForURL(u=>!u.searchParams.has('seed'));assert.equal(await p.locator('#bot-style').inputValue(),'long');assert.equal(await p.locator('#map-profile').inputValue(),'pickers');assert.notEqual(await p.locator('#seed-input').inputValue(),'42');
 console.log('PASS fresh code and preserved choices.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
