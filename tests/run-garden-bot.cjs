const assert = require('node:assert/strict');
global.window = global;
require('../src/store/store.js');
require('../src/config/colony.js');
require('../src/core/config.js');
require('../src/core/gardenSystem.js');
require('../src/core/gardenBot.js');
let suites = 0;
function check(name, fn) { fn(); suites++; console.log('PASS ' + name); }
function init(seed = 42, mode = 'solo') {
    store.clearAll(); store.resetState(seed); gardenSystem.init();
    store.dispatch('GARDEN_START', {a:0, b:1, mode});
    return store.state.garden;
}
function planAndAct(g) {
    store.dispatch('GARDEN_BEGIN');
    const plan = gardenBot.choose(g);
    assert(plan);
    assert(gardenRules.actions(g,g.active).some(a=>a.type===plan.type && a.id===plan.id));
    if(g.active===1) {
        store.dispatch('GARDEN_BOT_PLAN',plan);
        assert(g.botPlan);
    }
    const ply=g.ply;
    store.dispatch(plan.type,plan.id===undefined?undefined:{id:plan.id});
    assert.equal(g.ply,ply+1);
    assert.equal(g.botPlan,null);
}
check('solo mode is explicit; default dispatch retains two-player rules',()=>{
    assert.equal(init().mode,'solo');assert.equal(init(42,undefined).mode,'solo');
    store.clearAll();store.resetState(42);gardenSystem.init();store.dispatch('GARDEN_START',{a:0,b:1});assert.equal(store.state.garden.mode,'hotseat');
});
check('bot choice is pure, deterministic and does not consume PRNG',()=>{
    let g=init(),before=JSON.stringify(store.state),history=JSON.stringify(store.history);
    const a=gardenBot.choose(g);assert.deepEqual(a,gardenBot.choose(g));
    assert.equal(JSON.stringify(store.state),before);assert.equal(JSON.stringify(store.history),history);
    const next=store.prng.next();g=init();assert.equal(store.prng.next(),next);
});
check('plans restricted to solo bot turn; duplicate and illegal plans rejected',()=>{
    let g=init();const plan=gardenBot.choose(g);store.dispatch('GARDEN_BOT_PLAN',plan);assert.equal(g.botPlan,null);
    if(g.active===0)planAndAct(g);
    store.dispatch('GARDEN_BEGIN');assert.equal(g.active,1);
    store.dispatch('GARDEN_BOT_PLAN',{type:'GARDEN_GROW',id:g.bases[0],reason:'invalid'});assert.equal(g.botPlan,null);
    const a=gardenBot.choose(g);store.dispatch('GARDEN_BOT_PLAN',a);assert(g.botPlan);
    const before=JSON.stringify(g);store.dispatch('GARDEN_BOT_PLAN',a);store.dispatch('GARDEN_SELECT',g.bases[0]);assert.equal(JSON.stringify(g),before);
});
check('bot harvests at target length and when harvest can reach goal',()=>{
    let g=init();store.dispatch('GARDEN_BEGIN');let p=g.active;
    let near=g.tiles.filter(t=>gardenRules.adjacent(t,g.tiles[g.bases[p]]));near.forEach(t=>t.chips[p]={born:0});
    g.players[p].score=7;assert.equal(gardenBot.choose(g).type,'GARDEN_HARVEST');
    g.players[p].score=0;assert.equal(gardenBot.choose(g).type,'GARDEN_GROW');
    near[0].chips[1-p]={born:0};assert.equal(gardenBot.choose(g).type,'GARDEN_HARVEST');
});
check('400 full bot-driven games: legal moves, stock, connectivity, bounded end',()=>{
    for(let seed=1;seed<=400;seed++){
        const g=init(seed);
        while(g.phase!=='over'){
            planAndAct(g);
            for(let p=0;p<2;p++){assert(gardenRules.connected(g,p,-1));assert(gardenRules.reserve(g,p)>=0&&gardenRules.reserve(g,p)<=8);}
            assert(g.ply<=48);
        }
        assert(g.players[0].moves===g.players[1].moves);
        const before=JSON.stringify(g);store.dispatch('GARDEN_BOT_PLAN',gardenBot.choose(g));assert.equal(JSON.stringify(g),before);
    }
});
check('solo seed and event history replay including plan reasons',()=>{
    const g=init(97);while(g.phase!=='over')planAndAct(g);
    const snapshot=JSON.stringify(store.state),history=JSON.parse(JSON.stringify(store.history));
    store.clearAll();store.resetState(97);gardenSystem.init();history.forEach(e=>store.dispatch(e.type,e.payload));assert.equal(JSON.stringify(store.state),snapshot);
});
console.log(suites+' bot suites passed');
