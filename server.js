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
    
    for (var i=0;i<200;i++) {
        var npc = create_npc("hostile");
        var qx = npc.get_quad_x();
        var qy = npc.get_quad_y();   
        quad[qx][qy].push(npc);
    }
    
    var get_chars = function(x, y) { //todo: get surrounding 8 quads as well
        var qx = Math.floor(x / QUAD_SIZE);
        var qy = Math.floor(y / QUAD_SIZE);
        //todo: don't return self in char list
        console.log(quad[qx][qy]);
        return quad[qx][qy];
    };
    
    return {
        width: width,
        height: height,
        tile: tile,
        quad: quad,
        get_chars: get_chars
    };
}

function create_npc(ai, x, y) {
    var mapx = x || randint(0,256);
    var mapy = y || randint(0,256);
    var color = "rgb(255,0,0)";
    var hp = 100;
    
    return {
        ai: ai,
        color: color,
        x: mapx,
        y: mapy,
        get_quad_x: function() { return Math.floor(mapx / QUAD_SIZE); },
        get_quad_y: function() { return Math.floor(mapy / QUAD_SIZE); }
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
        
        if (newquadx != quadx || newquady != newquady) {
            quadx = newquadx;
            quady = newquady;
            send_message("charupdate", map.get_chars(mapx, mapy));
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
    var map = create_map(256, 256);
    var user;
    
    var loop = function() {
        if (user)
            user.send_message("move", [user.get_x(), user.get_y()]);
    };
    
    var on_message = function(message) { //todo: arg also contains user
        if (message.type == "connect") {
            user = create_user(message.data);
            user.send_message("sysmessage", "connection successful!");
            user.send_message("charupdate", map.get_chars(user.get_x(), user.get_y()));
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
