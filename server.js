var pathtable = [
    [-1,0], //w
    [-1,-1], //nw
    [0,-1], //n
    [1,-1], //ne
    [1,0], //e
    [1,1], //se
    [0,1], //s
    [-1,1] //sw
];

var tiletemplates = [
    {
        "name": "water",
        "color": "rgb(50,100,200)",
        "blocked": 1
    },
    {
        "name": "grass",
        "color": "rgb(50,200,100)",
        "blocked": 0
    }
];

function randint(min, max) {
    return Math.floor(Math.random() * (max-min)) + min;
}

function pick_random(arr) {
    return arr[randint(0,arr.length)];
}

var QUAD_SIZE = 64;
var MAP_WIDTH = 1024;
var MAP_HEIGHT = 1024;

function create_map(width, height) {
    var tile = [];
    for (var x=0;x<width;x++) {
        tile[x] = [];
        for (var y=0;y<height;y++) {
            tile[x][y] = pick_random([tiletemplates[0],tiletemplates[1]]);
        }
    }
    var quad = [];
    for (var x=0;x<width/QUAD_SIZE;x++) {
        quad[x] = [];
        for (var y=0;y<height/QUAD_SIZE;y++) {
            quad[x][y] = [];
        }
    }
    
    var get_quad = function(x, y, min, max) {
        var qx = Math.floor(x / QUAD_SIZE);
        var qy = Math.floor(y / QUAD_SIZE);
        var unitindices = [];
        for (var i=min;i<=max;i++) {
            for (var j=min;j<=max;j++) {
                unitindices = unitindices.concat(quad[wrap(qx+i,16)][wrap(qy+j,16)]);
            }
        }
        return unitindices;
    };

    var npc_for_each = function(fn) {
        for (var x=0;x<width/QUAD_SIZE;x++) {
            for (var y=0;y<height/QUAD_SIZE;y++) {
                quad[x][y].forEach(fn);
            }
        }
    };
    
    var get_path = function(x, y, direction) {
        //try moving in three directions according to pinwheel navigation
        var m = {"x":wrap(x+pathtable[direction][0],width),"y":wrap(y+pathtable[direction][1],height)};

        if (tile[m.x][m.y].blocked) {
            m.x = wrap(x+pathtable[(direction+1)&7][0],width);
            m.y = wrap(y+pathtable[(direction+1)&7][1],height);
        }
        
        if (tile[m.x][m.y].blocked) {
            m.x = wrap(x+pathtable[(direction-1)&7][0],width);
            m.y = wrap(y+pathtable[(direction-1)&7][1],height);
        }
        
        if (tile[m.x][m.y].blocked) {
            m.x = x;
            m.y = y;
        }
        
        return m; //todo: change to return direction unit vector, not position!
    };
    
    var add = function(index, qx, qy) {
        quad[qx][qy].push(index);
    };
    
    var remove = function(index, qx, qy) {
        quad[qx][qy] = quad[qx][qy].filter(function(a) {
            return a != index;
        });
    };
    
    return {
        add: add,
        remove: remove,
        get_path: get_path,
        width: width,
        height: height,
        tile: tile,
        get_quad: get_quad,
        npc_for_each: npc_for_each
    };
}

function create_npc(ai, x, y) {
    var index = -1;
    var id = randint(10000, 1000000);
    var NAME = "NPC";
    var mapx = x || randint(0, MAP_WIDTH);
    var mapy = y || randint(0, MAP_HEIGHT);
    var quadx = Math.floor(mapx / QUAD_SIZE);
    var quady = Math.floor(mapy / QUAD_SIZE);
    var oldquadx = -1;
    var oldquady = -1;
    var color = "rgb(255,0,0)";
    var hp = 100;
    var agl = randint(3,20);
    var at = 0;  //todo: change at to tickcount, less calculations
    var target = null;
    
    var move = function(map, dx, dy) {
        mapx = dx;
        mapy = dy;
        var newquadx = Math.floor(mapx / QUAD_SIZE);
        var newquady = Math.floor(mapy / QUAD_SIZE);
        
        if (newquadx != quadx || newquady != quady) {
            oldquadx = quadx;
            oldquady = quady;
            quadx = newquadx;
            quady = newquady;
            map.add(index, newquadx, newquady);
            map.remove(index, oldquadx, oldquady);
        }
    };
    
    var turn = function(units, map) {
        at = at + agl;
        if (at >= 200) {
            /** possible bottleneck!! **/
        
            var distances = units.filter(function(u) {
                return u.get_ai() != ai;
            }).map(function(u) {
                var x = u.get_x() - mapx;
                var y = u.get_y() - mapy;
                var distance = Math.sqrt(x * x + y * y);
                return {unit:u, distance:distance};
            });
            
            var closest = distances.sort(function(a, b) {
                return a.distance - b.distance;
            })[0];
            
            if (closest) target = closest.unit;
            
            var xmove = randint(-1,2);
            var ymove = randint(-1,2);
            
            if (target) {
                var targetx = target.get_x();
                var targety = target.get_y();
                var angle = Math.atan2(mapx - targetx, mapy - targety);
                var direction = (Math.floor((angle*4+Math.PI/2)/Math.PI)+4)&7;  //pinwheel navigation
                var m = map.get_path(mapx, mapy, direction);
                xmove = m.x;
                ymove = m.y;
                if (Math.abs(targety - mapy) > MAP_HEIGHT / 2) ymove = -ymove;
                if (Math.abs(targetx - mapx) > MAP_WIDTH / 2) xmove = -xmove;
            }
            
            move(map, xmove, ymove);
            at = 0;
        }
    };
    
    var to_string = function() {
        return NAME + ": " + mapx + ", " + mapy;
    };
    
    return {
        get_ai: function() { return ai; },
        get_index: function() { return index; },
        color: color,
        get_x: function() { return mapx; },
        get_y: function() { return mapy; },
        get_quad_x: function() { return Math.floor(mapx / QUAD_SIZE); },
        get_quad_y: function() { return Math.floor(mapy / QUAD_SIZE); },
        move: move,
        to_string: to_string,
        turn: turn
    };
}

function create_user(client) {
    var index = -1;
    var id = randint(10000, 1000000);
    var ai = "user";
    var NAME = "User";
    var mapx = 0;
    var mapy = 0;
    var quadx = Math.floor(mapx / QUAD_SIZE);
    var quady = Math.floor(mapy / QUAD_SIZE);
    var oldquadx = -1;
    var oldquady = -1;
    var color = "rgb(255,0,0)";
    var hp = 100;
    var agl = randint(3,20);
    var at = 0;
    var target = null;
    
    var send_message = function(type, data) {
        client.send({"type":type, "data":data}); //use JSON.stringify(data)
    };
    
    var move = function(map, direction) {
        var m = map.get_path(mapx, mapy, direction);
        mapx = m.x;
        mapy = m.y;
        var newquadx = Math.floor(mapx / QUAD_SIZE);
        var newquady = Math.floor(mapy / QUAD_SIZE);
        
        if (newquadx != quadx || newquady != quady) {
            oldquadx = quadx;
            oldquady = quady;
            quadx = newquadx;
            quady = newquady;
            map.add(index, newquadx, newquady);
            map.remove(index, oldquadx, oldquady);
        } 
    };
    
    var to_string = function() {
        return NAME + ": " + mapx + ", " + mapy;
    };
    
    return {
        NAME: NAME,
        get_ai: function() { return ai; },
        get_index: function() { return index; },
        move: move,
        get_x: function() { return mapx; },
        get_y: function() { return mapy; },
        client: client,
        send_message: send_message,
        to_string: to_string
    }
}

function create_server(client) {
    var map = create_map(MAP_WIDTH, MAP_HEIGHT);
    var units = [];
    var user;

    var add = function(unit) {
        unit.index = units.push(unit) - 1;
        unit.move(map, unit.get_x(), unit.get_y());
    };
    
    var loop = function() {
        if (user) {
            user.send_message("move", [user.get_x(), user.get_y()]);
            update_units(user);
        }
        
        units.filter(function(u) {
            return u.get_ai() == "hostile";
        }).forEach(function(u) {
            u.turn(units, map);
        });
    };
    
    var update_units = function(unit) {
        //limit to only when unit's quad changes
        //if (unit.quadchanged) {
        //var unitlist = map.get_quad(unit.get_x(), unit.get_y(), -1, 1).map(function(i) {
        //    return units[i];
        //});
        //.filter(function(u) {
        //    return u.get_index() != unit.get_index();
        //});;
        unit.send_message("unitupdate", units);
        //}
    };
    
    var on_message = function(message) { //todo: arg also contains which user
        if (message.type == "connect") {
            user = create_user(message.data);
            add(user);
            user.send_message("sysmessage", "connection successful!");
        }
    
        if (message.type == "move") {
            user.move(map, message.data);
        }
    };
    
    /*
    for (var i=0;i<200;i++) {
        var npc = create_npc("hostile");
        var qx = npc.get_quad_x();
        var qy = npc.get_quad_y();   
        npc.index = units.push(npc);
    }
    */
    
    var npc = create_npc("hostile", 5, 5);
    add(npc);
    
    return {
        loop: loop,
        map: map,
        send: on_message
    };
}
