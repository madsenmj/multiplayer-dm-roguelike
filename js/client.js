var socket = io();

var options = {
  width: ROT.DEFAULT_WIDTH,
  height: ROT.DEFAULT_HEIGHT,
  fontSize: 18,
  forceSquareRatio:true
}
var display = new ROT.Display(options);

var display = new ROT.Display();
document.getElementById("game").appendChild(display.getContainer());

function printTile(tile){
    display.draw(tile.x, tile.y, tile.ch, tile.co);
}

socket.on('state', function(tiles){
    display.clear();
    console.log(tiles);
    for (var id in tiles){
        var tile = tiles[id];
        printTile(tile);
    }
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
        return function () { socket.emit("move", dirToVector[key]); }
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

socket.emit('newplayer');

socket.on('message', function(data) {
  console.log(data);
});