// config/strings.js — all player-facing text.
;(function() {
    'use strict'
    window.config = window.config || {}

    window.config.strings = {
        title: 'PALEO MICROHABITAT',
        tagline: 'You are a tiny creature in an ecosystem that does not care about you.',
        disclaimer: 'A simplified model inspired by humid Carboniferous forests.',
        humidity: 'HUMIDITY',
        pickTrait: 'CHOOSE ONE TRAIT',
        start: 'START',
        hint: 'WASD / arrows to move. Food and moisture are outside cover.',
        adaptations: {
            longLegs:          { name: 'LONG LEGS',          text: 'Move faster. Use energy faster.' },
            camouflage:        { name: 'CAMOUFLAGE',         text: 'Harder for predators to notice.' },
            moistureRetention: { name: 'MOISTURE RETENTION', text: 'Lose moisture more slowly. Move slightly slower.' }
        },
        outcomes: { won: 'SURVIVED', lost: 'DIED' },
        causes: { caught: 'Caught by the predator', starved: 'Starvation', dehydrated: 'Dehydration' },
        energy: 'ENERGY', moisture: 'MOISTURE', hidden: 'HIDDEN', exposed: 'EXPOSED',
        tryAgain: 'TRY AGAIN', changeAdaptation: 'CHANGE ADAPTATION',
        changeVariable: 'CHANGE ONE VARIABLE AND TRY AGAIN'
    }
})()
