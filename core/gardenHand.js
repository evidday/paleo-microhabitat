;(function(){
 'use strict';var C=gardenConfig,chosen=[],mode='plant',target=-1,unsubscribe,dialog;
 function owner(g){return g.mode==='solo'?0:g.active}
 function render(){
  var g=store.state.garden;if(!g.players||!dialog.open)return;var p=owner(g),hand=g.players[p].hand,playing=g.phase==='play'&&g.active===p;
  chosen=chosen.filter(function(id){return hand.some(function(c){return c.id===id})});
  var card=chosen.length===1?hand.find(function(c){return c.id===chosen[0]}):null;
  var why=card?gardenRules.cardReason(g,p,card.id,target,mode):'Выберите одну карту';
  var targets=g.tiles.filter(function(t){return mode==='feed'?t.chips[p]!==null:!gardenRules.growReason(g,t.id,p)});
  if(!targets.some(function(t){return t.id===target}))target=targets.length?targets[0].id:-1;
  if(card)why=gardenRules.cardReason(g,p,card.id,target,mode);
  document.getElementById('cards-body').innerHTML='<h2>Грибная рука · '+hand.length+'/'+C.cards.limit+'</h2><p class="next-drop">Следующий дроп за урожай: '+C.cards.kinds[g.deck[g.drawIndex%g.deck.length]].name+(hand.length>=C.cards.limit?' · рука полна, сначала освободите место':'')+'</p><p>Каждую карту можно посадить или скормить своему грибу. Розыгрыш и обмен занимают весь ход.</p><div class="hand-cards">'+hand.map(function(c){var kind=C.cards.kinds[c.kind],f={owner:p,role:kind.role,tier:1};return '<button class="hand-card '+(chosen.indexOf(c.id)>=0?'picked':'')+'" data-card="'+c.id+'" aria-pressed="'+(chosen.indexOf(c.id)>=0)+'">'+gardenCharacters.portrait(g,f)+'<b>'+kind.icon+' '+kind.name+'</b><span>'+kind.text+'</span></button>'}).join('')+'</div>'+
  '<div class="card-play"><label>Что сделать?<select id="card-mode"><option value="plant">Посадить гриб Т1 · −1 мицелий</option><option value="feed">Пожертвовать карту · поднять свой гриб на тир</option></select></label><label>Где?<select id="card-target">'+targets.map(function(t){return '<option value="'+t.id+'">#'+(t.id+1)+' · '+C.biomes[t.type]+(t.chips[p]!==null?' · Т'+gardenRules.tier(g,t,p):'')+'</option>'}).join('')+'</select></label><p>'+ (mode==='plant'?'Получите выбранный типаж Т1, карта и 1 фишка уйдут на поле.':'Карта исчезнет, выбранный гриб поднимется на один тир (до Т3). Его улучшение уйдёт при урожае или вытеснении.')+'</p><p class="reason">'+why+'</p><button id="play-card" class="primary" '+(!playing||why?'disabled':'')+'>'+(mode==='plant'?'Посадить выбранного':'Пожертвовать и подкормить')+'</button></div>'+
  '<section class="card-market"><h3>Грибной торг · 2 → 1</h3><p>Выберите две карты сверху и нужную снизу. Отдадите 2, получите 1; рука '+hand.length+' → '+Math.max(0,hand.length-1)+'. Это ваш ход.</p><div>'+Object.keys(C.cards.kinds).map(function(kind){return '<button data-trade="'+kind+'" '+(!playing||gardenRules.tradeReason(g,p,chosen,kind)?'disabled':'')+'>'+C.cards.kinds[kind].icon+' Получить: '+C.cards.kinds[kind].name+'</button>'}).join('')+'</div></section>';
  document.getElementById('card-mode').value=mode;document.getElementById('card-target').value=String(target);
  document.querySelectorAll('[data-card]').forEach(function(b){b.onclick=function(){var id=+b.dataset.card;if(chosen.indexOf(id)>=0)chosen=chosen.filter(function(v){return v!==id});else{if(chosen.length===2)chosen=[];chosen.push(id)}render()}});
  document.getElementById('card-mode').onchange=function(){mode=this.value;target=g.selected;render()};document.getElementById('card-target').onchange=function(){target=+this.value;render()};
  document.getElementById('play-card').onclick=function(){if(card)store.dispatch('GARDEN_CARD',{cardId:card.id,id:target,mode:mode})};
  document.querySelectorAll('[data-trade]').forEach(function(b){b.onclick=function(){store.dispatch('GARDEN_TRADE',{cardIds:chosen.slice(),kind:b.dataset.trade})}});
 }
 function refresh(g){var button=document.getElementById('hand-toggle');if(g.players){button.hidden=false;button.textContent='🃏 '+g.players[owner(g)].hand.length;button.title='Карты грибов и обмен 2:1'}if(dialog.open){if(g.phase!=='play'){dialog.close();chosen=[]}else render()}}
 window.gardenHand={open:function(){chosen=[];target=store.state.garden.selected;dialog.showModal();render()},mount:function(){
  dialog=document.createElement('dialog');dialog.id='cards-dialog';dialog.innerHTML='<button id="close-cards">Закрыть ×</button><div id="cards-body"></div>';document.body.appendChild(dialog);document.getElementById('close-cards').onclick=function(){dialog.close()};
  var button=document.createElement('button');button.id='hand-toggle';button.hidden=true;document.getElementById('camera').insertBefore(button,document.getElementById('camera').lastElementChild);button.onclick=function(){chosen=[];target=store.state.garden.selected;dialog.showModal();render()};unsubscribe=store.subscribeTo('garden',function(s){refresh(s.garden)});
 },unmount:function(){if(unsubscribe)unsubscribe()}};window.addEventListener('pagehide',function(){gardenHand.unmount()});
})()
