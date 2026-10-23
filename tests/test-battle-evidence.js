;(function () {
    'use strict'; var T = TestRunner;
    function u(id, owner, x, y, hp, damage, role, range) { return {id:id,owner:owner,x:x,y:y,hp:hp,maxHp:hp,damage:damage,role:role||0,range:range||1,faction:owner,fed:false}; }
    var initial=[u(1,0,2,1,20,4),u(2,0,2,3,20,8),u(3,1,2,2,6,1)], battle=battleSystem.simulate(initial), first=battle.frames[1];
    T.assertEqual(first.events.find(function(e){return e.from===1}).effective,2,'Overkill attribution first attacker');
    T.assertEqual(first.events.find(function(e){return e.from===2}).effective,4,'Overkill attribution second attacker');
    T.assert(first.deaths.indexOf(3)>=0,'Elimination recorded at actual hit frame');
    T.assertEqual(battle.criterion,'elimination','Elimination has an explicit win criterion');
    T.assertDeepEqual(initial,[u(1,0,2,1,20,4),u(2,0,2,3,20,8),u(3,1,2,2,6,1)],'Simulation preserves initial snapshots');
    var tie=battleSystem.simulate([u(10,0,2,2,30,1),u(20,1,3,2,30,1)]);
    T.assertEqual(tie.frames.length,31,'Thirty exact attack steps');T.assertEqual(tie.winner,-1,'Last-step simultaneous elimination draws');T.assertEqual(tie.criterion,'elimination','Last-step elimination is not misreported as a timeout');
    var timeout=battleSystem.simulate([u(1,0,2,2,30,0),u(2,1,3,2,30,0)]);T.assertEqual(timeout.criterion,'health','Timeout uses normalized health criterion');
    var targets=battleSystem.simulate([u(1,0,2,2,10,1),u(50,1,3,2,10,1),u(20,1,2,3,10,1)]);T.assertEqual(targets.frames[1].decisions.find(function(d){return d.unit===1}).target,20,'Equidistant target tie uses stable id');
    [initial,[u(1,0,0,2,15,2),u(2,1,6,2,9,3,2,3)],[u(1,0,2,2,4,4),u(2,1,3,2,4,4)], [u(1,0,2,2,10,2,2),u(2,1,3,2,10,1)]].forEach(function(input){
        var b=battleSystem.simulate(input),damage=0;
        b.frames.slice(1).forEach(function(frame,index){var prev=b.frames[index];
            frame.events.forEach(function(e){var source=prev.units.find(function(a){return a.id===e.from}),target=prev.units.find(function(a){return a.id===e.to});
                T.assert(source.hp>0&&target.hp>0,'Only fighters alive at step start attack or receive hits');
                T.assertEqual(e.distance,battleSystem.distance(source,target),'Recorded hit distance matches start snapshot');
                T.assert(e.distance<=e.range,'Every hit was in range at decision time');
                T.assertEqual(e.damage,source.damage,'Shown hit equals source damage');
                T.assertEqual(e.kind,source.role===2||e.distance>1?'spore':'melee','Spore/melee effect matches role and distance');
                T.assert(e.effective>=0&&e.effective<=e.damage,'Effective hit bounded by raw damage');damage+=e.effective;
            });
            frame.units.forEach(function(a){var p=prev.units.find(function(u){return u.id===a.id}),raw=frame.events.filter(function(e){return e.to===a.id}).reduce(function(sum,e){return sum+e.damage},0);T.assertEqual(a.hp,Math.max(0,p.hp-raw),'Frame HP is explained exactly by simultaneous events')});
        });
        var start=input.reduce(function(n,a){return n+a.hp},0),end=b.frames[b.frames.length-1].units.reduce(function(n,a){return n+a.hp},0);
        T.assert(Math.abs(damage-(start-end))<1e-8,'Effective damage conserves lost HP');
        T.assert(Math.abs(b.summary.teams.reduce(function(n,t){return n+t.dealt},0)-damage)<1e-8,'Report team damage matches event evidence');
        T.assertEqual(b.summary.fighters.reduce(function(n,t){return n+t.taken},0),start-end,'Report received damage matches lost HP');
        T.assertDeepEqual(battleSystem.simulate(input),b,'Complete visual evidence is deterministic');
    });
})();
