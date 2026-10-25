const path=require('path'),assert=require('node:assert/strict'),{pathToFileURL}=require('url');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
 const host=await browser.newPage(),guest=await browser.newPage({viewport:{width:390,height:950},isMobile:true,hasTouch:true}),errors=[];
 for(const p of[host,guest])p.on('pageerror',e=>errors.push(e.message));
 const base=process.env.SMASH_URL||pathToFileURL(path.resolve('src/index.html')).href;
 await host.goto(base+'?seed=42&v=18');await host.selectOption('#mode','room');await host.click('#create-room');
 await host.waitForFunction(()=>nurseryRoom.info().status==='waiting',null,{timeout:45000});
 const code=await host.evaluate(()=>nurseryRoom.info().code);
 await guest.goto(base+'?seed=42&v=18&room='+code);await guest.click('#join-room');
 await host.waitForFunction(()=>Number.isInteger(nurseryRoom.info().guestFaction),null,{timeout:45000});
 await host.click('#room-start');await guest.waitForFunction(()=>store.state.nursery.mode==='room');
 await host.click('#begin');await guest.waitForFunction(()=>store.state.nursery.phase==='prepare');
 assert.equal(await guest.evaluate(()=>nurseryRoom.canAct(store.state.nursery,'N_HIRE')),false);
 await host.click('[data-home="0"]');await host.click('#formation');await host.locator('.friend-trade summary').click();await host.click('#offer-friend');
 await guest.locator('#accept-trade').click();await host.waitForFunction(()=>!store.state.nursery.trade);
 assert.equal(await host.evaluate(()=>store.state.nursery.players[0].resources[0]),1);
 assert.equal(await host.evaluate(()=>store.state.nursery.players[0].resources[2]),3);
 await guest.screenshot({path:'garden-v18-room-phone.png'});
 console.log('PASS independent peers, room UI, wrong-turn lock, player trade');
 await guest.evaluate(()=>nurseryRoom.leave());await host.waitForFunction(()=>nurseryRoom.info().status==='disconnected');assert.equal(await host.evaluate(()=>nurseryRoom.canAct(store.state.nursery,'N_READY')),false);await guest.evaluate(code=>nurseryRoom.join(code,1),code);await guest.waitForFunction(()=>nurseryRoom.info().status==='playing',null,{timeout:45000});console.log('PASS mid-turn disconnect lock and rejoin');
 let steps=0;
 while(true){
  const g=await host.evaluate(()=>store.state.nursery);if(g.phase==='over')break;
  const p=g.phase==='handoff'||g.phase==='prepare'?(g.active?guest:host):host;
  const rev=g.revision;
  await p.evaluate(()=>{const g=store.state.nursery;let a;if(g.phase==='handoff')a={type:'N_BEGIN'};else if(g.phase==='prepare')a=nurseryBot.choose(g);else if(g.phase==='battle')a={type:'N_RESOLVE'};else a={type:'N_NEXT'};nurseryRoom.dispatch(a.type,a);});
  await host.waitForFunction(r=>store.state.nursery.revision>r,rev);
  const next=await host.evaluate(()=>store.state.nursery.revision);await guest.waitForFunction(r=>store.state.nursery.revision>=r,next);
  const h=await host.evaluate(()=>JSON.stringify(store.state.nursery)),j=await guest.evaluate(()=>JSON.stringify(store.state.nursery));assert.equal(h,j,'host and guest state');
  assert(++steps<1100);
 }
 const result=await host.evaluate(()=>({round:store.state.nursery.round,wins:store.state.nursery.players.map(p=>p.wins),battles:store.state.nursery.battles}));
 assert(result.wins.includes(5));assert(result.battles>=5);console.log('PASS complete synchronized room match',result,steps);
 await guest.evaluate(()=>nurseryRoom.leave());await host.waitForFunction(()=>nurseryRoom.info().status==='disconnected');
 assert.equal(await host.evaluate(()=>nurseryRoom.canAct(store.state.nursery,'N_READY')),false);
 await guest.evaluate(code=>nurseryRoom.join(code,1),code);await guest.waitForFunction(()=>nurseryRoom.info().status==='playing',null,{timeout:45000});
 assert.equal(await host.evaluate(()=>JSON.stringify(store.state.nursery)),await guest.evaluate(()=>JSON.stringify(store.state.nursery)));
 assert.deepEqual(errors,[]);console.log('PASS disconnect freezes input; same-code rejoin restores state; no page errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
