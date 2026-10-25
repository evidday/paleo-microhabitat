;(function () {
    'use strict';
    window.nurseryConfig = {
        goal: 5, maxRounds: 20, handLimit: 7, slots: 6,
        start: [1,1,1], income: [1,2,1], grow: [1,1,0], feed: [1,1,0],
        resources: ['Вода','Перегной','Споры'], icons: ['💧','🌿','✦'],
        roles: [
            {name:'Коренник',icon:'🛡',hp:12,damage:2,range:1,cost:[1,2,0],text:'Держит передний ряд. Много здоровья, небольшой урон.'},
            {name:'Задира',icon:'🥊',hp:8,damage:4,range:1,cost:[0,2,1],text:'Бьёт сильно, но должен добежать. Перчатки при нём.'},
            {name:'Плевун',icon:'💨',hp:6,damage:2,range:3,cost:[1,0,2],text:'Атакует из-за спин. Без прикрытия быстро сдуется.'}
        ],
        perks: ['Коренникам +3 здоровья','Плевунам +1 урон','Задирам +2 здоровья','Всем грибам +1 здоровье'],
        ranks: [{hp:0,damage:0},{hp:8,damage:2},{hp:20,damage:5}],
        stepMs: 550, introMs: 1400,
        names: ['Пеньтеон','Грибной квартал','Поляна претензий','Дом, милый спор']
    };
})();
