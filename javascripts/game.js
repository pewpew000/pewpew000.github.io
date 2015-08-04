//
// game.js
//

// Global variables for drawing
var moveLimitBy = 300;
var moveBy = 5;

var imageLoader = {
	loaded:true,
    loadedImages:0,
    totalImages:0,

    load:function(url, key){
    	this.loaded = false;
    	var image = new Image();
    	image.src = url;
    	this.totalImages++;

    	image.onload = function() {
    		var character = {
    			x: 0,
    			y: 0,
    			min_x: 0,
    			max_x: 0,
    			image: image
    		}
    		//gameui.images.push(character);
    		//gameui.images[idx] = character;
    		gameui.images[key] = character;

    		imageLoader.loadedImages++;
    		if(imageLoader.loadedImages === imageLoader.totalImages) {
    			imageLoader.loaded = true;
    			setTimeout(function() { $('#startscreen').hide();
										$('#tutorial').show(); }, 700);
    			$('#startgame2').click(function(){
					$('#tutorial').hide();
					playGame();
				});
    		}
    	}
    }
}


var gameui = {
	context:0,
	canvas:0,
	canvaswidth:0,
	canvasheight:0,
	images: {},

	init:function() {
		$("body").css("overflow", "hidden"); //disable scroll bar action
		this.canvas = document.getElementById("gamecanvas");
		this.context = this.canvas.getContext("2d");
		this.canvaswidth = this.canvas.getAttribute("width");
		this.canvasheight = this.canvas.getAttribute("height");

		var imagesSrcs = [ "images/elephant.png", "main",
					   	   "images/pinkbird.png", "bird",
					   	   "images/cat.png", "cat",
					   	   "images/bee.png", "bee",
					   	   "images/yellowball.png", "yBall",
					   	   "images/greenball.png", "gBall",
					   	   "images/yellowapple.png", "yApple",
					   	   "images/greenapple.png", "gApple",
					   	   "images/explosion.png", "explosion" ];

		for(i=0; i < imagesSrcs.length; i++) {
			imageLoader.load(imagesSrcs[i], imagesSrcs[i+1]);
			i++;
		}
	},

	drawCharacter:function(key) {
		this.context.drawImage(this.images[key].image, this.images[key].x, this.images[key].y);
	},

	updateCharPosn:function(key, x, y) {
		this.images[key].x = x;
		this.images[key].y = y;
	},

	updatePosnLimit:function(key, min_x, max_x) {
		this.images[key].min_x = min_x;
		this.images[key].max_x = max_x;
	},

	clearCharacter:function(key) {
		this.context.clearRect(this.images[key].x, this.images[key].y,
							   this.images[key].image.width,
							   this.images[key].image.height);
	},

	moveCharacter:function(key, direction) {
		this.clearCharacter(key);
		switch(direction) {
			case 38: //up
				var new_y = Math.max(this.images[key].y - moveBy, 0);
				this.updateCharPosn(key, this.images[key].x, new_y);
			   	this.drawCharacter(key);
			break;
			case 39: //right
			   	var new_x = Math.min(this.images[key].x + moveBy, this.canvaswidth - this.images[key].image.width);
				this.updateCharPosn(key, new_x, this.images[key].y);
			   	this.drawCharacter(key);
			break;
			case 40: //down
				var new_y = Math.min(this.images[key].y + moveBy, this.canvasheight - this.images[key].image.height);
				this.updateCharPosn(key, this.images[key].x, new_y);
			   	this.drawCharacter(key);
			break;
			case 37: //left
				var new_x = Math.max(this.images[key].x - moveBy, 0);
				this.updateCharPosn(key, new_x, this.images[key].y);
			   	this.drawCharacter(key);
			break;
			default:
			break;
		}
	}
}

var keyHandler = {
	keydown: 0,
	keyup: 0,

	init:function() {
		$('html').keydown(function(e){
		    switch(e.which) {
			    case 38: //up
			    case 39: //right
			    case 40: //down
			    case 37: //left
			    	gameui.moveCharacter("main", e.which);
			    break;
			    case 71: //G
			    break;
			    case 89: //Y
			    break;
			    default:
			    break;
			}
		});
	},
}

function playGame() {

	// === init character positions === //

	var offset = 50;
	gameui.updateCharPosn("main", offset, offset);
	gameui.updatePosnLimit("main", 0, moveLimitBy);
	gameui.drawCharacter("main");

	// bird is on the opposite side of main
	var xmax = gameui.canvaswidth - gameui.images["bird"].image.width;
	var ymax = gameui.canvasheight - gameui.images["bird"].image.height;
	gameui.updateCharPosn("bird", xmax - offset, offset);
	gameui.updatePosnLimit("bird", xmax - moveLimitBy, xmax);
	gameui.drawCharacter("bird");

	ymax = gameui.canvasheight - gameui.images["cat"].image.height;
	gameui.updateCharPosn("cat", offset, ymax - offset);
	gameui.updatePosnLimit("cat", 0, moveLimitBy);
	gameui.drawCharacter("cat");

	// bee is one the opposite side of main
	xmax = gameui.canvaswidth - gameui.images["bee"].image.width;
	ymax = gameui.canvasheight - gameui.images["bee"].image.height;
	gameui.updateCharPosn("bee", xmax - offset, ymax - offset);
	gameui.updatePosnLimit("bee", xmax - moveLimitBy, xmax);
	gameui.drawCharacter("bee");

	// === Real game logic starts === //
	keyHandler.init();
}

var startscreen= {
	init: function(){
		$('.gamelayer').hide();
		$('#titlescreen').show();
		$('#loading').hide();
		$('#startgame').hide();
		$('#tutorial').hide();
		setTimeout(function() { $('#startgame').show() }, 700);

		$('#startgame').click(function(){
			$('#startgame').hide();
			$('#loading').show();
			gameui.init();
		});

		$(function () {
		   function runIt() {
		      $('#birdfront').animate({top: '+=20'},{duration: 250})
		               .animate({top: '-=20'},{duration: 150})
		               .animate({top: '+=20'},{duration: 250})
		               .animate({top: '-=20'},{duration: 150})
		               .delay(1000).show("#birdfront", runIt);
		   }

		   runIt();
		});
	}
}

var settings = {
	isSoundOn:true,

	init: function() {
		sound = new Audio();
		sound.src = "sound/background.mp3"
		sound.loop = true;
		sound.play();
		isSoundOn = true;

		// set the sound button click event
		$('#sound').click(function(){
			if(isSoundOn == true) {
				sound.pause();
				isSoundOn = false;
				$("#sound").attr("src", "images/soundoff.png");
			} else {
				sound.play();
				isSoundOn = true;
				$("#sound").attr("src", "images/soundon.png");
			}
		});
	}
}


// ============================================ init function ============================== // 
function initgame(){
	startscreen.init();
	settings.init();
}

