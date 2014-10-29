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
    
    var get_units = function(units, x, y, min, max, index) { //do not include own index?
        var qx = Math.floor(x / QUAD_SIZE);
        var qy = Math.floor(y / QUAD_SIZE);
        var unitindices = [];
        for (var i=min;i<=max;i++) {
            for (var j=min;j<=max;j++) {
                unitindices = unitindices.concat(quad[wrap(qx+i,16)][wrap(qy+j,16)]);
            }
        }
        var unitlist = unitindeces.map(function(i) {
            return units[i];
        });
        return unitlist;
    };

    var npc_for_each = function(fn) {
        for (var x=0;x<width/QUAD_SIZE;x++) {
            for (var y=0;y<height/QUAD_SIZE;y++) {
                quad[x][y].forEach(fn);
            }
        }
    };
    
    var add = function(index, x, y) {
        var qx = Math.floor(x / QUAD_SIZE);
        var qy = Math.floor(y / QUAD_SIZE);
        quad[qx][qy].push(index);
    };
    
    var remove = function(index, x, y) {
        var qx = Math.floor(x / QUAD_SIZE);
        var qy = Math.floor(y / QUAD_SIZE);
        quad[qx][qy] = quad[qx][qy].filter(function(a) {
            return a != index;
        });
    };
    
    return {
        width: width,
        height: height,
        tile: tile,
        quad: quad,
        get_chars: get_chars,
        npc_for_each: npc_for_each
    };
}

function create_npc(ai, x, y) {
    var index = -1;
    var id = randint(10000, 1000000);
    var mapx = x || randint(0, MAP_WIDTH);
    var mapy = y || randint(0, MAP_HEIGHT);
    var quadx = Math.floor(mapx / QUAD_SIZE);
    var quady = Math.floor(mapy / QUAD_SIZE);
    var oldquadx = -1;
    var oldquady = -1;
    var color = "rgb(255,0,0)";
    var hp = 100;
    var agl = randint(3,20);
    var at = 0;
    var target = null;
    
    var move = function(map, x, y) {
        mapx = wrap(mapx + x, MAP_WIDTH);
        mapy = wrap(mapy + y, MAP_HEIGHT);
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
        if (at >= 2000) {
            /** possible bottleneck!! **/
        
            var distances = units.filter(function(u) {
                return u.get_ai() != ai;
            }).units.map(function(u) {
                var x = u.get_x() - mapx;
                var y = u.get_y() - mapy;
                var distance = Math.sqrt(x * x + y * y);
                return {unit:u, distance:distance};
            });
            
            var closest = distances.sort(function(a, b) {
                return a.distance - b.distance;
            })[0];
            
            if (closest) target = closest.unit;
        
            console.log(distances, closest, target);
        
            move(map, randint(-1,2), randint(-1,2)); //todo: move towards target
            at = 0;
        }
    };
    
    var to_string = function() {
        return mapx + ", " + mapy;
    };
    
    return {
        get_ai: function() { return ai; },
        color: color,
        add: add,
        remove: remove,
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
    
    var move = function(map, x, y) {
        mapx = wrap(mapx + x, map.width);
        mapy = wrap(mapy + y, map.height);
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
    
    return {
        get_ai: function() { return ai; },
        move: move,
        get_x: function() { return mapx; },
        get_y: function() { return mapy; },
        client: client,
        send_message: send_message
    }
}

function create_server(client) {
    var map = create_map(MAP_WIDTH, MAP_HEIGHT);
    var units = [];
    var user;

    var add = function(unit) {
        unit.index = units.push(unit) - 1;
        map.add(unit.index);
    };
    
    var loop = function() {
        if (user)
            user.send_message("move", [user.get_x(), user.get_y()]);
        
        map.npc_for_each(function(npc) {
            npc.turn(units, map);
        });
    };
    
    var on_message = function(message) { //todo: arg also contains which user
        if (message.type == "connect") {
            user = create_user(message.data);
            add(user);
            user.send_message("sysmessage", "connection successful!");
            user.send_message("unitupdate", map.get_units(units, user.get_x(), user.get_y(), -1, 1, user.index));
        }
    
        if (message.type == "move") {
            user.move(map, message.data[0], message.data[1]);
            user.send_message("unitupdate", map.get_units(units, user.get_x(), user.get_y(), -1, 1, user.index));
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
