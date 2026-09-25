// config/adaptations.js — the three biological traits. Numbers come from balance.js.
;(function() {
    'use strict'
    var B = window.config.balance
    window.config = window.config || {}

    window.config.adaptations = {
        order: ['longLegs', 'camouflage', 'moistureRetention'],
        defaultId: 'camouflage',
        longLegs: {
            speed: B.LONG_LEGS_SPEED_MULTIPLIER, energy: B.LONG_LEGS_ENERGY_MULTIPLIER,
            hydration: 1, detection: 1
        },
        camouflage: {
            speed: 1, energy: 1, hydration: 1, detection: B.CAMOUFLAGE_DETECTION_MULTIPLIER
        },
        moistureRetention: {
            speed: B.MOISTURE_RETENTION_SPEED_MULTIPLIER, energy: 1,
            hydration: B.MOISTURE_RETENTION_HYDRATION_MULTIPLIER, detection: 1
        }
    }
})()
