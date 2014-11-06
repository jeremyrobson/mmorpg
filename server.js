var pathtable = [[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1]];

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
};

function create_unit(ai, NAME, color, map, x, y) {
    var index = -1;
    var id = randint(10000, 1000000);
    var NAME = NAME || "NPC";
    var mapx = x || randint(0, map.width);
    var mapy = y || randint(0, map.height);
    var color = color || "rgb(255,0,0)";
    var hp = 100;
    var agl = randint(3,20);
    var at = 0;  //todo: change at to tickcount, less calculations
    var target = null;
    
    function move(dx, dy) {
        var x = wrap(mapx + dx, map.width);
        var y = wrap(mapy + dy, map.height);
        
        if (map.blocked(x, y))
            console.log("error", x, y, dx, dy);
            
        mapx = x;
        mapy = y;
    }
    
    function turn(units, map) {
        at += agl;
        if (at >= 500) {
            if (ai == "hostile")
                npc_turn(units);
            else
                if (target) invoke_action();
            at = 0;
        }
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
    
    function invoke_action() {
        var action = {
            "actor": index,
            "target": target.get_index(),
            "x1": mapx,
            "y1": mapy,
            "x2": target.get_x(),
            "y2": target.get_y(),
            "type": "attack"
        };
    }
    
    return {
        get_index: function() { return index; },
        set_index: function(i) { index = i; map.add(index); },
        get_ai: function() { return ai; },
        color: color,
        get_target: function() { return target; },
        set_target: function(u) { target = u; console.log(target); },
        get_position: function() { return [mapx, mapy]; },
        get_x: function() { return mapx; },
        get_y: function() { return mapy; },
        set_x: function(x) { mapx = x; },
        set_y: function(y) { mapy = y; },
        get_unit_data: function() { return get_unit_data(index); },
        move: move,
        turn: turn,
        to_json: function() { return {"index":index,"NAME":NAME,"color":color,"x":mapx,"y":mapy}; },
        to_string: function() { return to_string(this); }
    };
}

function create_user(client, map) {
    var username = "jeremy";
    var unit = create_unit("user", "User1", "rgb(0,255,255)", map, 1, 1);
    
    var send_message = function(type, data) {
        client.send({"type":type, "data":data}); //use JSON.stringify(data)
    };
    
    var invoke_action = function(targetindex) {
        send_message("action", targetindex);
    };
    
    var update_units = function(units) {
        var unitlist = map.get_units(unit.get_index());
        var data = unitlist.map(function(index) { return units[index].to_json(); });
        send_message("unitupdate", data);
        var target = unit.get_target();
        if (target) send_message("target", target.get_index());
    };
    
    var move = function(direction) {
        var vector = get_vector(map, unit.get_x(), unit.get_y(), direction);
        unit.move(vector[0], vector[1]);
    };
    
    return {
        client: client,
        send_message: send_message,
        set_target: function(u) { unit.set_target(u); },
        update_units: update_units,
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
    var user;

    var add = function(unit) {
        unit.set_index(units.push(unit) - 1);
    };
    
    var loop = function() {
        if (user) {
            user.send_message("move", user.get_unit().get_position());
            user.update_units(units);
        }
        
        units.forEach(function(u) {
            u.turn(units, map);
        });
    };
    
    var on_message = function(message) { //todo: arg also contains which user
        if (message.type == "connect") {
            user = create_user(message.data, map);
            add(user.get_unit());
            user.send_message("sysmessage", "connection successful!");
        }
    
        if (message.type == "move") {
            user.move(message.data);
        }
        
        if (message.type == "target") {
            user.set_target(units[message.data]);
        }
    };
    
    /*
    for (var i=0;i<200;i++) {
        var npc = create_unit("hostile", "NPC", "rgb(255,0,0)", map, randint(0,256), randint(0,256));
        add(npc);
    }
    */
    
    var npc = create_unit("hostile", "NPC", "rgb(255,0,0)", map, 5, 5);
    add(npc);
    
    return {
        loop: loop,
        map: map,
        send: on_message
    };
}
