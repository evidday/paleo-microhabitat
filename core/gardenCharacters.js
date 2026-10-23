;(function(){
 'use strict';var C=gardenConfig,seen='',introTimer=null,endTimer=null;
 function portrait(g,f){
  var color=config.colony.factions[g.players[f.owner].faction].color,role=f.role,t=f.tier;
  var gear=role===0?'<path d="M14 92L45 85L51 121L32 137L12 121Z" fill="#bba6ee"/>':role===1?'<ellipse cx="22" cy="112" rx="17" ry="16" fill="#fb658d"/><ellipse cx="137" cy="112" rx="17" ry="16" fill="#fb658d"/>':role===2?'<ellipse cx="132" cy="120" rx="19" ry="23" fill="#b7df60"/><circle cx="139" cy="77" r="6" fill="#b7df60"/><circle cx="150" cy="67" r="4" fill="#b7df60"/>':'';
  var crown=t===3?'<path d="M47 40L47 16L65 30L80 9L95 30L113 16L113 40Z" fill="#ffd15b"/>':'';
  return '<svg class="mushroom-portrait" viewBox="0 0 160 160" aria-label="Т'+t+' '+C.roles[role].name+'" role="img"><g stroke="#39233f" stroke-width="3.5" stroke-linejoin="round">'+crown+'<path d="M53 64L107 64L116 145Q80 157 44 145Z" fill="#ffe3ac"/><path d="M17 69Q27 24 80 28Q132 25 146 69Q83 88 17 69Z" fill="'+color+'"/>'+(t>=2?'<path d="M20 69Q83 87 144 69" fill="none" stroke="'+(t===3?'#ffd15b':'#d3e3ff')+'" stroke-width="9"/>':'')+'<ellipse cx="63" cy="91" rx="16" ry="18" fill="#fffaf0"/><ellipse cx="99" cy="91" rx="16" ry="18" fill="#fffaf0"/><ellipse cx="68" cy="96" rx="5" ry="7" fill="#39233f"/><ellipse cx="94" cy="96" rx="5" ry="7" fill="#39233f"/><path d="M48 76L76 83M85 83L113 76"/><path d="M67 123Q81 113 96 123L92 137L72 136Z" fill="#6f3151"/><path d="M54 110L26 116M108 110L135 116" stroke="#ffe3ac" stroke-width="9"/>'+gear+'</g></svg>';
 }
 function fighterCard(g,f){return '<article class="fighter-card" style="--team:'+config.colony.factions[g.players[f.owner].faction].color+'">'+portrait(g,f)+'<strong>Т'+f.tier+' · '+C.roles[f.role].name+'</strong><span>'+C.roles[f.role].icon+' '+C.roles[f.role].rule+'</span><b class="power">Сила '+f.power+'</b><small>'+f.base+' за тир + '+f.bonus+' за типаж'+(f.home?' + '+f.home+' за базу':'')+'</small></article>'}
 function consequences(g,b){var p=b.attack.owner,e=1-p;return '<strong class="outcome '+b.outcome+'">'+({win:'Победа: вытесните соседа',loss:'Поражение: ваш чемпион будет вытеснен',draw:'Равная сила: оба останутся спорить'}[b.outcome])+'</strong><p>Ваш запас: '+signed(b.reserveDelta[p])+' · запас соседа: '+signed(b.reserveDelta[e])+'. Уже полученные очки сохраняются.</p><p>Будущий урожай: ваш <b>'+b.harvestBefore[p]+' → '+b.harvestAfter[p]+'</b>, соседа <b>'+b.harvestBefore[e]+' → '+b.harvestAfter[e]+'</b>. 0 означает, что урожай не готов.</p>'+(b.removed.some(function(ids){return ids.length})?'<details class="branch-loss"><summary>Какие грибы вернутся в запас?</summary>'+[p,e].map(function(owner){return '<p>'+(owner===p?'Ваши':'Чужие')+': '+(b.removed[owner].map(function(id){return '#'+(id+1)}).join(', ')||'никто')+'</p>'}).join('')+'<p>Вместе с проигравшим уходят ветки, отрезанные от базы.</p></details>':'')}
 function signed(n){return n>0?'+'+n:String(n)}
 function panel(g,b){if(b.reason)return '<p>'+b.reason+'</p>';return '<div class="fight-preview"><div class="fighters">'+fighterCard(g,b.attack)+'<b class="small-vs">VS</b>'+fighterCard(g,b.defense)+'</div>'+consequences(g,b)+'<p class="champion-note">За новый росток дерётся ваш чемпион #'+(b.attack.id+1)+'. При победе он вернётся на своё место; новый росток будет Т1.</p></div>'}
 function sync(g){
  var battle=g.lastAction&&g.lastAction.battle;if(!battle)return;
  var key=store.state.seed+':'+g.lastAction.turn;if(seen===key)return;seen=key;clearTimeout(introTimer);clearTimeout(endTimer);
  var overlay=document.getElementById('duel-overlay');if(!overlay){overlay=document.createElement('section');overlay.id='duel-overlay';document.body.appendChild(overlay)}
  overlay.hidden=false;document.body.classList.add('combat-view');
  overlay.innerHTML='<h2>За гекс #'+(battle.target+1)+'. Претензии принимаются кулаками.</h2><div class="anime-fighters">'+fighterCard(g,battle.attack)+'<b class="huge-vs">VS</b>'+fighterCard(g,battle.defense)+'</div><div class="duel-stakes">'+consequences(g,battle)+'</div><button id="skip-vs">К драке →</button>';
  function hideIntro(){overlay.hidden=true}
  document.getElementById('skip-vs').onclick=function(){hideIntro();gardenView.skipIntro()};
  introTimer=setTimeout(hideIntro,C.combat.introMs);
  endTimer=setTimeout(function(){overlay.hidden=true;document.body.classList.remove('combat-view')},C.combat.introMs+C.skirmishMs);
 }
 function cleanup(){clearTimeout(introTimer);clearTimeout(endTimer);document.body.classList.remove('combat-view')}
 window.gardenCharacters={portrait:portrait,fighterCard:fighterCard,panel:panel,consequences:consequences};window.gardenDuel={sync:sync,cleanup:cleanup};window.addEventListener('pagehide',cleanup);
})()
