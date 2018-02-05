"use strict";

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var randomColor = require('randomcolor'); // import the script 
var ROT = require("rot-js");


var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    var port = parseInt(val, 10);
  
    if (isNaN(port)) {
      // named pipe
      return val;
    }
  
    if (port >= 0) {
      // port number
      return port;
    }
  
    return false;
  }


app.use('/js',express.static(__dirname + '/js'));
app.use('/public',express.static(__dirname + '/public'));

app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html');
});

server.listen(port,function(){ 
    console.log('Listening on '+server.address().port);
});

/*

ROTObject Class

*/
function ROTObject(x, y, char, fc, bg='#000000', bm=false, bl=false, rm=true){
    // fc = foreground color
    // bg = background color
    // bm = block movement
    // bl = block light
    // rm = rememberable

        this._x = x;
        this._y = y;
        this._character = char;
        this._foregroundColor = fc;
        this._backgroundColor = bg;
        this._blocksMovement = bm;
        this._blocksLight = bl;
        this._rememberable = rm;

        this._class = 'object';
}

ROTObject.prototype.get_data = function(){
    return {
        x:this._x, 
        y:this._y, 
        ch:this._character, 
        fc:this._foregroundColor, 
        bg:this._backgroundColor,
        bl:this._blocksLight,
        rm:this._rememberable
    }
}

ROTObject.prototype.blocked = function(){
    return this._blocksMovement
}

ROTObject.prototype.mapkey = function(){
    return this._x + "," + this._y
}

ROTObject.prototype.getClass = function(){
    return this._class
}

ROTObject.prototype.potentialMoveKey = function (move_diff){
    return (this._x + move_diff.x) + "," + (this._y + move_diff.y)
}

/*

ROTTile Class

*/

function ROTTile(x, y, char, fc, bc, bm, bl, rm=true){
    ROTObject.call(this,x, y, char, fc, bc, bm, bl, rm);
    this._class = 'tile';
}
ROTTile.prototype = Object.create(ROTObject.prototype); 


/*

ROTMobs Class

*/

function ROTMob(x, y, char, fc, bc, bm=true, bl=false, rm=false){
    ROTObject.call(this,x, y, char, fc, bc, bm, bl, rm);
    this._class = 'mob';
}
ROTMob.prototype = Object.create(ROTObject.prototype); 

ROTMob.prototype.move = function (move_diff){
    this._x += move_diff.x;
    this._y += move_diff.y;
}

/*

ROTMap Class

*/

function ROTMap(bg="#000000"){
    this._mapXdim = 80;
    this._mapYdim = 23;

    this._bg = bg;
    this._objects = new Object();
    this._map = new Object();   // A lookup mapping for all objects
                                // the key is x+","+y for any object
                                // Contains an object of potentially four objects:
                                // tile: a ROTTile
                                // item: a ROTItem
                                // mob: a ROTMob


    this._generate_map();
    this._add_walls();
}

ROTMap.prototype._generate_map = function(){
    var digger = new ROT.Map.Digger();    
    var digCallback = function(x, y, value) {
        if (value) { return; }
        
        var key = x + "," + y;
        //console.log("adding . at " + key);
        this.add_object(
            'tile' + key,
            new ROTTile(
                x,
                y,
                '.',
                "#ffffff",
                this._bg,
                false,
                false,
                true
            )
        );
    }
    digger.create(digCallback.bind(this));
}

ROTMap.prototype._add_walls = function(){
    for (var key in this._map){
        if ('tile' in this._map[key]){
            var base_tile = this._map[key].tile;
            //console.log('Adding around ' + base_tile.get_data());
            // Add walls around it in empty spaces
            for (var dx=-1; dx < 2; dx++){
                for (var dy=-1; dy<2; dy++){
                    var delta_pos = {x: dx, y:dy};
                    var newkey = base_tile.potentialMoveKey(delta_pos);
                    if (!(newkey in this._map)){
                        var base_data = base_tile.get_data();
                        //console.log("adding # at " + newkey);
                        this.add_object(
                            'tile' + newkey,
                            new ROTTile(
                                base_data.x + dx,
                                base_data.y + dy,
                                '#',
                                "#ffffff",
                                this._bg,
                                true,
                                true,
                                true
                            )
                        );
                    }
                }
            }
        }
    }
}

ROTMap.prototype.add_object = function(id, rotobject){
    this._objects[id] = rotobject;
    this.add_object_to_map(rotobject);
}

ROTMap.prototype.get_object = function(id){
    return this._objects[id];
}



ROTMap.prototype.remove_object = function(id){
    try {
        var object_to_delete = this._objects[id];
        this.remove_object_from_map(object_to_delete);
        delete this._objects[id];
        return;
    }
    catch(err) {
        console.log("Couldn't delete " + id);
    }
}

ROTMap.prototype.remove_object_from_map = function(rotobject){
    var class_to_remove = rotobject.getClass();
    //console.log('Removing a ' + class_to_remove);
    try {
        delete this._map[rotobject.mapkey()][class_to_remove];
        if (isEmpty(this._map[rotobject.mapkey()])){
            delete this._map[rotobject.mapkey()];
        }
    } 
    catch(err) {
        console.log("Couldn't delete ");
        console.log(rotobject);
    }
}

ROTMap.prototype.add_object_to_map = function(rotobject){
    var class_to_add = rotobject.getClass();
    //console.log('Adding a ' + class_to_add);
    if (!(rotobject.mapkey() in this._map)){
        this._map[rotobject.mapkey()] = new Object();
    }
    this._map[rotobject.mapkey()][class_to_add] = rotobject;
}

ROTMap.prototype.is_blocked = function(position_key){
    var blocked_state = false;
    for (var key in this._map[position_key]){
        if (this._map[position_key][key].blocked()){
            blocked_state = true;
        }
    }
    return blocked_state
}


ROTMap.prototype.is_move_blocked = function(rotmob, move_diff){
    var new_position_key = rotmob.potentialMoveKey(move_diff);
    var blocked_state = false;
    if (new_position_key in this._map){
        //console.log(this._map[new_position_key]);
       blocked_state = this.is_blocked(new_position_key);
    }
    // TODO: keep from walking off map?

    return blocked_state
}

ROTMap.prototype.get_bg = function(){
    return this._bg;
}


ROTMap.prototype.get_draw_state = function(){

    // Get all map objects from the _map
    // Get all tiles
    // Then get all items (replacing any tile positions)
    // Then get all mobs (replacing any mob positions)

    var draw_list = [];

    for (var key in this._map){
        var keyobject = this._map[key];
        if ('mob' in keyobject){
            draw_list.push(keyobject.mob.get_data());
        }
        else if ('item' in keyobject){
            draw_list.push(keyobject.item.get_data());
        }
        else if ('tile' in keyobject){
            draw_list.push(keyobject.tile.get_data());
        }
        
    }
    //console.log(draw_list);
    return draw_list
}

/*

Handling Interactions

*/

var rotmap = new ROTMap();
io.on('connection',function(socket){

    socket.on('newplayer',function(playerInit){
        var launch_blocked = true;
        var launch_tile = new Object();
        while (launch_blocked){
            launch_tile = randomProperty(rotmap._map);
            console.log("Trying to place on " + launch_tile);
            launch_blocked = rotmap.is_blocked(launch_tile);
        }        
        var parts = launch_tile.split(",");
        var x = parseInt(parts[0]);
        var y = parseInt(parts[1]);
        rotmap.add_object(
            socket.id,
            new ROTMob(
                x,
                y,
                "@",
                playerInit.color,
                rotmap.get_bg()
            )
        );
    });


    socket.on('move',function(move_diff){
        var rotmob = rotmap.get_object(socket.id) || {};
        // TODO: Blocked state not working
        if (!rotmap.is_move_blocked(rotmob, move_diff)){
            console.log(socket.id + ' move '+move_diff.x+', '+move_diff.y);
            rotmap.remove_object_from_map(rotmob);
            rotmob.move(move_diff);
            rotmap.add_object_to_map(rotmob);
        }
    });

    socket.on('disconnect',function(){
        rotmap.remove_object(socket.id);
    });
    

    socket.on('chat message', function(msg){
        console.log('message: ' + msg);
        io.emit('chat message', msg);
      });

});

setInterval(function(){
    //console.log(rotmap._map);
    io.sockets.emit('state',rotmap.get_draw_state());
}, 1000/60);

function getAllPlayers(){
    var players = [];
    Object.keys(io.sockets.connected).forEach(function(socketID){
        var player = io.sockets.connected[socketID].player;
        if(player) players.push(player);
    });
    return players;
}

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

/**
 * 
 * Utility Functions
 * 
 */

function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }
    return JSON.stringify(obj) === JSON.stringify({});
}

function randomProperty(obj) {
    var keys = [];
    for (var prop in obj) {
        keys.push(prop);
    }
    return keys[keys.length * Math.random() << 0];
};