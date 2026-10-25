;(function(){
    'use strict';
    var raw=new URLSearchParams(location.search).get('seed'),seed=raw===null?Date.now()>>>0:Number(raw);
    if(!Number.isInteger(seed)||seed<0||seed>4294967295)seed=42;
    store.resetState(seed);nurserySystem.init();nurseryRoom.init();nurseryView.init();nurseryMusic.init();nurseryUI.mount();
    var timer=null,stopped=false;
    function schedule(){
        clearTimeout(timer);var g=store.state.nursery;if(stopped||g.mode!=='solo')return;if(g.trade&&g.trade.to===1&&['prepare','handoff'].indexOf(g.phase)>=0){timer=setTimeout(function(){store.dispatch('N_REPLY',{owner:1,accept:nurseryBot.tradeAccept(store.state.nursery)});},350);return;}if(g.active!==1)return;
        if(g.phase==='handoff')timer=setTimeout(function(){store.dispatch('N_BEGIN');},500);
        else if(g.phase==='prepare')timer=setTimeout(function(){var a=nurseryBot.choose(store.state.nursery);store.dispatch(a.type,a);},450);
    }
    var unsubscribe=store.subscribeTo('nursery',schedule);
    function loop(t){if(stopped)return;nurseryView.animate(t);requestAnimationFrame(loop);}
    requestAnimationFrame(loop);
    addEventListener('pagehide',function(){stopped=true;clearTimeout(timer);unsubscribe();nurseryUI.dispose();nurseryView.dispose();});
})();
