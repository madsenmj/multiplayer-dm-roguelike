var socket = io();




var beginGame = function(){

  var options = {
    width: ROT.DEFAULT_WIDTH,
    height: ROT.DEFAULT_HEIGHT,
    fontSize: 18,
    forceSquareRatio:true
  }
  var display = new ROT.Display(options);

  var display = new ROT.Display();
  document.getElementById("inputs").style.display = "none";
  document.getElementById("game").appendChild(display.getContainer());
  
  var playerInit = {color:document.getElementById("selectedhexagon").style.backgroundColor};

  socket.emit('newplayer', playerInit);


  function printTile(tile){
    display.draw(tile.x, tile.y, tile.ch, tile.co);
  }

  socket.on('state', function(tiles){
      display.clear();
      //console.log(tiles);
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

  dirToVector[ROT.VK_UP] = { x:0, y:-1};
  dirToVector[ROT.VK_DOWN] = { x:0, y:1};
  dirToVector[ROT.VK_LEFT] = { x:-1, y:0};
  dirToVector[ROT.VK_RIGHT] = { x:1, y:0};


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

  /*

  Handling Swipes on Touch Devices

  */

  var el = document.getElementById('game')
  swipedetect(el, function(swipedir){
      //swipedir contains either a ROT key or 'none'
      if (swipedir != 'none'){
        socket.emit("move", dirToVector[swipedir]);
      }

  })

  function swipedetect(el, callback){
    
    var touchsurface = el,
    swipedir,
    startX,
    startY,
    distX,
    distY,
    threshold = 50, //required min distance traveled to be considered swipe
    restraint = 10, // maximum distance allowed at the same time in perpendicular direction
    allowedTime = 300, // maximum time allowed to travel that distance
    elapsedTime,
    startTime,
    handleswipe = callback || function(swipedir){}

    touchsurface.addEventListener('touchstart', function(e){
        var touchobj = e.changedTouches[0];
        swipedir = 'none';
        dist = 0;
        startX = touchobj.pageX;
        startY = touchobj.pageY;
        startTime = new Date().getTime(); // record time when finger first makes contact with surface
        e.preventDefault();
    }, false);

    touchsurface.addEventListener('touchmove', function(e){
        e.preventDefault(); // prevent scrolling when inside DIV
    }, false);

    touchsurface.addEventListener('touchend', function(e){
        var touchobj = e.changedTouches[0];
        distX = touchobj.pageX - startX; // get horizontal dist traveled by finger while in contact with surface
        distY = touchobj.pageY - startY; // get vertical dist traveled by finger while in contact with surface
        elapsedTime = new Date().getTime() - startTime; // get time elapsed
        if (elapsedTime <= allowedTime){ // first condition for awipe met
            if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint){ // 2nd condition for horizontal swipe met
                swipedir = (distX < 0)? ROT.VK_NUMPAD4 : ROT.VK_NUMPAD6; // if dist traveled is negative, it indicates left swipe
            }
            else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint){ // 2nd condition for vertical swipe met
                swipedir = (distY < 0)? ROT.VK_NUMPAD8 : ROT.VK_NUMPAD2; // if dist traveled is negative, it indicates up swipe
            }
            else if (Math.abs(distY) >= 0.71*threshold && Math.abs(distX) >= 0.71*threshold){ //Diagonal
              if (distY < 0){
                swipedir = (distX < 0)? ROT.VK_NUMPAD7:ROT.VK_NUMPAD9;
              } 
              else if (distY > 0){
                swipedir = (distX < 0)? ROT.VK_NUMPAD1:ROT.VK_NUMPAD3;
              } 
              
            }
            //console.log(distY + ',' + distX);
          }
        handleswipe(swipedir);
        e.preventDefault();
    }, false)
  }


  // Working with virtual numpad
  document.getElementById("num1").addEventListener("click", function(){
    interpCallback(ROT.VK_NUMPAD1);
  });
  document.getElementById("num2").addEventListener("click", function(){
    interpCallback(ROT.VK_NUMPAD2);
  });
  document.getElementById("num3").addEventListener("click", function(){
    interpCallback(ROT.VK_NUMPAD3);
  });
  document.getElementById("num4").addEventListener("click", function(){
    interpCallback(ROT.VK_NUMPAD4);
  });
  document.getElementById("num6").addEventListener("click", function(){
    interpCallback(ROT.VK_NUMPAD6);
  });
  document.getElementById("num7").addEventListener("click", function(){
    interpCallback(ROT.VK_NUMPAD7);
  });
  document.getElementById("num8").addEventListener("click", function(){
    interpCallback(ROT.VK_NUMPAD8);
  });
  document.getElementById("num9").addEventListener("click", function(){
    interpCallback(ROT.VK_NUMPAD9);
  });



};

// Handling chat messages
$(function () {
  var socket = io();
  $('form').submit(function(){
    socket.emit('chat message', $('#m').val());
    $('#m').val('');
    return false;
  });
  socket.on('chat message', function(msg){
    $('#messages').append($('<li>').text(msg));
  });
});



