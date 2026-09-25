// Game-rule tests: needs, adaptations, shelter, predator targeting, deaths, timer, determinism.
;(function() {
    'use strict'

    var B = config.balance
    var T = TestRunner

    function newRun(adaptation, seed) {
        store.clearAll()
        paleo.begin(true, adaptation || 'camouflage', seed === undefined ? 7 : seed)
        return store.state
    }
    function steps(n) { for (var i = 0; i < n; i++) paleo.step() }
    // park the predator far away and calm so it doesn't interfere
    function neutralizePredator(state) {
        state.predator.x = 3000; state.predator.y = 2100
        state.predator.initialDelay = 9999
    }

    // --- 1. energy decreases
    ;(function() {
        var s = newRun(); neutralizePredator(s)
        var e0 = s.player.energy
        steps(60)
        T.assert(s.player.energy < e0, 'Energy decreases over time')
    })()

    // --- 2. food restores energy
    ;(function() {
        var s = newRun(); neutralizePredator(s)
        s.player.energy = 30
        var f = s.food.items[5]
        s.player.x = f.x; s.player.y = f.y
        steps(3)
        T.assert(s.player.energy > 30 + f.value - 2, 'Eating food restores energy')
        T.assertEqual(s.player.foodEaten, 1, 'Food eaten is counted')
        T.assert(!f.available, 'Eaten food disappears (regrows later)')
    })()

    // --- 3/4. hydration decreases; humidity changes the rate
    ;(function() {
        var s = newRun(); neutralizePredator(s)
        var h0 = s.player.hydration
        steps(60)
        T.assert(s.player.hydration < h0, 'Hydration decreases over time')
        T.assert(playerSystem.hydrationLoss(95, 'camouflage') < playerSystem.hydrationLoss(50, 'camouflage'),
            'Higher humidity means slower hydration loss')
    })()

    // --- 5/6. Long Legs
    T.assert(playerSystem.maxSpeed('longLegs') > playerSystem.maxSpeed('camouflage'), 'Long Legs increases speed')
    T.assert(playerSystem.energyLoss(1, 'longLegs') > playerSystem.energyLoss(1, 'camouflage'),
        'Long Legs increases energy cost of moving')

    // --- 7. Camouflage reduces detection range
    ;(function() {
        var camo = { sheltered: false, detectionMultiplier: playerSystem.getModifiers('camouflage').detection }
        var plain = { sheltered: false, detectionMultiplier: playerSystem.getModifiers('longLegs').detection }
        T.assert(predatorSystem.detectionRange(camo) < predatorSystem.detectionRange(plain),
            'Camouflage reduces predator detection range')

        // in a real run: a predator 300 units away notices a plain player but not a camouflaged one
        var seen = {}
        ;['camouflage', 'longLegs'].forEach(function(ad) {
            var s = newRun(ad)
            s.npcs.list = []
            s.player.x = 1000; s.player.y = 1000; s.player.sheltered = false
            s.predator.x = 1300; s.predator.y = 1000
            seen[ad] = !!predatorSystem.evaluatePrey(s)
        })
        T.assert(!seen.camouflage && seen.longLegs, 'Predator at 300 units notices plain player but not camouflaged one')
    })()

    // --- 8. Moisture Retention
    T.assert(playerSystem.hydrationLoss(78, 'moistureRetention') < playerSystem.hydrationLoss(78, 'camouflage'),
        'Moisture Retention reduces hydration loss')
    T.assert(playerSystem.maxSpeed('moistureRetention') < playerSystem.maxSpeed('camouflage'),
        'Moisture Retention slows movement slightly')

    // --- 9. shelter modifies detection
    ;(function() {
        var open = { sheltered: false, detectionMultiplier: 1 }
        var hidden = { sheltered: true, detectionMultiplier: 1 }
        T.assert(predatorSystem.detectionRange(hidden) < predatorSystem.detectionRange(open),
            'Shelter reduces predator detection range')
        var s = newRun('longLegs'); s.npcs.list = []
        s.player.x = 450; s.player.y = 1560; s.player.sheltered = true      // inside home shelter
        s.predator.x = 450 + 250; s.predator.y = 1560
        T.assert(!predatorSystem.evaluatePrey(s), 'Sheltered player 250 units away is not noticed')
        s.player.sheltered = false
        T.assert(!!predatorSystem.evaluatePrey(s), 'Same player outside shelter is noticed')
    })()

    // --- 10/11/12. predator target selection is generic
    ;(function() {
        var s = newRun('longLegs')
        s.player.sheltered = false
        s.predator.x = 1000; s.predator.y = 1000
        s.npcs.list = s.npcs.list.slice(0, 1)
        var n = s.npcs.list[0]
        n.sheltered = false
        s.player.x = 1300; s.player.y = 1000; n.x = 1100; n.y = 1000
        T.assertEqual(predatorSystem.evaluatePrey(s).kind, 'npc', 'Predator can consider NPC prey (nearer NPC chosen over player)')
        n.x = 1350; n.y = 1000
        T.assertEqual(predatorSystem.evaluatePrey(s).kind, 'player', 'Predator can consider the player (nearer player chosen)')
        // with player far away, NPC alone is chosen
        s.player.x = 100; s.player.y = 100
        n.x = 1100; n.y = 1000
        T.assertEqual(predatorSystem.evaluatePrey(s).kind, 'npc', 'NPC chosen when player is out of range')
        // player never gets special priority: swap positions across many placements
        var npcPicks = 0, playerPicks = 0
        for (var i = 0; i < 10; i++) {
            s.player.x = 1000 + (i % 2 ? 300 : 120); n.x = 1000 + (i % 2 ? 120 : 300); n.y = 1000; s.player.y = 1000
            var k = predatorSystem.evaluatePrey(s).kind
            if (k === 'npc') npcPicks++; else playerPicks++
        }
        T.assert(npcPicks === 5 && playerPicks === 5, 'Predator does not always prioritise the player')
    })()

    // --- 13. NPC can die
    ;(function() {
        var s = newRun()
        var id = s.npcs.list[0].id
        store.dispatch('NPC_DIED', { id: id })
        T.assert(!s.npcs.list[0].alive && s.npcs.killed === 1, 'NPC can die (counted as a predator kill)')
    })()

    // --- 14. predator catches player (through the real state machine)
    ;(function() {
        var s = newRun('longLegs'); s.npcs.list = []
        s.player.x = 1000; s.player.y = 1000; s.player.sheltered = false
        s.predator.x = 1100; s.predator.y = 1000
        s.predator.initialDelay = 0
        steps(240)
        T.assert(!s.player.alive && s.player.causeOfDeath === 'caught', 'Player can be killed by the predator')
        T.assertEqual(s.session.phase, 'ended', 'Run ends when the player is caught')
        T.assertEqual(s.session.cause, 'caught', 'Cause of death is recorded')
    })()

    // --- 15/16. death from energy and dehydration
    ;(function() {
        var s = newRun(); neutralizePredator(s)
        s.player.energy = 0.05
        steps(20)
        T.assert(!s.player.alive && s.session.cause === 'starved', 'Player dies from zero energy')
        s = newRun(); neutralizePredator(s)
        s.player.hydration = 0.05
        steps(20)
        T.assert(!s.player.alive && s.session.cause === 'dehydrated', 'Player dies from dehydration')
    })()

    // --- 17. timer win
    ;(function() {
        var s = newRun(); neutralizePredator(s)
        s.player.energy = 100; s.player.hydration = 100
        s.session.time = s.session.duration - 0.05
        steps(6)
        T.assertEqual(s.session.outcome, 'won', 'Surviving until the timer ends wins')
    })()

    // --- ecosystem autonomy: player idle, world still lives
    ;(function() {
        var s = newRun()
        var before = s.npcs.list.map(function(n) { return [n.x, n.y] })
        steps(60 * 20)
        var moved = 0
        s.npcs.list.forEach(function(n, i) { if (before[i] && Math.hypot(n.x - before[i][0], n.y - before[i][1]) > 50) moved++ })
        T.assert(moved >= 3, 'NPCs move on their own while the player stands still (' + moved + ' moved)')
        T.assert(Math.hypot(s.predator.x - config.world.predatorStart.x, s.predator.y - config.world.predatorStart.y) > 200,
            'Predator patrols on its own')
    })()

    // --- 18. determinism
    ;(function() {
        function run(seed) {
            var s = newRun('camouflage', seed)
            store.dispatch('SET_INPUT', { dx: 1, dy: 0 })
            steps(900)
            return JSON.stringify(s)
        }
        var a = run(123), b = run(123), c = run(124)
        T.assert(a === b, 'Same seed + same inputs give an identical simulation')
        T.assert(a !== c, 'Different seed gives a different simulation')
    })()

    // --- predator hunts NPCs without the player doing anything (statistical, several seeds)
    ;(function() {
        var kills = 0, playerHunts = 0
        for (var seed = 1; seed <= 6; seed++) {
            var s = newRun('camouflage', seed)
            steps(60 * 75)
            kills += s.npcs.killed
            playerHunts += s.predator.encounters
        }
        T.assert(kills >= 2, 'Predator catches small creatures on its own across runs (' + kills + ' kills in 6 runs)')
    })()

    // --- anti-degenerate: hiding motionless for the whole run must lose (safety vs opportunity)
    ;(function() {
        var survived = 0
        ;['longLegs', 'camouflage', 'moistureRetention'].forEach(function(ad) {
            var s = newRun(ad, 11); s.player.sheltered = true
            steps(60 * 76)
            if (s.session.outcome === 'won') survived++
        })
        T.assertEqual(survived, 0, 'Never leaving shelter cannot win with any adaptation')
    })()

})()
