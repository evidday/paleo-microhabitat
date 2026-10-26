// Two-player, host-authoritative, data-only WebRTC room. No media permissions.
;(function(){
 'use strict';
 var peer=null,conn=null,info={status:'idle',role:-1,code:''},unsubscribe=null,seq=0,lastGuestSeq=0,closing=false;
 var allowed=['N_NOURISH','N_COMPOST','N_TRAIN','N_TAUNT','N_ITEMS','N_ITEM','N_MENU','N_FORMATION','N_OPEN','N_CLOSE','N_EXPLORE','N_VIEW','N_SELECT','N_HIRE','N_REROLL','N_GROW','N_REPLANT','N_MOVE','N_FEED','N_SELL','N_TRADE','N_PROPOSE','N_REPLY','N_READY','N_BEGIN','N_RESOLVE','N_NEXT'];
 function publish(patch){info=Object.assign({},info,patch);store.dispatch('ROOM_STATUS',JSON.parse(JSON.stringify(info)));}
 function active(){return info.role>=0&&!!peer;}
 function role(){return info.role;}
 function connected(){return !!conn&&conn.open;}
 function viewer(g){return g.mode==='room'&&info.role>=0?role():g.mode==='solo'?0:g.active;}
 function can(g,type,owner){if(owner===undefined)owner=role();if(g.mode!=='room')return true;if(!connected()||info.status==='disconnected'||info.status==='error')return false;if(type==='N_RESOLVE')return g.phase==='battle';if(type==='N_NEXT')return owner===0&&['result','peace'].indexOf(g.phase)>=0;if(type==='N_REPLY')return !!g.trade&&g.trade.to===owner&&['prepare','handoff'].indexOf(g.phase)>=0;if(type===undefined)return owner===g.active&&['prepare','handoff'].indexOf(g.phase)>=0;return owner===g.active&&(g.phase==='prepare'||type==='N_BEGIN'&&g.phase==='handoff');}
 function send(data){if(connected())conn.send(Object.assign({protocol:21},data));}
 function snapshot(){var g=store.state.nursery;if(info.role===0&&g&&g.mode==='room')send({type:'STATE',game:g,seed:store.state.seed});}
 function execute(type,payload,owner){var g=store.state.nursery;if(allowed.indexOf(type)<0||!can(g,type,owner))return false;if(type==='N_REPLY')payload=Object.assign({},payload,{owner:owner});store.dispatch(type,payload);return true;}
 function dispatch(type,payload){if(!active()||store.state.nursery.mode!=='room'){store.dispatch(type,payload);return;}if(info.role===0)execute(type,payload,0);else if(can(store.state.nursery,type,1))send({type:'ACTION',seq:++seq,action:type,payload:payload});}
 function friendly(error){var type=error&&error.type;return type==='peer-unavailable'?'Комната не найдена. Проверь код и попроси хозяина оставить игру открытой.':type==='unavailable-id'?'Этот код уже занят. Создай другую комнату.':'Связь не установилась. Попробуйте снова или другую сеть; бот и игра на одном экране работают без комнаты.';}
 function bind(c){conn=c;lastGuestSeq=0;
  c.on('open',function(){publish({status:'connected',message:info.role===0?'Друг подключился. Можно начинать.':'Связь есть. Ждём начала партии.'});if(info.role===1)send({type:'HELLO',faction:info.localFaction});});
  c.on('data',function(data){if(!data||typeof data!=='object'||data.protocol!==21||JSON.stringify(data).length>2000000)return;
   if(info.role===0){
    if(data.type==='HELLO'){if(store.state.nursery.mode==='room'){publish({status:'playing',message:'Друг вернулся в комнату.'});snapshot();return;}var b=Number.isInteger(data.faction)&&data.faction>=0&&data.faction<4?data.faction:1;if(b===info.hostFaction)b=(b+1)%4;publish({guestFaction:b,status:'connected',message:'Друг на месте. Начинайте партию.'});send({type:'LOBBY',a:info.hostFaction,b:b,map:info.map,seed:store.state.seed});}
    else if(data.type==='ACTION'&&Number.isInteger(data.seq)&&data.seq>lastGuestSeq){lastGuestSeq=data.seq;execute(data.action,data.payload,1);}
   }else{
    if(data.type==='LOBBY')publish({hostFaction:data.a,guestFaction:data.b,map:data.map,status:'connected',message:'Хозяин выбирает момент начала. Твоя раса: '+config.colony.factions[data.b].name});
    else if(data.type==='STATE'&&data.game&&data.game.mode==='room'&&Array.isArray(data.game.players)&&data.game.players.length===2&&Array.isArray(data.game.tiles)&&data.game.tiles.length<=100&&data.game.players.every(function(p){return Array.isArray(p.units)&&p.units.length<=9&&p.units.every(function(u){return Number.isInteger(u.role)&&u.role>=0&&u.role<6&&u.tier>=1&&u.tier<=5;});})){publish({status:'playing',message:'В комнате двое.'});store.dispatch('N_ROOM_STATE',{game:data.game});}
   }
  });
  c.on('close',function(){if(closing||conn!==c)return;conn=null;publish({status:'disconnected',message:'Друг отключился. Ход остановлен; его место сохранено. Можно подключиться по тому же коду.'});});
  c.on('error',function(){if(!closing)publish({status:'disconnected',message:'Связь с другом прервалась. Попробуйте подключиться снова.'});});
 }
 function leave(){closing=true;if(conn)conn.close();if(peer)peer.destroy();peer=null;conn=null;seq=0;lastGuestSeq=0;info={status:'idle',role:-1,code:''};closing=false;store.dispatch('ROOM_STATUS',info);}
 function attachErrors(){peer.on('error',function(e){if(!closing)publish({status:'error',message:friendly(e)});});peer.on('disconnected',function(){if(!closing&&!connected())publish({status:'disconnected',message:'Соединение комнаты прервалось. Нажми подключение снова.'});});}
 function code(){var values=new Uint32Array(6);crypto.getRandomValues(values);var letters='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';return Array.from(values,function(n){return letters[n%letters.length];}).join('');}
 function create(faction,map){leave();if(typeof Peer==='undefined'){publish({status:'error',message:'Не удалось загрузить комнату. Можно играть с ботом.'});return;}info={role:0,status:'connecting',code:code(),hostFaction:faction,map:map,message:'Открываю комнату…'};publish({});peer=new Peer('smash-room21-'+info.code,{debug:0});attachErrors();peer.on('open',function(){publish({status:'waiting',message:'Комната открыта. Отправь ссылку другу.'});});peer.on('connection',function(c){if(connected()||!c.metadata||c.metadata.protocol!==21){c.close();return;}bind(c);});}
 function join(raw,faction){var value=String(raw||'').toUpperCase().replace(/[^A-Z2-9]/g,'');if(!/^[A-Z2-9]{6}$/.test(value)){publish({status:'error',message:'В коде комнаты шесть букв и цифр.'});return;}leave();if(typeof Peer==='undefined'){publish({status:'error',message:'Комната недоступна. Можно сыграть с ботом.'});return;}info={role:1,status:'connecting',code:value,localFaction:faction,message:'Подключаюсь к другу…'};publish({});peer=new Peer(undefined,{debug:0});attachErrors();peer.on('open',function(){bind(peer.connect('smash-room21-'+value,{reliable:true,serialization:'binary',metadata:{protocol:21}}));});}
 function start(){if(info.role!==0||!connected()||!Number.isInteger(info.guestFaction))return;store.dispatch('N_START',{a:info.hostFaction,b:info.guestFaction,mode:'room',map:info.map});publish({status:'playing',message:'Партия началась. В комнате двое.'});snapshot();}
 function link(){var url=new URL(location.protocol==='file:'?'https://evidday.github.io/paleo-microhabitat/':location.href);url.search='';url.searchParams.set('room',info.code);url.searchParams.set('seed',store.state.seed);url.searchParams.set('v','21');return url.href;}
 function init(){store.state.room=Object.assign({},info);store.register('ROOM_STATUS',function(s,a){s.room=Object.assign({},a);},'room');unsubscribe=store.subscribeTo('nursery',snapshot);addEventListener('pagehide',function(){closing=true;if(conn)conn.close();if(peer)peer.destroy();if(unsubscribe)unsubscribe();});}
 window.nurseryRoom={init:init,create:create,join:join,start:start,leave:leave,link:link,active:active,connected:connected,role:role,viewer:viewer,canAct:can,dispatch:dispatch,info:function(){return Object.assign({},info);}};
})();
