;(function() {
    'use strict'
    function create(renderer,g,action) {
        var tile=g.tiles[action.ids[0]], G=lowPolyGL.Geometry
        var cx=Math.sqrt(3)*(tile.q+tile.r/2),cz=1.5*tile.r
        var y=.08+Math.sin(cx*.7)*.045+Math.cos(cz)*.045
        var assets=[],fighters=[]
        function mesh(geo){var m=renderer.mesh(geo);assets.push(m);return m}
        for(var owner=0;owner<2;owner++){
            var body=new G(),f=config.colony.factions[g.players[owner].faction]
            mushroomModel.make(body,f,1,tile.decor,false,true,1,tile.look)
            for(var k=0;k<body.data.length;k+=9){body.data[k]*=.7;body.data[k+1]*=.8;body.data[k+2]*=.7}
            var glove=new G();glove.outline=true;glove.ellipsoid(0,0,0,.2,.2,.22,f.color);glove.frustum(0,-.2,0,.11,.12,.08,8,'#ffe6a7')
            fighters.push({body:mesh(body),glove:mesh(glove),owner:owner})
        }
        var arm=new G();arm.outline=true;arm.branch([0,0,0],[0,-1,0],.055,'#ffe4aa');var armMesh=mesh(arm)
        var joint=new G();joint.ellipsoid(0,0,0,.06,.06,.06,'#ffe4aa');var jointMesh=mesh(joint)
        var puff=new G();puff.ellipsoid(0,0,0,.12,.12,.12,'#ffe17b');var puffMesh=mesh(puff)
        return {
            tileId:tile.id,
            center:[cx,y,cz],
            draw:function(elapsed,reduced){
                var duration=gardenConfig.skirmishMs,progress=Math.min(1,elapsed/duration)
                if(progress>=1)return
                fighters.forEach(function(a){
                    var side=a.owner===0?-1:1,phase=elapsed/390-a.owner*.5
                    var contact=Math.max(0,Math.sin(phase*Math.PI*2)),hit=Math.max(0,Math.sin((phase-.5)*Math.PI*2))
                    var approach=Math.min(1,progress*5),separation=1.05-approach*.36
                    var x=cx+side*(separation-hit*.08),z=cz+.12
                    var scale=.88,roll=reduced?0:side*(-hit*.2+Math.sin(elapsed*.015)*.025)
                    var yaw=a.owner===0?Math.PI/2:-Math.PI/2
                    var bob=reduced?0:Math.abs(Math.sin(elapsed*.014))*.055
                    renderer.draw(a.body,[x,y+bob,z],scale,0,yaw,!reduced&&hit>.85?.35:0,roll)
                    var pose=combatRig.pose({x:x,y:y+bob,z:z,yaw:yaw,roll:roll,role:1,tier:1,scale:scale,strike:reduced?.25:contact,moving:false,step:Math.floor(elapsed/390)})
                    function limb(from,to){var bone=combatRig.bone(from,to);renderer.draw(armMesh,from,1,0,bone.yaw,0,bone.roll,[1,bone.length,1])}
                    pose.hands.forEach(function(hand,i){limb(pose.shoulders[i],pose.elbows[i]);limb(pose.elbows[i],hand);renderer.draw(jointMesh,pose.elbows[i],scale);renderer.draw(a.glove,hand,scale,0,yaw)})
                })
                if(!reduced)for(var i=0;i<5;i++){var a=i*1.26+elapsed*.003,r=.18+(elapsed%390)/390*.5;renderer.draw(puffMesh,[cx+Math.cos(a)*r,y+.55+Math.sin(a)*.2,cz+.3],.3+(elapsed%390)/390*.5)}
            },
            dispose:function(){assets.forEach(function(m){renderer.remove(m)})}
        }
    }
    window.gardenBrawl={create:create}
})()
