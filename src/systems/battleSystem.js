;(function () {
    'use strict';
    function distance(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
    function stats(faction, role, fed, tier) {
        var f = config.colony.factions[faction], r = config.colony.roles[role], rank = config.colony.tiers[(tier || 1) - 1];
        return {hp: Math.max(1, r.hp + f.hp) + rank.hp + (fed ? 3 : 0), damage: Math.max(1, r.damage + f.damage) + rank.damage + (fed ? 1 : 0), range: f.melee ? 1 : r.range + f.range};
    }
    function pathStep(unit, target, units) {
        var queue = [{x: unit.x, y: unit.y, first: null}], seen = {};
        seen[unit.x + ',' + unit.y] = true;
        var dirs = [[1, 0], [0, -1], [0, 1], [-1, 0]];
        while (queue.length) {
            var p = queue.shift();
            if (p.first && distance(p, target) <= unit.range) return p.first;
            dirs.forEach(function (d) {
                var x = p.x + d[0], y = p.y + d[1], key = x + ',' + y;
                if (x < 0 || x > 6 || y < 0 || y > 4 || seen[key] || units.some(function (u) { return u.hp > 0 && u.id !== unit.id && u.x === x && u.y === y; })) return;
                seen[key] = true;
                queue.push({x: x, y: y, first: p.first || {x: x, y: y}});
            });
        }
        return null;
    }
    function copy(value) { return JSON.parse(JSON.stringify(value)); }
    function summary(initial, frames) {
        var final = frames[frames.length - 1].units;
        var fighters = initial.map(function (u) {
            var end = final.find(function (v) { return v.id === u.id; });
            return {id: u.id, owner: u.owner, role: u.role, tier: u.tier || 1, faction: u.faction, fed: !!u.fed, maxHp: u.maxHp, hp: end.hp, damage: u.damage, range: u.range, dealt: 0, rawDamage: 0, hits: 0, spores: 0, taken: u.hp - end.hp};
        });
        frames.forEach(function (frame) {
            frame.events.forEach(function (e) {
                var source = fighters.find(function (u) { return u.id === e.from; });
                source.dealt += e.effective;
                source.rawDamage += e.damage;
                source.hits++;
                if (e.kind === 'spore') source.spores++;
            });
        });
        return {steps: frames.length - 1, fighters: fighters, teams: [0, 1].map(function (owner) {
            var team = fighters.filter(function (u) { return u.owner === owner; });
            return {initial: team.length, alive: team.filter(function (u) { return u.hp > 0; }).length, hp: team.reduce(function (n, u) { return n + u.hp; }, 0), maxHp: team.reduce(function (n, u) { return n + u.maxHp; }, 0), dealt: team.reduce(function (n, u) { return n + u.dealt; }, 0), spores: team.reduce(function (n, u) { return n + u.spores; }, 0), fed: team.filter(function (u) { return u.fed; }).length};
        })};
    }
    function simulate(initial) {
        var units = copy(initial), frames = [], winner = null, reason = '', criterion = '';
        function frame(events, decisions) { frames.push({units: copy(units), events: events, decisions: decisions, deaths: events.length ? units.filter(function (u) { return u.hp === 0 && events.some(function (e) { return e.to === u.id; }); }).map(function (u) { return u.id; }) : []}); }
        function eliminated() {
            var alive = [0, 1].map(function (owner) { return units.some(function (u) { return u.owner === owner && u.hp > 0; }); });
            if (alive[0] && alive[1]) return false;
            winner = !alive[0] && !alive[1] ? -1 : alive[0] ? 0 : 1;
            reason = winner < 0 ? 'Оба отряда рассыпались одновременно.' : 'У игрока ' + (2 - winner) + ' не осталось живых бойцов.';
            criterion = 'elimination';
            return true;
        }
        frame([], []);
        for (var step = 0; step < 30; step++) {
            if (eliminated()) break;
            var alive = units.filter(function (u) { return u.hp > 0; }), events = [], moves = [], decisions = [];
            alive.forEach(function (u) {
                var enemies = alive.filter(function (t) { return t.owner !== u.owner; }).sort(function (a, b) { return distance(u, a) - distance(u, b) || a.id - b.id; });
                var target = enemies[0], dist = distance(u, target);
                var decision = {unit: u.id, target: target.id, distance: dist, range: u.range, x: u.x, y: u.y, targetX: target.x, targetY: target.y, action: dist <= u.range ? 'attack' : 'move'};
                decisions.push(decision);
                if (dist <= u.range) {
                    events.push({from: u.id, to: target.id, damage: u.damage, kind: u.role === 2 || dist > 1 ? 'spore' : 'melee', distance: dist, range: u.range, fromX: u.x, fromY: u.y, toX: target.x, toY: target.y, effective: 0});
                } else moves.push({id: u.id, target: target.id, decision: decision});
            });
            moves.sort(function (a, b) { return step % 2 ? a.id - b.id : b.id - a.id; }).forEach(function (m) {
                var u = units.find(function (t) { return t.id === m.id; }), target = units.find(function (t) { return t.id === m.target; }), p = pathStep(u, target, units);
                if (p) { u.x = p.x; u.y = p.y; m.decision.endX = p.x; m.decision.endY = p.y; }
                else m.decision.action = 'blocked';
            });
            // Simultaneous hits: share overkill proportionally instead of crediting array order.
            units.forEach(function (target) {
                var hits = events.filter(function (e) { return e.to === target.id; }), total = hits.reduce(function (n, e) { return n + e.damage; }, 0), effective = Math.min(target.hp, total);
                hits.forEach(function (e) { e.effective = total ? effective * e.damage / total : 0; });
                target.hp = Math.max(0, target.hp - total);
            });
            frame(events, decisions);
        }
        if (winner === null && !eliminated()) {
            var totals = [0, 1].map(function (owner) { return units.filter(function (u) { return u.owner === owner; }).reduce(function (sum, u) { return sum + u.hp / u.maxHp; }, 0); });
            winner = Math.abs(totals[0] - totals[1]) < 1e-8 ? -1 : totals[0] > totals[1] ? 0 : 1;
            reason = 'Лимит 30 шагов: сумма долей здоровья ' + totals.map(function (n) { return n.toFixed(2); }).join(' : ') + '. Большая сумма побеждает; при равенстве — ничья.';
            criterion = 'health';
        }
        return {frames: frames, winner: winner, reason: reason, criterion: criterion, summary: summary(initial, frames)};
    }
    window.battleSystem = {stats: stats, distance: distance, pathStep: pathStep, simulate: simulate};
})();
