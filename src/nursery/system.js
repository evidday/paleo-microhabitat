;(function () {
    'use strict';
    var C=nurseryConfig,R=nurseryRules;
    function log(g,text) {g.log.unshift(text);g.log=g.log.slice(0,8);}
    function transaction(p,delta) {p.transaction=(p.transaction||0)+1;p.delta=delta;}
    function pay(p,cost) {cost.forEach(function(n,i){p.resources[i]-=n;});transaction(p,cost.map(function(n){return -n;}));}
    function look() {return {hat:store.prng.next(0,3),eyes:store.prng.next(0,2),mouth:store.prng.next(0,1),extra:store.prng.next(0,2),color:0};}
    function unit(g,p,role,slot) {return {id:g.nextId++,role:role,tier:1,slot:slot,fed:false,survived:0,look:look()};}
    function card(g,role) {return {id:g.nextId++,role:role};}
    function morning(g,initial) {
        g.deltas=[];g.drops=[];
        g.players.forEach(function(p,i){
            p.grew=false;p.ready=false;var gain=R.income(g,i);gain.forEach(function(n,k){p.resources[k]+=n;});transaction(p,gain);g.deltas[i]=gain;
            if(!initial){var c=card(g,store.prng.next(0,2)),received=p.hand.length<C.handLimit;if(received)p.hand.push(c);g.drops.push({owner:i,role:c.role,received:received});}
        });
        g.active=g.roundFirst;g.phase=g.mode==='solo'&&g.active===0?'prepare':'handoff';g.selected=-1;g.card=-1;g.view='nursery';g.notice='Новый раунд: припасы уже в запасе. Сосед ещё не в курсе ваших планов.';g.revision++;
    }
    function create(a) {
        var map=gardenMaps.generate(a.map||'rain');
        var g={phase:'prepare',mode:a.mode==='hotseat'?'hotseat':'solo',botStyle:a.botStyle==='land'?'land':'stack',round:1,roundFirst:0,active:0,
            nextId:0,players:[],tiles:map.tiles.map(function(t){return Object.assign({},t,{owner:t.base});}),bases:map.bases,map:map.info,
            selected:-1,card:-1,view:'nursery',revision:0,log:[],notice:'',battle:null,winner:null,battles:0,lastResult:null};
        [a.a,a.b].forEach(function(f,i){var p={faction:f,resources:C.start.slice(),wins:0,units:[],hand:[],grew:false,ready:false};
            p.units=[unit(g,p,0,1),unit(g,p,1,0)];p.hand=[card(g,0),card(g,1),card(g,2)];g.players.push(p);});
        morning(g,true);return g;
    }
    function playable(g) {return g.phase==='prepare';}
    function change(g,text) {g.revision++;g.notice=text;log(g,text);}
    function ready(g) {
        var p=g.players[g.active];p.ready=true;g.selected=-1;g.card=-1;
        if(g.players.every(function(v){return v.ready;})){
            g.battle=R.forecast(g);g.phase='battle';g.view='nursery';g.battles++;g.revision++;
            g.notice='Армии вышли на общую поляну. Домашний состав после боя сохранится.';
        }else{g.active=1-g.active;g.phase=g.mode==='solo'&&g.active===0?'prepare':'handoff';g.view='nursery';g.revision++;}
    }
    function resolve(g) {
        if(g.phase!=='battle')return;
        var b=g.battle;if(b.winner>=0)g.players[b.winner].wins++;
        g.players.forEach(function(p){p.units.forEach(function(u){var end=b.frames[b.frames.length-1].units.find(function(v){return v.id===u.id;});if(end&&end.hp>0)u.survived++;u.fed=false;});});
        g.lastResult={winner:b.winner,round:g.round,reason:b.reason};g.phase='result';g.revision++;
        g.notice=b.winner<0?'Ничья. Оба требуют пересчёта шляпок.':'Победа: '+config.colony.factions[g.players[b.winner].faction].name+'. +1 из пяти!';
        log(g,g.notice);
        if(g.players.some(function(p){return p.wins>=C.goal;})||g.round>=C.maxRounds){g.phase='over';g.winner=g.players[0].wins===g.players[1].wins?-1:g.players[0].wins>g.players[1].wins?0:1;}
    }
    function init() {
        store.state.nursery={phase:'setup',revision:0};
        store.register('N_START',function(s,a){if(!a||![a.a,a.b].every(function(f){return Number.isInteger(f)&&f>=0&&f<4;})||a.a===a.b)return;s.nursery=create(a);},'nursery');
        store.register('N_BEGIN',function(s){var g=s.nursery;if(g.phase==='handoff'){g.phase='prepare';g.revision++;}},'nursery');
        store.register('N_VIEW',function(s,v){var g=s.nursery;if(playable(g)&&(v==='map'||v==='nursery')){g.view=v;g.card=-1;g.selected=-1;g.revision++;}},'nursery');
        store.register('N_SELECT',function(s,id){var g=s.nursery;if(!playable(g)||!Number.isInteger(id))return;g.selected=id;g.revision++;},'nursery');
        store.register('N_CARD',function(s,id){var g=s.nursery;if(!playable(g)||!g.players[g.active].hand.some(function(c){return c.id===id;}))return;g.card=g.card===id?-1:id;g.selected=-1;g.view='nursery';g.revision++;},'nursery');
        store.register('N_GROW',function(s,a){var g=s.nursery;if(!playable(g)||!a||R.growReason(g,a.id,g.active))return;pay(g.players[g.active],C.grow);g.tiles[a.id].owner=g.active;g.players[g.active].grew=true;change(g,'Мицелий занял #'+(a.id+1)+': со следующего раунда +1 '+C.resources[g.tiles[a.id].type]+'. Границы приличия расширены.');},'nursery');
        store.register('N_RECRUIT',function(s,a){var g=s.nursery,p=g.players&&g.players[g.active];if(!playable(g)||!a||R.recruitReason(g,a.card,a.slot,g.active))return;var c=p.hand.find(function(c){return c.id===a.card;});pay(p,C.roles[c.role].cost);p.hand=p.hand.filter(function(c){return c.id!==a.card;});var u=unit(g,p,c.role,a.slot);p.units.push(u);g.card=-1;g.selected=a.slot;change(g,C.roles[u.role].name+' поселился в питомнике. Теперь это семейная проблема.');},'nursery');
        store.register('N_MOVE',function(s,a){var g=s.nursery;if(!playable(g)||!a||!Number.isInteger(a.slot)||a.slot<0||a.slot>=C.slots)return;var p=g.players[g.active],u=p.units.find(function(u){return u.id===a.id;});if(!u)return;var other=p.units.find(function(v){return v.slot===a.slot;});if(other)other.slot=u.slot;u.slot=a.slot;g.selected=a.slot;change(g,'Расстановка изменена. Передний ряд принимает первый удар.');},'nursery');
        store.register('N_MERGE',function(s,a){var g=s.nursery;if(!playable(g)||!a)return;var p=g.players[g.active],u=p.units.find(function(u){return u.id===a.id;}),v=R.pair(p,a.id);if(!u||!v)return;u.tier++;u.fed=u.fed||v.fed;u.survived=Math.max(u.survived,v.survived);p.units=p.units.filter(function(n){return n.id!==v.id;});g.selected=u.slot;change(g,'Два '+C.roles[u.role].name+' Т'+(u.tier-1)+' → один Т'+u.tier+'. Стало теснее в шляпе, свободнее на поляне.');},'nursery');
        store.register('N_FEED',function(s,a){var g=s.nursery;if(!playable(g)||!a)return;var p=g.players[g.active],u=p.units.find(function(u){return u.id===a.id;});if(!u||u.fed||!R.affordable(p,C.feed))return;pay(p,C.feed);u.fed=true;change(g,'Рацион съеден: +2 здоровья, +1 урон на ближайший бой. Аппетит к скандалам вырос.');},'nursery');
        store.register('N_SELL',function(s,a){var g=s.nursery;if(!playable(g)||!a)return;var p=g.players[g.active],u=p.units.find(function(u){return u.id===a.id;});if(!u)return;p.units=p.units.filter(function(v){return v.id!==a.id;});p.resources[1]++;transaction(p,[0,1,0]);g.selected=-1;change(g,'Гриб ушёл из состава. +1 перегной, карта не возвращается. Уволен за споровую дисциплину.');},'nursery');
        store.register('N_TRADE',function(s,a){var g=s.nursery;if(!playable(g)||!a||![a.from,a.to].every(function(i){return Number.isInteger(i)&&i>=0&&i<3;})||a.from===a.to)return;var p=g.players[g.active];if(p.resources[a.from]<3)return;p.resources[a.from]-=3;p.resources[a.to]++;var delta=[0,0,0];delta[a.from]=-3;delta[a.to]=1;transaction(p,delta);change(g,'Обмен: −3 '+C.resources[a.from]+' → +1 '+C.resources[a.to]+'. Меняла снова улыбается.');},'nursery');
        store.register('N_READY',function(s){if(playable(s.nursery))ready(s.nursery);},'nursery');
        store.register('N_RESOLVE',function(s){resolve(s.nursery);},'nursery');
        store.register('N_NEXT',function(s){var g=s.nursery;if(g.phase!=='result')return;g.round++;g.roundFirst=1-g.roundFirst;g.battle=null;morning(g,false);},'nursery');
    }
    window.nurserySystem={init:init};
})();
