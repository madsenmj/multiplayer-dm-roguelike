
var Game = {
    display: null,
    map:{},
    freeCells:[],
    playerMap:{},
    init: function() {
        this.display = new ROT.Display();
        document.getElementById("game").appendChild(this.display.getContainer());

        this._generateMap();
        Client.askNewPlayer();
    }
}

Game._generateMap = function() {
    /*
    var digger = new ROT.Map.Digger();
    var digCallback = function(x, y, value) {
        if (value) { return; } //do not store walls
 
        var key = x+","+y;
        this.freeCells.push(key);
        this.map[key] = ".";
    }
    digger.create(digCallback.bind(this));
    */
    for(var ix=0; ix<ROT.DEFAULT_WIDTH; ++ix) {
        for(var iy=0; iy<ROT.DEFAULT_HEIGHT; ++iy) {
            var key = ix+","+iy;
            this.map[key] = ".";
        }
    }


    this._drawWholeMap();
}

Game._drawWholeMap = function() {
    for (var key in this.map) {
        var parts = key.split(",");
        var x = parseInt(parts[0]);
        var y = parseInt(parts[1]);
        this.display.draw(x, y, this.map[key]);
    }
}

Game.init();

Game.addNewPlayer = function(id,x,y,color){
    this.playerMap[id] = new Player(x, y,color);

};

var Player = function(x, y,color) {
    this._x = x;
    this._y = y;
    this._color = color;
    this._draw();
};

Player.destroy = function(){
    Game.display.draw(this._x, this._y, "X", "#ff0000");
};
 
Player.prototype._draw = function() {
    console.log('Drawing Player')
    Game.display.draw(this._x, this._y, "@", this._color);
};


Game.movePlayer = function(id,newX,newY){
    var player = Game.playerMap[id];
    console.log('Trying to move to ' +newX+', '+newY)
    var newKey = newX + "," + newY;
    if (!(newKey in this.map)) { console.log("can't move here"); return; } /* cannot move in this direction */
    
    console.log('Redrawing Map')
    this.display.draw(player._x, player._y, this.map[player._x+","+player._y]);
    
    player._x = newX;
    player._y = newY;
    player._draw();
};


Game.removePlayer = function(id){
    Game.playerMap[id].destroy();
    delete Game.playerMap[id];
};

