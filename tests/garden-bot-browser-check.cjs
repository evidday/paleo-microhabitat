const {chromium}=(()=>{try{return require('playwright')}catch(e){return require(require('node:path').join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}})();
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
    const browser=await chromium.launch({channel:'msedge',headless:true});
    const url=process.env.GARDEN_TEST_URL||pathToFileURL(path.resolve('src/index.html')).href+'?seed=42';
    for(const width of [390,1440]){
        const ctx=await browser.newContext({viewport:{width,height:950},isMobile:width<700,hasTouch:width<700});
        const p=await ctx.newPage(),errors=[];
        p.on('pageerror',e=>errors.push(e.message));
        await p.goto(url);
        assert.equal(await p.locator('#game-mode').inputValue(),'solo');
        assert.equal(await p.locator('#player-name-1').innerText(),'Бот');
        await p.locator('#start').click();
        await p.waitForFunction(()=>store.state.garden.phase==='play'&&store.state.garden.active===0);
        assert(await p.locator('#action-panel').isVisible());
        // Use the same public tile-list and buttons as a human.
        async function humanMove(){
            const a=await p.evaluate(()=>gardenBot.choose(store.state.garden));
            if(a.id!==undefined){
                await p.locator('#camera summary').click();
                await p.locator('#tile-list [data-tile="'+a.id+'"]').click();
                await p.locator('#camera summary').click();
            }
            await p.locator({GARDEN_GROW:'#grow',GARDEN_HARVEST:'#harvest',GARDEN_RETRACT:'#retract'}[a.type]).click();
        }
        const canvas=await p.evaluate(()=>{window.savedCanvas=document.getElementById('garden-canvas');return gardenView.metrics().camera;});
        await humanMove();
        await p.waitForFunction(()=>store.state.garden.botPlan!==null);
        assert(await p.locator('#action-panel').isHidden());
        assert((await p.locator('#handoff').innerText()).includes('Ход бота'));
        assert.equal(await p.locator('#begin').count(),0,'No manual handoff in solo');
        assert(await p.evaluate(()=>store.state.garden.botPlan.type==='GARDEN_HARVEST'||store.state.garden.selected===store.state.garden.botPlan.id));
        await p.screenshot({path:width<700?'garden-bot-mobile.png':'garden-bot-desktop.png'});
        await p.waitForFunction(()=>store.state.garden.phase==='play'&&store.state.garden.active===0);
        assert((await p.locator('#activity').innerText()).includes('Бот:'));
        assert(await p.evaluate(()=>window.savedCanvas===document.getElementById('garden-canvas')));
        assert.deepEqual(await p.evaluate(()=>gardenView.metrics().camera),canvas);
        // Timing changes only presentation; avoid spending a minute waiting in an automated match.
        await p.evaluate(()=>Object.assign(gardenConfig.bot,{thinkMs:20,showMs:30,handoffMs:20}));
        while(await p.evaluate(()=>store.state.garden.phase!=='over')){
            await p.waitForFunction(()=>store.state.garden.phase==='over'||store.state.garden.phase==='play'&&store.state.garden.active===0);
            if(await p.evaluate(()=>store.state.garden.phase==='over'))break;
            await humanMove();
        }
        assert(await p.locator('#game-over').isVisible());
        const result=await p.evaluate(()=>({ply:store.state.garden.ply,score:store.state.garden.players.map(p=>p.score),history:store.history.length}));
        await p.waitForTimeout(200);
        assert.deepEqual(await p.evaluate(()=>({ply:store.state.garden.ply,score:store.state.garden.players.map(p=>p.score),history:store.history.length})),result,'Bot stops after result');
        assert.deepEqual(errors,[]);
        assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
        console.log('PASS solo '+width+': default mode, automatic bot + reason/selection, return to human, full match '+result.score.join(':')+', stop after end, persistent camera/canvas, no errors/overflow.');
        await ctx.close();
    }
    await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
