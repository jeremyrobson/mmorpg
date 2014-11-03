var cursorX = 0, cursorY = 0;
var tileX = 0, tileY = 0;

var Bullet = function(x1, y1, x2, y2) {
    var angle = Math.atan2(x2-x1,y2-y1);
    this.x = x1;
    this.y = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.velx = Math.cos(angle);
    this.vely = Math.sin(angle);
};

Bullet.prototype.move = function() {
    this.x += this.velx;
    this.y += this.vely;
};

Bullet.prototype.hit = function() {
    return this.x == this.x2 && this.y == this.y2;
};

function create_client(server) {
    var lasttick = 0;
    var tickcount = 0;
    var map = server.map;
    var tile = map.tile;
    var WIDTH = map.width;
    var HEIGHT = map.height;
    var mousepressed = false;
    var mousex = 0;
    var mousey = 0;
    var mapx = 0;
    var mapy = 0;
    var range = 5;
    var units = [];
    var target = null;
    var bullets = [];
    
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
        
        if (message.type == "unitupdate") {
            units = message.data;
        }
        
        if (message.type == "target") {
            target = units[message.data];
        }
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
            server.send({"type": "move", "data": direction});
    };
    
    var loop = function() {
        if (tickcount > lasttick + 1000/60) {
            lasttick = tickcount;
            
            if (mousepressed) move();
            draw();
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

        if (selected) {
            server.send({"type": "target", "data": selected.index});
        }
    };
    
    var mouse_up = function(x, y) {
        mousepressed = false;
    };
    
    var get_draw_x = function(u) { return wrap(u.x - mapx + 7, WIDTH) };
    var get_draw_y = function(u) { return wrap(u.y - mapy + 7, HEIGHT) };
    
    var draw = function() {
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
            context.fillStyle = "rgba(255,255,0,0.75)";
            context.fillRect(get_draw_x(target)*32, get_draw_y(target)*24, 32, 24);
        }
        
        units.forEach(function(u) {
            var dx = get_draw_x(u);
            var dy = get_draw_y(u);
            
            if (dx >= 0 && dy >= 0 && dx < 16 && dy <= 16) {
                context.fillStyle = u.color;
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
        mouse_move: mouse_move,
        mouse_down: mouse_down,
        mouse_up: mouse_up,
        send: on_message,
        draw: draw
    };
}
