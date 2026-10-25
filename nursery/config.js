;(function(){
 'use strict';
 window.nurseryConfig={goal:5,maxRounds:20,handLimit:5,slots:9,activeSlots:6,start:[1,1,1],income:[1,2,1],grow:[1,1,0],feed:[1,1,0],replant:[1,2,1],
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
 perks:['Коренники: +1 брони. Прочный передний ряд.','Плевуны: +1 дальность. Все грибы: −1 здоровья.','Ближние бойцы: +1 урон. Все грибы: −1 здоровья.','Обмен с запасом 2:1 вместо 3:1.'],favored:[0,2,1,3],
 species:[
 {name:'Коренник',role:0},{name:'Задира',role:1},{name:'Плевун',role:2},{name:'Знахарь',role:3},{name:'Скакун',role:4},{name:'Бумовик',role:5},
 {name:'Панцирник',role:0,hp:-3,armor:1,text:'Броня +1, здоровье −3'},
 {name:'Молотобой',role:1,hp:-3,damage:2,text:'Урон +2, здоровье −3'},
 {name:'Иглострел',role:2,damage:-1,range:1,text:'Дальность +1, урон −1'},
 {name:'Нянька',role:3,hp:-2,damage:-1,heal:2,text:'Лечение +2, здоровье −2'},
 {name:'Тень',role:4,hp:-2,damage:1,text:'Урон +1, здоровье −2'},
 {name:'Трюфель-пироман',role:5,damage:-1,splashRadius:.45,text:'Взрыв шире, урон −1'}
 ],
 ground:['Вода: лекарю +1 лечения','Перегной: отряду +2 здоровья','Споры: дальним бойцам +1 дальность'],
 sites:{plain:{icon:'',name:'Поляна'},ruin:{icon:'🏺',name:'Руины: редкий боец сразу'},market:{icon:'🏪',name:'Лавка: обмен 2:1'},spring:{icon:'💎',name:'Источник: двойной доход'}},
 ranks:[{hp:1,damage:1},{hp:1.7,damage:1.6},{hp:2.8,damage:2.4}],stepMs:650,introMs:1100,
 terrainPalette:[['#65d9e2','#74e8e6','#52c5d8'],['#bde76a','#d0ee79','#a9d965'],['#bb8ee8','#d6a2ee','#a47dd5']],
 actions:{menu:'N_MENU',formation:'N_FORMATION',hire:'N_HIRE',reroll:'N_REROLL',open:'N_OPEN',close:'N_CLOSE'}
 };
})();
