// One coordinate system for terrain, colonies, pointers and battle playback.
;(function(){
    'use strict';
    function hex(t){return {x:t.r*1.5,z:-Math.sqrt(3)*(t.q+t.r/2)};}
    function home(g,owner){var base=hex(g.tiles[g.bases[owner]]);return {x:base.x,z:base.z+(owner===0?4.1:-4.1)};}
    function slot(g,owner,index){var h=home(g,owner),side=owner===0?1:-1;return {x:h.x+(index%3-1)*2.05*side,z:h.z+(index<3?-1.1:1.2)*side};}
    function battle(u){return {x:(u.y-2)*1.55,z:(3-u.x)*1.55};}
    window.nurseryWorld={hex:hex,home:home,slot:slot,battle:battle};
})();
