var Client = {};
Client.socket = io.connect();

Client.askNewPlayer = function(){
    Client.socket.emit('newplayer');
};

Client.socket.on('newplayer',function(data){
    Game.addNewPlayer(data.id,data.x,data.y);
});

Client.socket.on('allplayers',function(data){
    console.log(data);
    for(var i = 0; i < data.length; i++){
        Game.addNewPlayer(data[i].id,data[i].x,data[i].y);
    }
});

Client.socket.on('move',function(data){
    Game.movePlayer(data.id,data.x,data.y);
});

Client.socket.on('remove',function(id){
    Game.removePlayer(id);
});


// Handling Keyboard Inputs

var dirToVector = {};
dirToVector[ROT.VK_NUMPAD4] = { x:-1, y:0};
dirToVector[ROT.VK_NUMPAD6] = { x:1, y:0};
dirToVector[ROT.VK_NUMPAD8] = { x:0, y:-1};
dirToVector[ROT.VK_NUMPAD2] = { x:0, y:1};
dirToVector[ROT.VK_NUMPAD7] = { x:-1, y:-1};
dirToVector[ROT.VK_NUMPAD9] = { x:1, y:-1};
dirToVector[ROT.VK_NUMPAD1] = { x:-1, y:1};
dirToVector[ROT.VK_NUMPAD3] = { x:1, y:1};

// Concise list of commands
var interpreters = {}
for (moveKey in dirToVector) {
    interpreters[moveKey] = (function (key) {
        return function () { Client.socket.emit("move", dirToVector[key]); }
      })(moveKey);
  };

// Default key interpreting function
var defaultInterpreter = function (key) {
    if (key in interpreters) {
      interpreters[key]();
    }
  };
  
// Currently active callback
var interpCallback = defaultInterpreter;
  


window.addEventListener("keydown", function (e) {
    var code = e.keyCode;
    interpCallback(code);
  });
