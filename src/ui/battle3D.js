// Visual playback of deterministic battle frames; never writes game state.
;(function () {
    'use strict';
    var battle = null, game = null, gpu = null, meshes = [], actors = [], shared = {},
        cursor = 0, previousTime = null, playing = true, speed = 1, showTargets = false,
        selected = -1, hudKey = '', positions = {}, labelLinks = [], reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    function clamp(n) { return Math.max(0, Math.min(1, n)); }
    function mix(a, b, t) { return a + (b - a) * t; }
    function place(u) { return {x: (u.x - 3) * config.scene.battleSpacing, z: (u.y - 2) * config.scene.battleSpacing}; }
    function name(u) { return 'И' + (u.owner + 1) + ' · ' + config.colony.roles[u.role].name + ' T' + (u.tier||1) + ' #' + (u.id + 1); }
    function current() {
        var index = Math.min(battle.frames.length - 1, Math.floor(cursor));
        return {index: index, a: battle.frames[index], b: battle.frames[Math.min(index + 1, battle.frames.length - 1)], t: cursor - index};
    }
    function visible() {
        var c = current(), impact = c.t >= config.scene.battleImpact;
        return c.a.units.map(function (a) {
            var b = c.b.units.find(function (u) { return u.id === a.id; });
            return Object.assign({}, a, {hp: impact ? b.hp : a.hp});
        });
    }
    function release() {
        if (gpu) meshes.forEach(function (m) { gpu.remove(m); });
        meshes = []; actors = []; shared = {}; gpu = null; positions = {};
    }
    function mesh(geometry) { var m = gpu.mesh(geometry); meshes.push(m); return m; }
    function makeGeometry(fn) { var g = new lowPolyGL.Geometry(); fn(g); return mesh(g); }
    function prepare(renderer) {
        if (gpu === renderer) return;
        release(); gpu = renderer;
        actors = battle.frames[0].units.map(function (u) {
            var g = new lowPolyGL.Geometry();
            colony3D.makeMushroom(g, config.colony.factions[u.faction], u.role, u.id % 3, false, true, u.tier, u.look);
            for(var v=0;v<g.data.length;v+=9){g.data[v]*=.7;g.data[v+1]*=.8;g.data[v+2]*=.7}return {unit: u, mesh: mesh(g)};
        });
        shared.arm=makeGeometry(function(g){g.outline=true;g.branch([0,0,0],[0,-1,0],.04,'#ffe4aa')});shared.joint=makeGeometry(function(g){g.ellipsoid(0,0,0,.052,.052,.052,'#ffe4aa')});
        shared.foot = makeGeometry(function (g) { g.box(0, 0, .03, .12, .1, .22, '#b7a77e'); });
        shared.glove=makeGeometry(function(g){g.outline=true;g.ellipsoid(0,0,0,.18,.18,.2,'#ff608a');g.frustum(0,-.19,0,.1,.11,.08,8,'#ffe6a7')});
        shared.weapon = makeGeometry(function (g) { g.branch([0, -.15, 0], [0, .5, 0], .035, '#846744'); g.box(0, .42, .04, .26, .2, .09, '#c5c9b4'); });
        shared.shield = makeGeometry(function (g) { g.box(0, 0, 0, .32, .4, .09, '#687f6f'); g.box(0, .03, .05, .035, .31, .015, '#d8c786'); });
        shared.sack = makeGeometry(function (g) { g.frustum(0, 0, 0, .15, .09, .26, 6, '#96b560'); });
        shared.spore = makeGeometry(function (g) { g.frustum(0, -.08, 0, .07, .11, .09, 6, '#d1e591'); g.frustum(0, .01, 0, .11, 0, .12, 6, '#f1d797'); });
        [0,1].forEach(function(owner){shared['team'+owner]=makeGeometry(function(geo){var f=config.colony.factions[game.players[owner].faction];for(var i=0;i<16;i++){var a=i*Math.PI/8,b=(i+1)*Math.PI/8;geo.branch([Math.cos(a)*.35,.025,Math.sin(a)*.35],[Math.cos(b)*.35,.025,Math.sin(b)*.35],.025,f.color)}})});
        shared.ring = makeGeometry(function (g) { for (var i = 0; i < 20; i++) { var a = i * Math.PI / 10, b = (i + 1) * Math.PI / 10; g.branch([Math.cos(a) * .48, .03, Math.sin(a) * .48], [Math.cos(b) * .48, .03, Math.sin(b) * .48], .014, '#e9d89b'); } });
        shared.shadow = makeGeometry(function (g) { g.frustum(0, 0, 0, .34, .34, .003, 10, '#506648'); });
        var layer = document.querySelector('#colony-scene .scene-labels');
        if (layer) {
            layer.innerHTML = '';
            actors.forEach(function (actor) {
                var u = actor.unit, label = document.createElement('button');
                label.className = 'combat-label'; label.dataset.fighter = u.id;
                label.style.setProperty('--team', config.colony.factions[u.faction].color);
                label.onclick = function () { select(u.id); };
                layer.appendChild(label);
            });
        }
    }
    function draw(renderer, g, time) {
        if (!battle || battle !== g.battle) return;
        prepare(renderer);
        var c = current(), fraction = reduced.matches ? (c.t >= config.scene.battleImpact ? 1 : 0) : c.t,
            moveT = reduced.matches ? fraction : clamp(c.t / .55), hpUnits = visible();
        positions = {};
        actors.forEach(function (actor) {
            var a = c.a.units.find(function (u) { return u.id === actor.unit.id; }), b = c.b.units.find(function (u) { return u.id === a.id; }),
                pa = place(a), pb = place(b), decision = c.b.decisions.find(function (d) { return d.unit === a.id; }),
                x = mix(pa.x, pb.x, moveT), z = mix(pa.z, pb.z, moveT), moving = a.x !== b.x || a.y !== b.y,
                target = decision && c.a.units.find(function (u) { return u.id === decision.target; }),
                yaw = target ? Math.atan2(place(target).x - x, place(target).z - z) : a.owner === 0 ? Math.PI / 2 : -Math.PI / 2,
                strike=combatRig.attack(c.t,!!decision&&decision.action==='attack'),
                shot = c.b.events.find(function (e) { return e.from === a.id; }), melee = shot && shot.kind === 'melee',
                hop = moving && moveT < 1 && !reduced.matches ? Math.abs(Math.sin(moveT * Math.PI * 4)) * .045 : 0,
                deadNow = a.hp > 0 && b.hp === 0 && c.t >= config.scene.battleImpact,
                scale = deadNow ? reduced.matches ? 0 : 1 - clamp((c.t - config.scene.battleImpact) / .24) : 1;
            if (melee && !reduced.matches) { x += Math.sin(yaw) * strike * .06; z += Math.cos(yaw) * strike * .06; }
            var spawn = !reduced.matches && c.index===0 ? clamp(c.t/.65) : 1;
            if(spawn<1){var home=colony3D.center(g.tiles[a.id]);x=mix(home.x,x,spawn);z=mix(home.z,z,spawn);scale*=Math.max(.02,spawn);hop+=Math.sin(spawn*Math.PI)*.35}
            var y = colony3D.height(x, z) + .07 + hop;
            positions[a.id] = {x: x, y: y, z: z, yaw: yaw, hp: hpUnits.find(function (u) { return u.id === a.id; }).hp};
            if (a.hp <= 0 || scale <= 0) return;
            renderer.draw(shared.shadow,[x,colony3D.height(x,z)+.022,z],1,0);renderer.draw(shared['team'+a.owner],[x,colony3D.height(x,z)+.05,z]);
            if (selected === a.id) renderer.draw(shared.ring, [x, colony3D.height(x, z) + .04, z]);
            var step = moving && !reduced.matches ? Math.sin(moveT * Math.PI * 4) * .1 : 0;
            [-1, 1].forEach(function (side) {
                renderer.draw(shared.foot, [x + Math.cos(yaw) * .1 * side + Math.sin(yaw) * step * side, y - .03 + Math.max(0, step * side), z - Math.sin(yaw) * .1 * side + Math.cos(yaw) * step * side], scale, 0, yaw);
            });
            var hit = c.b.events.some(function (e) { return e.to === a.id; }) && c.t >= config.scene.battleImpact && c.t < .9;
            var wobble=reduced.matches?0:(moving?Math.sin(cursor*12)*.035:0)+(hit?Math.sin((c.t-.76)*35)*.1:0)+(deadNow?(c.t-.76)*3:0);
            renderer.draw(actor.mesh, [x, y + .06, z], scale, 0, yaw, hit ? .75 : 0,wobble);
            var rig=combatRig.pose({x:x,y:y,z:z,yaw:yaw,roll:wobble,tier:a.tier,role:a.role,scale:scale,moving:moving,reduced:reduced.matches,phase:cursor,strike:strike,step:c.index});
            function limb(from,to){var bone=combatRig.bone(from,to);if(bone.length>.001)renderer.draw(shared.arm,from,1,0,bone.yaw,hit?.3:0,bone.roll,[1,bone.length,1])}
            rig.hands.forEach(function(hand,i){limb(rig.shoulders[i],rig.elbows[i]);limb(rig.elbows[i],hand);renderer.draw(shared.joint,rig.elbows[i],rig.scale*.75);if(a.role===1)renderer.draw(shared.glove,hand,rig.scale*.85,0,yaw);else renderer.draw(shared.joint,hand,rig.scale)});
            if(a.role===0){var hand=rig.hands[0];renderer.draw(shared.shield,[hand[0],hand[1]-.16*rig.scale,hand[2]],rig.scale,0,yaw)}
            if(a.role===2){var hand=rig.hands[1];renderer.draw(shared.sack,[hand[0],hand[1]-.06*rig.scale,hand[2]],rig.scale,0,yaw)}
            var muzzle=rig.hands[a.role===0?0:1];positions[a.id].muzzle={x:muzzle[0],y:muzzle[1]+.14,z:muzzle[2]};

        });
        c.b.events.forEach(function (event) {
            var from = positions[event.from], to = positions[event.to];
            if (!from || !to || event.kind !== 'spore' || reduced.matches || c.t < .2 || c.t > config.scene.battleImpact) return;
            var p = clamp((c.t - .2) / (config.scene.battleImpact - .2));
            for (var i = 0; i < 3; i++) {
                var trail = Math.max(0, p - i * .055);
                renderer.draw(shared.spore, [mix((from.muzzle||from).x,to.x,trail),mix((from.muzzle||from).y,to.y+.6,trail)+Math.sin(trail*Math.PI)*.45,mix((from.muzzle||from).z,to.z,trail) + i * .025], 1.4 - i * .25, 0, trail * 5);
            }
        });
        if (!reduced.matches && c.t >= config.scene.battleImpact) {
            var age = clamp((c.t - config.scene.battleImpact) / .24);
            c.b.deaths.forEach(function (id) {
                var p = positions[id]; if (!p) return;
                for (var i = 0; i < 8; i++) {
                    var angle = i * Math.PI / 4;
                    renderer.draw(shared.spore, [p.x + Math.cos(angle) * age * .65, p.y + .2 + age * (1 + i % 3 * .18), p.z + Math.sin(angle) * age * .65], (1 - age) * .6);
                }
            });
        }
        updateLabels(renderer, hpUnits);
        drawLines(renderer, c);
    }
    function updateLabels(renderer, units) {
        var layer = document.querySelector('#colony-scene .scene-labels');
        if (!layer) return;
        var width = layer.clientWidth, height = layer.clientHeight, used = [], labels = [];
        actors.forEach(function (actor) {
            var u = units.find(function (v) { return v.id === actor.unit.id; }), p = positions[u.id], el = document.querySelector('[data-fighter="' + u.id + '"]');
            if (!p || !el) return;
            el.hidden = u.hp <= 0;
            if (el.hidden) return;
            var cap = config.colony.factions[u.faction].style === 'elf' ? 1.95 : 1.65;
            var q = renderer.project([p.x, p.y + cap, p.z]);
            if (el.dataset.hp !== String(u.hp)) {
                el.dataset.hp = String(u.hp);
                el.innerHTML = '<span>И' + (u.owner + 1) + ' · T'+(u.tier||1)+' #' + (u.id + 1) + ' ' + config.colony.roles[u.role].icon + '</span><i><b style="width:' + (u.hp / u.maxHp * 100) + '%"></b></i><span>' + u.hp + '/' + u.maxHp + '</span>';
                el.setAttribute('aria-label', name(u) + ', здоровье ' + u.hp + ' из ' + u.maxHp);
            }
            el.classList.toggle('chosen', selected === u.id);
            labels.push({el:el,u:u,q:q});
        });
        labelLinks = [];
        labels.sort(function (a,b) { return a.q.y - b.q.y || a.q.x - b.q.x; });
        labels.forEach(function (item) {
            var w = item.el.offsetWidth, h = item.el.offsetHeight, x, y, rect;
            var candidates = [[0,0],[0,-h-5],[-w*.7,-h-5],[w*.7,-h-5],[0,-h*2-10],[-w,0],[w,0]].map(function (offset) { return {x:item.q.x+offset[0],y:item.q.y+offset[1]}; });
            for(var gy=h+4;gy<height-4;gy+=h+6) for(var gx=w/2+4;gx<width-w/2-3;gx+=w+6) candidates.push({x:gx,y:gy});
            candidates.sort(function(a,b){return Math.pow(a.x-item.q.x,2)+Math.pow(a.y-item.q.y,2)-Math.pow(b.x-item.q.x,2)-Math.pow(b.y-item.q.y,2)});
            for (var i=0;i<candidates.length;i++) {
                x=candidates[i].x;y=candidates[i].y;
                if(x-w/2<3||x+w/2>width-3||y-h<3||y>height-3)continue;
                rect={left:x-w/2,right:x+w/2,top:y-h,bottom:y};
                if (!used.some(function (r) { return rect.left<r.right+3 && rect.right>r.left-3 && rect.top<r.bottom+3 && rect.bottom>r.top-3; })) break;
            }
            used.push(rect); item.el.style.left=x+'px'; item.el.style.top=y+'px';
            labelLinks.push({x:x,y:y,target:item.q,color:config.colony.factions[item.u.faction].color});
        });
    }
    function drawLines(renderer, c) {
        var canvas = document.querySelector('#colony-scene .scene-lines'); if (!canvas) return;
        var glCanvas = document.querySelector('.colony-webgl'), ctx = canvas.getContext('2d'), width = glCanvas.width, height = glCanvas.height;
        if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
        ctx.clearRect(0, 0, width, height); ctx.save();
        var ratio = width / glCanvas.getBoundingClientRect().width; ctx.scale(ratio, ratio);
        labelLinks.forEach(function (l) { if (Math.hypot(l.x-l.target.x,l.y-l.target.y)<5) return; ctx.beginPath();ctx.moveTo(l.x,l.y);ctx.lineTo(l.target.x,l.target.y+6);ctx.strokeStyle=l.color;ctx.lineWidth=1;ctx.globalAlpha=.8;ctx.stroke(); });
        c.b.decisions.forEach(function (d) {
            var from = positions[d.unit], to = positions[d.target];
            if(!from||!to||!showTargets&&selected!==d.unit&&(d.action!=='attack'||c.t<.2||c.t>.8))return;
            if (from.hp <= 0 && c.t >= config.scene.battleImpact) return;
            var a = renderer.project([from.x, from.y + .7, from.z]), b = renderer.project([to.x, to.y + .7, to.z]), u = c.a.units.find(function (u) { return u.id === d.unit; });
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = config.colony.factions[u.faction].color; ctx.lineWidth = selected === d.unit ? 2.5 : 1.3; ctx.setLineDash(d.action === 'attack' ? [] : [4, 5]); ctx.globalAlpha = selected === d.unit ? .95 : .55; ctx.stroke();
            var angle = Math.atan2(b.y - a.y, b.x - a.x);
            ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - Math.cos(angle - .4) * 9, b.y - Math.sin(angle - .4) * 9); ctx.lineTo(b.x - Math.cos(angle + .4) * 9, b.y - Math.sin(angle + .4) * 9); ctx.closePath(); ctx.fillStyle = ctx.strokeStyle; ctx.fill();
        });
        ctx.setLineDash([]); ctx.globalAlpha = 1;
        if (c.t >= config.scene.battleImpact && c.t < .99) c.b.events.forEach(function (e, i) {
            var to = positions[e.to]; if (!to) return;
            var p = renderer.project([to.x, to.y + 1.2 + (c.t - .76) * 1.3, to.z]);
            ctx.font = 'bold 13px Consolas'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#183127'; ctx.fillStyle = '#fff0b1';
            var label = '−' + e.damage + ' [#' + (e.from + 1) + ']';
            ctx.strokeText(label, p.x + i % 2 * 16, p.y - i % 3 * 15); ctx.fillText(label, p.x + i % 2 * 16, p.y - i % 3 * 15);
        });
        ctx.restore();
    }
    function unitById(id) { return battle.frames[0].units.find(function (u) { return u.id === id; }); }
    function select(id) { document.body.classList.add('battle-info');selected = id; hudKey = ''; updateHUD(); }
    function pick(renderer, x, y) {
        var candidates = [];
        actors.forEach(function (a) {
            var p = positions[a.unit.id]; if (!p || p.hp <= 0) return;
            var q = renderer.project([p.x, p.y + .75, p.z]), edge = renderer.project([p.x + .6, p.y + .75, p.z]), radius = Math.max(15, Math.abs(edge.x - q.x));
            if (Math.hypot(x - q.x, y - q.y) < radius) candidates.push({id: a.unit.id, depth: q.depth});
        });
        candidates.sort(function (a, b) { return b.depth - a.depth; });
        return candidates.length ? candidates[0].id : -1;
    }
    function actionText(d) {
        var a = unitById(d.unit), b = unitById(d.target);
        return name(a) + ' → ' + name(b) + ': ' + (d.action === 'attack' ? 'атакует' : d.action === 'blocked' ? 'путь занят, ждёт' : 'идёт ближе') + '. На начало шага: дистанция ' + d.distance + ', дальность ' + d.range + '.';
    }
    function updateHUD() {
        if (!battle || !document.getElementById('battle-step')) return;
        var c = current(), units = visible(), stamp = c.index + ':' + (c.t >= config.scene.battleImpact) + ':' + selected + ':' + playing + ':' + speed;
        if (stamp === hudKey) return; hudKey = stamp;
        document.getElementById('battle-step').textContent = 'Шаг ' + Math.min(battle.frames.length - 1, Math.ceil(cursor)) + ' / ' + (battle.frames.length - 1) + (cursor >= battle.frames.length - 1 ? ' · БОЙ ЗАВЕРШЁН' : playing ? ' · ПРОСМОТР' : ' · ПАУЗА');
        document.getElementById('battle-pause').textContent = playing ? 'Пауза' : 'Продолжить';
        document.getElementById('speed').textContent = 'Скорость ×' + speed;
        document.getElementById('resolve').textContent = cursor >= battle.frames.length - 1 ? 'Итог и награды →' : 'Пропустить → результат';
        document.getElementById('battle-team-counts').innerHTML = [0, 1].map(function (owner) {
            var alive = units.filter(function (u) { return u.owner === owner && u.hp > 0; });
            return '<span style="--team:' + config.colony.factions[game.players[owner].faction].color + '">И' + (owner + 1) + ' · ' + alive.length + ' в строю · ♥ ' + alive.reduce(function (n, u) { return n + u.hp; }, 0) + '</span>';
        }).join('');
        var decision = c.b.decisions.find(function (d) { return d.unit === selected; }), selectedUnit = units.find(function (u) { return u.id === selected; });
        document.getElementById('fighter-inspect').innerHTML = selectedUnit ? '<h3>' + name(selectedUnit) + '</h3><p>♥ ' + selectedUnit.hp + '/' + selectedUnit.maxHp + ' · Урон ' + selectedUnit.damage + ' · Дальность ' + selectedUnit.range + '</p><p>' + (selectedUnit.fed ? '● Накормлен: +3 HP, +1 урон.' : '○ Без рациона.') + '</p><p>' + config.colony.factions[selectedUnit.faction].plus + ' / ' + config.colony.factions[selectedUnit.faction].minus + '</p><p>' + (selectedUnit.hp <= 0 ? 'Рассыпался. Домашний гриб сохранён.' : decision ? actionText(decision) : 'Бой завершён.') + '</p>' : '<h3>Кто кого бьёт?</h3><p>Нажмите на бойца, его HP или имя в списке. Стрелка ведёт от атакующего к его цели.</p>';
        var recent = battle.frames.slice(1, c.index + (c.t >= config.scene.battleImpact ? 2 : 1)).map(function (f, i) {
            return f.events.map(function (e) { return 'Шаг ' + (i + 1) + ': #' + (e.from + 1) + ' → #' + (e.to + 1) + ' · ' + (e.kind === 'spore' ? 'споры' : 'удар') + ' −' + e.damage + (e.effective < e.damage - .001 ? ' (эффективно ' + e.effective.toFixed(1) + ')' : ''); });
        }).flat().slice(-6).reverse();
        document.getElementById('battle-events').innerHTML = recent.length ? recent.map(function (t) { return '<li>' + t + '</li>'; }).join('') : '<li>Бойцы сходятся. Удары появятся здесь.</li>';
        document.getElementById('battle-decisions').innerHTML = c.b.decisions.filter(function (d) { return selected < 0 || d.unit === selected; }).slice(0, 10).map(function (d) { return '<li>' + actionText(d) + '</li>'; }).join('');
        var fallback = document.querySelector('.battle-vector');
        if (fallback) fallback.innerHTML = gameArt.ring(game, {units: units, events: c.t >= config.scene.battleImpact ? c.b.events : []}, false);
    }
    function advance(time, g) {
        if (!battle || g.battle !== battle || g.phase !== 'battle') return;
        if(window.battleIntro&&battleIntro.active()){previousTime=time;return}
        if (previousTime === null) previousTime = time;
        var dt = Math.min((time - previousTime) / config.scene.battleStepMs, .2); previousTime = time;
        if (playing) cursor = Math.min(battle.frames.length - 1, cursor + dt * speed);
        if (cursor >= battle.frames.length - 1) playing = false;
        updateHUD();
    }
    function mount(g) {
        game = g;
        if (battle !== g.battle) { release(); battle = g.battle; cursor = 0; playing = true; previousTime = null; selected = -1; hudKey = ''; }
        document.getElementById('speed').onclick = function () { speed = speed === 1 ? 2 : 1; hudKey = ''; updateHUD(); };
        document.getElementById('battle-pause').onclick = function () { playing = !playing; hudKey = ''; updateHUD(); };
        document.getElementById('battle-next-step').onclick = function () { playing = false; cursor = Math.min(battle.frames.length - 1, Math.floor(cursor + .0001) + 1); hudKey = ''; updateHUD(); };
        document.getElementById('battle-replay').onclick = function () { cursor = 0; playing = true; previousTime = null; hudKey = ''; updateHUD(); };
        document.getElementById('battle-targets').onclick = function () { showTargets = !showTargets; this.setAttribute('aria-pressed', String(showTargets)); };
        document.getElementById('resolve').onclick = function () { store.dispatch('RESOLVE'); };
        document.querySelectorAll('[data-inspect]').forEach(function (b) { b.onclick = function () { select(+b.dataset.inspect); }; });
        updateHUD();
    }
    function html(g) {
        return '<section class="battle-view">'+flowUI.goal(g)+'<div class="battle-title"><small>ОБЩИЙ МИЦЕЛИЙ / БОЕВЫЕ ПРОЕКЦИИ</small><h2>' + [0, 1].map(function (i) { return '<span style="color:' + config.colony.factions[g.players[i].faction].color + '">' + config.colony.factions[g.players[i].faction].name + '</span>'; }).join(' <span class="muted">против</span> ') + '</h2></div>'+gameIcons.story(false)+'<div id="battle-team-counts" class="battle-team-counts"></div><div class="battle-layout"><div>' + colony3D.html(g) + '<div class="battle-controls"><button id="battle-pause">Пауза</button><button id="battle-next-step">Шаг →</button><button id="speed">Скорость ×1</button><button id="battle-replay">Сначала ↺</button><button id="battle-targets" aria-pressed="'+showTargets+'">Цели</button><button class="primary" id="resolve">Пропустить → результат</button></div><p id="battle-step" role="status"></p></div><aside class="panel combat-panel"><div id="fighter-inspect"></div><div class="combat-roster">' + g.battle.frames[0].units.map(function (u) { return '<button data-inspect="' + u.id + '" style="border-left-color:' + config.colony.factions[u.faction].color + '">' + name(u) + '</button>'; }).join('') + '</div><h3>Попадания</h3><ol id="battle-events" class="combat-log"></ol><details open><summary>Почему выбрана цель</summary><ul id="battle-decisions" class="combat-log"></ul></details><p class="muted">Ближайший враг; при равенстве — меньший номер. Дистанция считается по клеткам. Решения и урон одного шага одновременные. Поражение не уничтожает домашний гриб.</p></aside></div></section>';
    }
    function report(g) {
        var s = g.battle.summary;
        if (!s) return '';
        var top = s.fighters.slice().sort(function (a, b) { return b.dealt - a.dealt || a.id - b.id; })[0];
        var lead = top && top.dealt > 0 ? name(top) + ' нанёс больше всего эффективного урона: ' + top.dealt.toFixed(1) + '.' : 'Ни один боец не нанёс урона.';
        var noHits = s.fighters.filter(function (u) { return u.hits === 0; });
        if (noHits.length) lead += ' Без попаданий: ' + noHits.map(name).join(', ') + '.';
        return '<section class="battle-report"><h3>Почему такой результат</h3><p>' + g.battle.reason + '</p><p>' + lead + '</p><div class="report-teams">' + s.teams.map(function (t, i) {
            return '<article style="border-color:' + config.colony.factions[g.players[i].faction].color + '"><h3>Игрок ' + (i + 1) + '</h3><p>В строю: ' + t.alive + ' / ' + t.initial + '<br>Здоровье: ' + t.hp + ' / ' + t.maxHp + '<br>Эффективный урон: ' + t.dealt.toFixed(1) + '<br>Споровых атак: ' + t.spores + '<br>Накормлено перед боем: ' + t.fed + '</p></article>';
        }).join('') + '</div><p>Бой длился ' + s.steps + ' шагов. Урон и выжившие ниже — факты этого боя; бонусы фракции и корма уже учтены в исходных характеристиках.</p><div class="report-scroll"><table><thead><tr><th>Боец</th><th>HP</th><th>Урон / дальн.</th><th>Нанёс</th><th>Получил</th><th>Попадания</th></tr></thead><tbody>' + s.fighters.map(function (u) {
            return '<tr><td>' + name(u) + (u.fed ? ' · сыт' : '') + '</td><td>' + u.hp + '/' + u.maxHp + '</td><td>' + u.damage + ' / ' + u.range + '</td><td>' + u.dealt.toFixed(1) + '</td><td>' + u.taken + '</td><td>' + u.hits + ' (' + u.spores + ' спор.)</td></tr>';
        }).join('') + '</tbody></table></div><p class="muted">«Нанёс» — эффективный урон без лишнего урона по уже добитой цели. При одновременном добивании он распределён пропорционально силе атак.</p></section>';
    }
    window.battle3D = {html: html, mount: mount, advance: advance, draw: draw, pick: pick, select: select, report: report,
        unmount: function () { release(); battle = null; game = null; previousTime = null; },
        refresh: function () { hudKey = ''; updateHUD(); },
        metrics: function () { return {cursor: cursor, playing: playing, speed: speed, selected: selected, meshes: meshes.length, positions: JSON.parse(JSON.stringify(positions))}; }};
})();
