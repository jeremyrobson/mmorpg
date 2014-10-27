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
    
    /*
    for (var i=0;i<200;i++) {
        var npc = create_npc("hostile");
        var qx = npc.get_quad_x();
        var qy = npc.get_quad_y();   
        quad[qx][qy].push(npc);
    }
    */
    
    var npc = create_npc("hostile", 5, 5);
    quad[0][0].push(npc);
    
    var get_chars = function(x, y, min, max, exclude) { //do not include self
        var qx = Math.floor(x / QUAD_SIZE);
        var qy = Math.floor(y / QUAD_SIZE);
        var charlist = [];
        for (var i=min;i<=max;i++) {
            for (var j=min;j<=max;j++) {
                charlist = charlist.concat(quad[wrap(qx+i,16)][wrap(qy+j,16)]);
            }
        }
        return charlist;
    };

    var npc_for_each = function(fn) {
        for (var x=0;x<width/QUAD_SIZE;x++) {
            for (var y=0;y<height/QUAD_SIZE;y++) {
                quad[x][y].forEach(fn);
            }
        }
    };
    
    var update_quad = function(unit) {
        var qx = Math.floor(unit.get_x() / QUAD_SIZE);
        var qy = Math.floor(unit.get_y() / QUAD_SIZE);
        
        
        
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
    //var id = randint(10000,1000000);
    var mapx = x || randint(0, MAP_WIDTH);
    var mapy = y || randint(0, MAP_HEIGHT);
    var qx = Math.floor(mapx / QUAD_SIZE);
    var qy = Math.floor(mapy / QUAD_SIZE);
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
        
        if (newquadx != qx || newquady != qy) {
            map.remove
        }
    };
    
    var turn = function(users, map) {
        at = at + agl;
        if (at >= 2000) {
            /** possible bottleneck!! **/
            var chars = users.concat(map.get_chars(mapx, mapy, 0, 0));
        
            var distances = chars.map(function(c) {
                var x = c.get_x() - mapx;
                var y = c.get_y() - mapy;
                var distance = Math.sqrt(x * x + y * y);
                return {unit:c, distance:distance};
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
        ai: ai,
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
    var mapx = 0;
    var mapy = 0;
    var quadx = 0;
    var quady = 0;
    
    var send_message = function(type, data) {
        client.send({"type":type, "data":data}); //use JSON.stringify(data)
    };
    
    var move = function(map, x, y) {
        mapx = wrap(mapx + x, map.width);
        mapy = wrap(mapy + y, map.height);
        var newquadx = Math.floor(mapx / QUAD_SIZE);
        var newquady = Math.floor(mapy / QUAD_SIZE);
        
        if (newquadx != quadx || newquady != quady) {
            quadx = newquadx;
            quady = newquady;
            send_message("charupdate", map.get_chars(mapx, mapy, -1, 1));
        }
        
    };
    
    return {
        move: move,
        get_x: function() { return mapx; },
        get_y: function() { return mapy; },
        client: client,
        send_message: send_message
    }
}

function create_server(client) {
    var map = create_map(MAP_WIDTH, MAP_HEIGHT);
    var users = [];
    var user;
    
    var loop = function() {
        if (user)
            user.send_message("move", [user.get_x(), user.get_y()]);
        
        map.npc_for_each(function(npc) {
            npc.turn(users, map);
        });
    };
    
    var get_chars = function(x, y, min, max) {
        var chars = [];
        chars = users.concat(map.get_chars(user.get_x(), user.get_y(), min, max));
        return chars;
    };
    
    var on_message = function(message) { //todo: arg also contains user
        if (message.type == "connect") {
            user = create_user(message.data);
            user.send_message("sysmessage", "connection successful!");
            user.send_message("charupdate", map.get_chars(user.get_x(), user.get_y(), -1, 1));
            users.push(user);
        }
    
        if (message.type == "move") {
            user.move(map, message.data[0], message.data[1]);
        }
    };
    
    return {
        loop: loop,
        map: map,
        send: on_message
    };
}
