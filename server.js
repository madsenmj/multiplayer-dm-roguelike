"use strict";

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var randomColor = require('randomcolor'); // import the script 
var gameserver = require('./js/gameserver');

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
function ROTObject(x, y, char, color){
        this._x = x;
        this._y = y;
        this._char = char;
        this._color = color;
}

ROTObject.prototype.move = function (dx, dy){
    this._x += dx;
    this._y += dy;
}

ROTObject.prototype.get_data = function(){
    return {x:this._x, y:this._y, ch:this._char, co:this._color}
}

/*

ROTMap Class

*/

function ROTMap(){
    this._tiles = new Object();
}

ROTMap.prototype.add_character = function(id, rotobject){
    this._tiles[id] = rotobject;
}

ROTMap.prototype.get_tiles = function(){
    var tilelist = [];
    for (var id in this._tiles){
        tilelist.push(this._tiles[id].get_data());
    }
    return tilelist
}

ROTMap.prototype.get_tile = function(id){
    return this._tiles[id]
}

ROTMap.prototype.remove_object = function(id){
    delete this._tiles[id];
}


/*

Handling Interactions

*/

var rotmap = new ROTMap();
io.on('connection',function(socket){

    socket.on('newplayer',function(playerInit){
        rotmap.add_character(
            socket.id,
            new ROTObject(
                randomInt(0, 80),
                randomInt(0, 23),
                "@",
                playerInit.color
            )
        );
    });


    socket.on('move',function(data){
        var tile = rotmap.get_tile(socket.id) || {};
        console.log(socket.id + ' move '+data.x+', '+data.y);
        tile.move(data.x, data.y);
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
    io.sockets.emit('state',rotmap.get_tiles());
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


