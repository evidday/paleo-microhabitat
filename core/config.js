;(function() {
    'use strict'
    window.gardenConfig = {
        stock: 8, target: 11, maxMoves: 24, radius: 3, minHarvest: 3,
        harvestBonus: 1, scoreFloor: 1,
        biomes: ['Влажная низина', 'Перегной', 'Споровые заросли'],
        colors: ['#66adbb', '#a4b969', '#a48bc7'], symbols: ['≈', '♣', '✦'],
        fertile: [[0,-1],[0,0],[0,1]],
        tiers: { ages: [2,5], names: ['Росток','Крепыш','Старый злюка'] }, skirmishMs: 1700,
        bot: {
            thinkMs: 450, showMs: 900, handoffMs: 650,
            styles: {
                short: { name: 'Скороспел', summary: 'Маленький урожай, зато часто. Три грибочка — и домой.', harvestSize: 3, missingBiome: 7, fertility: 1, approach: 0, contest: -2, retreatAt: 1 },
                long: { name: 'Мицелий Великий', summary: 'Растит до семи фишек и тянется в центр. «Это всё моё. Пока устно».', harvestSize: 7, missingBiome: 4, fertility: 8, approach: 3, contest: 1, retreatAt: 3 }
            }
        },
        maps: {
            random: { name: 'Случайная экспедиция', description: 'Новая форма и условия. Посмотрим, кто тут до нас спорил.' },
            classic: { name: 'Обычная поляна', description: '37 гексов, три биома поровну, три золотые поляны в центре. Сосед необычный.', radius: 3, shape: 'round', weights: [1,1,1] },
            rain: { name: 'После дождя', description: '37 гексов, много воды, золотые поляны разбросаны ближе к центру. Ноги мокрые, планы сухие.', radius: 3, shape: 'round', weights: [6,2,2] },
            wind: { name: 'Споровый ветер', description: '33 гекса, узкий перешеек и споровые заросли. Чихнул — заявил права на центр.', radius: 3, shape: 'neck', weights: [2,2,6] },
            pickers: { name: 'Следы грибников', description: 'Большой рваный лес, больше перегноя, золотые поляны на флангах. Корзины ушли. Обиды остались.', radius: 4, shape: 'ragged', weights: [2,6,2] }
        },
        quips: {
            grow: ['Сосед ещё не согласовал, но уже поздно.', 'Это не наглость. Это сеть.', 'Границы приличия снова расширены.'],
            harvest: ['Собрано. Соседу оставлены претензии.', 'Грибоводство — это вовремя уйти с чужой поляны.', 'Мицелий в запасе. Самодовольство на лице.'],
            retract: ['Отступаем? Нет. Перерастаем ситуацию.', 'Этот край официально был черновиком.']
        }
    }
})()
