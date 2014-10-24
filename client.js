function create_client(server) {
    var lasttick = 0;
    var tickcount = 0;
    var mapwidth = 256;
    var mapheight = 256;
    var mapx = 0;
    var mapy = 0;
    var chars = [];
    
    var load = function(client) {
        server.send({"type": "connect", "data": client});
    };

    var on_message = function(message) {
        if (message.type == "sysmessage") {
            console.log(message.data);
        }
        
        if (message.type == "move") {
            mapx = message.data[0];
            mapy = message.data[1];
        }
        
        if (message.type == "charupdate") {
            chars = message.data;
        }
    };

    var loop = function() {
        if (tickcount > lasttick + 1000/60) {
            lasttick = tickcount;
            
            draw();
        }
        
        tickcount++;
    };
    
    var mouse_down = function(x, y) {
        var angle = Math.atan2(y-180, x-240);
        var movex = Math.round(Math.cos(angle));
        var movey = Math.round(Math.sin(angle));
        server.send({"type": "move", "data": [movex, movey]});
    };
    
    var draw = function() {
        context.fillStyle = "rgb(100,150,225)";
        context.fillRect(0,0,640,480);
        for (var x=0;x<16;x++) {
            for (var y=0;y<16;y++) {
                var tx = wrap(x + mapx - 7, mapwidth);
                var ty = wrap(y + mapy - 7, mapheight);
                context.fillStyle = server.map.tile[tx][ty].color;
                context.fillRect(x*32,y*24,31,23);
            }
        }
        
        chars.forEach(function(c) {
            var dx = c.x - mapx + 7;
            var dy = c.y - mapy + 7;
            
            if (dx >= 0 && dy >= 0 && dx < 16 && dy <= 16) {
                context.fillStyle = c.color;
                context.fillRect(dx*32+4,dy*24-24,24,32);
            }
        });
        
        context.fillStyle = "rgb(0,255,0)";
        context.fillRect(7*32+4,7*24-24,24,32);
        
        context.fillStyle = "rgb(255,255,0)";
        context.font = "32px Calibri Bold";
        context.fillText(mapx + ", " + mapy, 20, 20);
    };
    
    return {
        load: load,
        loop: loop,
        mouse_down: mouse_down,
        send: on_message,
        draw: draw
    };
}
