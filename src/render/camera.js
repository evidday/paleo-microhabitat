// render/camera.js — 3/4 top-down camera. Visual only, never touches game state.
;(function() {
    'use strict'

    var camera = {
        x: 1500, y: 1300, zoom: 1, W: 800, H: 600,
        TILT: 0.75,                       // world Y is compressed: ground recedes

        resize: function(w, h) {
            this.W = w
            this.H = h
            // the player must stay tiny, so zoom follows window size but stays in a narrow band
            this.zoom = Math.max(0.6, Math.min(1.5, Math.min(w / 1100, h / 650)))
        },

        follow: function(state, dt) {
            var tx, ty
            if (state.session.phase === 'menu') {   // menu: watch the wet basin where creatures gather
                tx = 1650; ty = 1300
            } else {
                tx = state.player.x + state.player.vx * 0.35
                ty = state.player.y + state.player.vy * 0.35
            }
            var k = 1 - Math.exp(-dt * 4.5)
            var hw = this.W / 2 / this.zoom, hh = this.H / 2 / this.zoom / this.TILT
            tx = Math.max(hw - 60, Math.min(state.world.w - hw + 60, tx))   // never show the void
            ty = Math.max(hh - 60, Math.min(state.world.h - hh + 60, ty))
            this.x += (tx - this.x) * k
            this.y += (ty - this.y) * k
        },

        sx: function(x) { return (x - this.x) * this.zoom + this.W / 2 },
        sy: function(y) { return (y - this.y) * this.zoom * this.TILT + this.H / 2 },

        // is a world point (with a margin in screen pixels) on screen?
        visible: function(x, y, margin) {
            var sx = this.sx(x), sy = this.sy(y)
            return sx > -margin && sx < this.W + margin && sy > -margin && sy < this.H + margin
        }
    }

    window.camera = camera
})()
