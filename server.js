var pathtable = [[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1]];

function wrap(num, max) {
    if (num < 0) return max + num;
    if (num >= max) return num - max;
    return num;
}

function unwrap(num1, num2, max) {
    if (Math.abs(num2 - num1) > max / 2) {
        if (num1 > num2) return num1 - max;
        else return num1 + max;
    }
    return num1;
}

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

//try moving in three directions according to pinwheel navigation
var get_vector = function(map, x, y, direction) {
    var v = pathtable[direction];
    var m = {"x":wrap(x+v[0],map.width),"y":wrap(y+v[1],map.height)};
    
    var r = Math.random() < 0.5 ? -1 : 1; //random sign to prevent getting stuck
    var rd = [r,-r];
    
    if (map.blocked(m.x,m.y)) {
        v = pathtable[(direction+rd[0])&7];
        m = {"x":wrap(x+v[0],map.width),"y":wrap(y+v[1],map.height)};
    }
    
    if (map.blocked(m.x,m.y)) {
        v = pathtable[(direction+rd[1])&7];
        m = {"x":wrap(x+v[0],map.width),"y":wrap(y+v[1],map.height)};
    }
    
    if (map.blocked(m.x,m.y)) v = [0,0];
    return v;
};

function create_map(width, height) {
    var id = randint(1000,100000);
    var unitindices = [];
    var tile = [];
    for (var x=0;x<width;x++) {
        tile[x] = [];
        for (var y=0;y<height;y++) {
            tile[x][y] = pick_random([tiletemplates[0],tiletemplates[1], tiletemplates[1]]);
        }
    }

    /*
    for (var i=0;i<3;i++) {
        var randx = randint(0, width);
        var randy = randint(0, height);
        tile[randx][randy].door = {"submap": create_map(randint(64, 256), randint(64, 256)) };
    }
    */
    
    var add = function(index) {
        unitindices.push(index);
    };
    
    var remove = function(index) {
        unitindices = unitindices.filter(function(i) { return i != index; });
    };
    
    var get_units = function(exclude) {
        return unitindices.filter(function(index) {
            return index != exclude;
        });
    };
    
    return {
        add: add,
        remove: remove,
        width: width,
        height: height,
        tile: tile,
        blocked: function(x, y) { return tile[x][y].blocked; },
        get_units: get_units,
        get_id: function() { return id; }
    };
}

function to_string(u) {
    return u.NAME + ": " + u.get_x + ", " + u.get_y;
}

function create_unit(ai, name, color, map, x, y) {
    var index = -1;
    var id = randint(10000, 1000000);
    var NAME = name || "NPC";
    var mapx = x || randint(0, map.width);
    var mapy = y || randint(0, map.height);
    var color = color || "rgb(255,0,0)";
    var hp = 100;
    var agl = randint(3,10);
    var at = 0;  //todo: change at to tickcount, less calculations
    var target = null;
    var targetindex = -1;
    var actionqueue = [];
    
    function loop(units, user) {
        if (targetindex > -1) {
            target = units[targetindex];
        }
        
        at += agl;
        if (at >= 500)
            turn(units, user);
    }

    function turn(units, user) {
        var action = (user) ? get_action() : npc_turn(units);
        if (action) actionqueue.push(action);
        at = 0;
    }
    
    function move(dx, dy) {
        var x = wrap(mapx + dx, map.width);
        var y = wrap(mapy + dy, map.height);
        
        if (map.blocked(x, y))
            console.log("error", x, y, dx, dy);
            
        mapx = x;
        mapy = y;
    }
    
    function npc_turn(units) {
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
            var angle = Math.atan2(mapy - targety, mapx - targetx);
            var direction = (Math.floor((angle*4+Math.PI/2)/Math.PI))&7;  //pinwheel navigation
            if ((Math.abs(targetx - mapx) > map.width / 2) || (Math.abs(targety - mapy) > map.height / 2))
                direction = (direction + 4) & 7; //reverse direction accross wrap
            var vector = get_vector(map, mapx, mapy, direction);
            xmove = vector[0];
            ymove = vector[1];
        }
        
        move(xmove, ymove);
    }
    
    function get_action() {
        if (target) {
            return {
                "actor": index,
                "target": target.get_index(),
                "x1": mapx,
                "y1": mapy,
                "x2": target.get_x(),
                "y2": target.get_y(),
                "type": "attack"
            };
        }
    }

    function get_unit_data(units) {
        var unitlist = map.get_units(index);
        var data = unitlist.map(function(index) { return units[index].to_json(); });
        return data;
    }
    
    return {
        get_index: function() { return index; },
        set_index: function(i) { index = i; map.add(index); },
        get_ai: function() { return ai; },
        color: color,
        get_target: function() { return target; },
        set_target: function(i) { targetindex = i; },
        get_position: function() { return [mapx, mapy]; },
        get_x: function() { return mapx; },
        get_y: function() { return mapy; },
        set_x: function(x) { mapx = x; },
        set_y: function(y) { mapy = y; },
        get_unit_data: get_unit_data,
        loop: loop,
        move: move,
        turn: turn,
        to_json: function() { return {"index":index,"NAME":NAME,"color":color,"x":mapx,"y":mapy}; },
        to_string: function() { return to_string(this); },
        push_action: function(fn) { if (actionqueue.length > 0) fn("action", actionqueue.shift(0)); }
    };
}

function create_user(client, map) {
    var username = "jeremy";
    var unit = create_unit("user", "User1", "rgb(0,255,255)", map, 1, 1);
    
    var send_message = function(type, data) {
        client.send({"type":type, "data":data}); //use JSON.stringify(data)
    };
    
    var on_message = function(message) {
        if (message.type == "move") {
            move(message.data);
        }
        
        if (message.type == "target") {
            unit.set_target(message.data);
        }
    };
    
    var loop = function(units, user) {
        send_message("move", unit.get_position());
        unit.loop(units, user);
        unit.push_action(send_message);
        var data = unit.get_unit_data(units);
        send_message("unitupdate", data);
        if (unit.get_target()) send_message("target", unit.get_target().to_json());
    };
    
    var move = function(direction) {
        var vector = get_vector(map, unit.get_x(), unit.get_y(), direction);
        unit.move(vector[0], vector[1]);
    };
    
    send_message("sysmessage", "connection successful!");
    
    return {
        client: client,
        send_message: send_message,
        on_message: on_message,
        loop: loop,
        to_string: function() { return to_string(this); },
        get_unit: function() { return unit; },
        set_map: function(newmap) { map = newmap; },
        get_map: function() { return map; },
        get_units: function() { return map.get_units(this); },
        move: move
    };
}

function create_server(client) {
    var map = create_map(256, 256);
    var units = [];
    var npcs = [];
    var user;

    var add = function(unit, type) {
        unit.set_index(units.push(unit) - 1);
        if (type == "npc") npcs.push(unit);
    };
    
    var loop = function() {
        if (user)
            user.loop(units, user);
        
        npcs.forEach(function(u) {
            u.loop(units, null);
        });
    };
    
    var on_message = function(message) {
        if (message.type == "connect") {
            user = create_user(message.data, map);
            add(user.get_unit(), "user");
        }
        else
            user.on_message(message);
    };
    
    /*
    for (var i=0;i<200;i++) {
        var npc = create_unit("hostile", "NPC", "rgb(255,0,0)", map, randint(0,256), randint(0,256));
        add(npc);
    }
    */
    
    var npc = create_unit("hostile", "NPC", "rgb(255,0,0)", map, 5, 5);
    add(npc, "npc");
    
    return {
        loop: loop,
        map: map,
        send: on_message
    };
}
