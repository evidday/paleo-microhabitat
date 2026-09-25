// config/balance.js — every tunable number lives here. Read-only at runtime.
;(function() {
    'use strict'
    window.config = window.config || {}

    window.config.balance = {
        FIXED_DT: 1 / 60,
        SESSION_DURATION: 75,          // seconds a run lasts

        // environment
        HUMIDITY: 78,                  // percent, shown before the run
        HUMIDITY_REFERENCE: 78,        // humidity at which hydration loss = base rate
        HUMIDITY_SENSITIVITY: 2.0,     // how strongly humidity bends hydration loss
        WORLD_W: 3200,
        WORLD_H: 2200,

        // player
        PLAYER_SPEED: 150,             // world units per second
        PLAYER_RADIUS: 10,
        PLAYER_START_ENERGY: 70,
        PLAYER_START_HYDRATION: 80,
        PLAYER_ENERGY_DRAIN: 1.15,      // per second, always
        PLAYER_MOVE_ENERGY_MULTIPLIER: 1.3, // extra per second at full speed
        PLAYER_HYDRATION_DRAIN: 1.3,   // per second at reference humidity
        WET_HYDRATION_RESTORE: 9,      // per second while standing on wet ground

        // adaptations
        LONG_LEGS_SPEED_MULTIPLIER: 1.3,
        LONG_LEGS_ENERGY_MULTIPLIER: 1.5,
        CAMOUFLAGE_DETECTION_MULTIPLIER: 0.55,
        MOISTURE_RETENTION_HYDRATION_MULTIPLIER: 0.55,
        MOISTURE_RETENTION_SPEED_MULTIPLIER: 0.9,

        // food
        FOOD_COUNT: 10,
        FOOD_ENERGY_SMALL: 14,
        FOOD_ENERGY_LARGE: 28,
        FOOD_REGROW_TIME: 25,
        FOOD_PICKUP_RADIUS: 18,

        // small creatures
        NPC_COUNT: 6,
        NPC_SPEED: 80,
        NPC_FLEE_SPEED: 135,
        NPC_RADIUS: 8,
        NPC_HUNGRY_BELOW: 65,
        NPC_ENERGY_DRAIN: 1.5,
        NPC_FOOD_ENERGY: 40,
        NPC_MIGRATION_INTERVAL: 14,
        NPC_DANGER_RADIUS_ALERT: 420,  // predator targeting / chasing / attacking
        NPC_DANGER_RADIUS_SEARCH: 260, // predator patrolling
        NPC_DANGER_RADIUS_CALM: 140,   // predator eating / resting

        // shelter
        SHELTER_DETECTION_MULTIPLIER: 0.3,

        // predator
        PREDATOR_SPEED: 70,
        PREDATOR_CHASE_SPEED: 165,
        PREDATOR_DETECTION_RANGE: 460,
        PREDATOR_ATTACK_RANGE: 95,
        PREDATOR_TARGET_TIME: 0.6,     // visible "I saw something" pause
        PREDATOR_ATTACK_TIME: 0.3,
        PREDATOR_FEED_DURATION: 3,
        PREDATOR_COOLDOWN: 10,         // satiated rest
        PREDATOR_INITIAL_DELAY: 6,
        PREDATOR_LOSE_TARGET_TIME: 2,
        PREDATOR_MAX_CHASE_TIME: 8,
        PREDATOR_SCAN_INTERVAL: 0.25
    }
})()
