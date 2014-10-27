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
    var mapx = 0;
    var mapy = 0;
    var range = 5;
    var chars = [];
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
        
        if (message.type == "charupdate") {
            chars = message.data;
            console.log(chars);
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
        
        cursorX = Math.floor(x/32);
        cursorY = Math.floor(y/24);
        
        tileX = wrap(mapx + cursorX - 7, MAP_WIDTH);
        tileY = wrap(mapy + cursorY - 7, MAP_HEIGHT);
        
        var selected = chars.filter(function(c) {
            return c.get_x() == tileX && c.get_y() == tileY;
        })[0];
        if (selected) {
            target = selected;
            console.log(target.to_string());
        }
    };
    
    var get_draw_x = function(c) { return wrap(c.get_x() - mapx + 7, MAP_WIDTH) };
    var get_draw_y = function(c) { return wrap(c.get_y() - mapy + 7, MAP_HEIGHT) };
    
    var draw = function() {
        context.fillStyle = "rgb(100,150,225)";
        context.fillRect(0,0,640,480);
        for (var x=0;x<16;x++) {
            for (var y=0;y<16;y++) {
                var tx = wrap(x + mapx - 7, MAP_WIDTH);
                var ty = wrap(y + mapy - 7, MAP_HEIGHT);
                context.fillStyle = server.map.tile[tx][ty].color;
                context.fillRect(x*32,y*24,31,23);
            }
        }
        
        if (target) {
            context.fillStyle = "rgba(0,255,255,0.75)";
            context.fillRect(get_draw_x(target)*32, get_draw_y(target)*24, 32, 24);
        }
        
        chars.forEach(function(c) {
            var dx = get_draw_x(c);
            var dy = get_draw_y(c);
            
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
