// config/world.js — hand-authored habitat layout (world units; player is 22 long).
// Zones: home hollow (SW), transition belt (middle), wet basin (S-centre), rock ridge (NE).
;(function() {
    'use strict'
    window.config = window.config || {}

    window.config.world = {
        playerStart:   { x: 450,  y: 1560 },
        predatorStart: { x: 2950, y: 260 },

        shelters: [
            { id: 'root',  kind: 'root',  x: 450,  y: 1560, r: 230 },  // home hollow, Great Root Arch
            { id: 'leaf1', kind: 'leaf',  x: 1450, y: 1150, r: 190 },
            { id: 'ridge', kind: 'bark',  x: 2620, y: 830,  r: 200 },
            { id: 'leaf2', kind: 'leaf',  x: 1950, y: 1860, r: 170 }
        ],
        rocks: [
            { x: 2450, y: 520,  r: 170 },   // landmark: the Ridge Rock
            { x: 2250, y: 770,  r: 105 },
            { x: 1150, y: 560,  r: 85 },
            { x: 2800, y: 1300, r: 95 }
        ],
        stems: [   // big lycopod trunks: solid, taller than the screen
            [800, 1000], [1250, 1500], [1600, 850], [2100, 1250], [2450, 1600],
            [1000, 1900], [350, 900], [1900, 600], [2750, 1050], [2000, 1700],
            [600, 1900], [1450, 300], [3000, 700], [1300, 1850]
        ],
        branches: [  // fallen branches: walls / corridors
            { x1: 850,  y1: 1250, x2: 1500, y2: 1340, r: 34 },
            { x1: 2000, y1: 330,  x2: 2500, y2: 280,  r: 30 }
        ],
        puddle: { x: 1800, y: 1430, r: 300, coreR: 170 },   // landmark: the Basin Pool
        wet: [
            { x: 1800, y: 1430, r: 300 },
            { x: 720,  y: 620,  r: 120 },
            { x: 2900, y: 1750, r: 140 }
        ],
        food: [   // small = low value near cover, large = high value in the open
            { x: 640,  y: 1330, kind: 'small' }, { x: 300,  y: 1290, kind: 'small' },
            { x: 1000, y: 1180, kind: 'small' }, { x: 1450, y: 1420, kind: 'small' },
            { x: 2100, y: 2000, kind: 'small' },
            { x: 1700, y: 1300, kind: 'large' }, { x: 1950, y: 1560, kind: 'large' },
            { x: 2350, y: 1000, kind: 'large' }, { x: 2900, y: 1650, kind: 'large' },
            { x: 1250, y: 760,  kind: 'large' }
        ],
        decorCount: 46
    }
})()
