;(function(){
 'use strict';
 window.nurseryConfig={goal:5,maxRounds:20,handLimit:3,slots:6,start:[1,1,1],income:[1,2,1],grow:[1,1,0],feed:[1,1,0],replant:[1,2,1],
 teamColors:['#ff719d','#64edff','#cbfa65','#ffbf65'],
 resources:['Вода','Перегной','Споры'],icons:['💧','🌿','✦'],
 roles:[
  {name:'Коренник',icon:'🛡',hp:15,damage:2,range:1,armor:2,cost:[1,1,0],color:'#77f4c2',text:'🛡 −2 урона с каждого попадания. Слаб против сильного удара.'},
  {name:'Задира',icon:'🥊',hp:11,damage:6,range:1,cost:[0,1,1],color:'#ff7a9c',text:'🥊 Сильный удар пробивает броню. Нужно добежать.'},
  {name:'Плевун',icon:'💨',hp:8,damage:4,range:3,cost:[1,0,1],color:'#67e9ff',text:'💨 Бьёт из-за спин. Береги от прыгуна.'},
  {name:'Знахарь',icon:'💚',hp:9,damage:1,range:3,heal:3,cost:[1,1,1],color:'#d2ff66',text:'💚 Через шаг лечит раненого союзника. Нуждается в защите.'},
  {name:'Скакун',icon:'⚡',hp:10,damage:4,range:1,jump:true,cost:[1,0,1],color:'#ec83ff',text:'⚡ Один прыжок к стрелку или лекарю. Хрупкий в долгом бою.'},
  {name:'Бумовик',icon:'💣',hp:8,damage:4,range:2,splash:true,cost:[0,1,1],color:'#ffc66b',text:'💣 Задевает соседей цели. Разведи отряд пошире.'}
 ],
 perks:['Чаще предлагает 🛡 Коренника','Чаще предлагает 💨 Плевуна','Чаще предлагает 🥊 Задиру','Чаще предлагает 💚 Знахаря'],favored:[0,2,1,3],
 ranks:[{hp:1,damage:1},{hp:1.7,damage:1.6},{hp:2.8,damage:2.4}],stepMs:650,introMs:1100,
 terrainPalette:[['#65d9e2','#74e8e6','#52c5d8'],['#bde76a','#d0ee79','#a9d965'],['#bb8ee8','#d6a2ee','#a47dd5']],
 actions:{hire:'N_HIRE',reroll:'N_REROLL',open:'N_OPEN',close:'N_CLOSE'}
 };
})();
