function draw_line(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "rgb(255,0,0)";
    ctx.lineWidth = 15;
    ctx.stroke();
};

function create_client(server) {
    var lasttick = 0;
    var tickcount = 0;
    var map = server.map;
    var tile = map.tile;
    var WIDTH = map.width;
    var HEIGHT = map.height;
    var mousepressed = false;
    var mousex, mousey = 0;
    var cursorX = 0, cursorY = 0;
    var tileX = 0, tileY = 0;
    var mapx = 0, mapy = 0;
    var range = 5;
    var units = [];
    var target = null;
    var bullets = [];
    
    var send_message = function(type, data) {
        server.send({"type": type, "data": data});
    };
    
    var load = function(client) {
        send_message("connect", client);
    };

    var on_message = function(message) {
        if (message.type == "sysmessage") {
            console.log(message.data);
        }
        
        if (message.type == "move") {
            mapx = message.data[0];
            mapy = message.data[1];
        }
        
        if (message.type == "unitupdate") {
            units = message.data;
        }
        
        if (message.type == "target") {
            target = message.data;
            if (target)
                console.log("Target: " + target.x + ", " + target.y);
        }
        
        /*
        if (message.type == "action") {
            var action = message.data;
            bullets.push(new Bullet(action.x1, action.y1, function() { return target; }, action.type));
        }
        */
    };

    var get_vector = function(x, y, direction) {
        //try moving in three directions according to pinwheel navigation
        var v = pathtable[direction];
        var m = {"x":wrap(x+v[0],WIDTH),"y":wrap(y+v[1],HEIGHT)};
        if (tile[m.x][m.y].blocked) {
            v = pathtable[(direction+1)&7];
            m = {"x":wrap(x+v[0],WIDTH),"y":wrap(y+v[1],HEIGHT)};
        }
        if (tile[m.x][m.y].blocked) {
            v = pathtable[(direction-1)&7];
            m = {"x":wrap(x+v[0],WIDTH),"y":wrap(y+v[1],HEIGHT)};
        }
        if (tile[m.x][m.y].blocked) v = [0,0];
        return v;
    };
    
    var move = function() {
        var angle = Math.atan2(mousey-180, mousex-240);
        var direction = (Math.floor((angle*4+Math.PI/2)/Math.PI)+4)&7; //pinwheel navigation
        var vector = get_vector(mapx, mapy, direction);
        
        if (vector[0] != 0 || vector[1] != 0)
            send_message("move", direction);
    };
    
    var loop = function(context) {
        //todo: better way of moving on single click
        
        if (tickcount > lasttick + 1000/60) {
            lasttick = tickcount;
            
            if (mousepressed) move();
            draw(context);
        }
        
        tickcount++;
    };
    
    var mouse_move = function(x, y) {
        mousex = x;
        mousey = y;
    };
    
    var mouse_down = function(x, y) {
        mousepressed = true;
        mouse_move(x, y);
        
        cursorX = Math.floor(x/32);
        cursorY = Math.floor(y/24);
        
        tileX = wrap(mapx + cursorX - 7, WIDTH);
        tileY = wrap(mapy + cursorY - 7, HEIGHT);
        
        var selected = units.filter(function(u) {
            return u.x == tileX && u.y == tileY;
        })[0];

        if (selected) send_message("target", selected.index);
    };
    
    var mouse_up = function(x, y) {
        mousepressed = false;
    };
    
    var get_draw_x = function(n) { return wrap(n - mapx + 7, WIDTH) * 32 };
    var get_draw_y = function(n) { return wrap(n - mapy  + 7, HEIGHT) * 24 };
    
    var draw = function(context) {
        context.fillStyle = "rgb(100,150,225)";
        context.fillRect(0,0,640,480);
        for (var x=0;x<16;x++) {
            for (var y=0;y<16;y++) {
                var tx = wrap(x + mapx - 7, WIDTH);
                var ty = wrap(y + mapy - 7, HEIGHT);
                context.fillStyle = tile[tx][ty].color;
                context.fillRect(x*32,y*24,31,23);
            }
        }
        
        if (target) {
            var dx = get_draw_x(target.x);
            var dy = get_draw_y(target.y);
            context.fillStyle = "rgba(255,255,0,0.75)";
            context.fillRect(dx, dy, 32, 24);
            var tx = unwrap(target.x, mapx, WIDTH);
            var ty = unwrap(target.y, mapy, HEIGHT);
            draw_line(context, 7*32+4, 7*24+4, (tx - mapx + 7)*32, (ty - mapy + 7)*24);
        }
        
        units.forEach(function(u) {
            var dx = get_draw_x(u.x);
            var dy = get_draw_y(u.y);
            
            if (dx >= 0 && dy >= 0 && dx < 640 && dy <= 480) {
                context.fillStyle = u.color;
                context.fillRect(dx+4,dy-24,24,32);
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
        mouse_move: mouse_move,
        mouse_down: mouse_down,
        mouse_up: mouse_up,
        send: on_message,
        draw: draw
    };
}
