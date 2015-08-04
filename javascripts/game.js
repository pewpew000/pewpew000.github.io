//
// game.js
//

// Global variables for drawing
var moveLimitBy = 300;
var moveBy = 8;

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
	yApples: [],
	gApples: [],
	yBalls: [],
	gBalls: [],

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

	clearCharacter:function(img) {
		this.context.clearRect(img.x, img.y,
							   img.image.width,
							   img.image.height);
	},

	// TODO: Remove redundancy for two apple arrays
	getRandomAppleLocation:function() {
		var coord = [];
		var invalidCoord = false;
		var maxTry = 6;
		var numTry = 0;
		while(true) {
			numTry++;
			if(numTry === maxTry) {
				coord = [];
				break;
			}
			coord[0] = Math.max(0, Math.floor(Math.random() * this.canvaswidth) - this.images["yApple"].image.width);
			coord[1] = Math.max(0, Math.floor(Math.random() * this.canvasheight) - this.images["yApple"].image.height);
			var newapple = {
				x: coord[0],
				y: coord[1],
				image: this.images["yApple"].image // do this because apple sizes are the same
			}
			// check if it's overlapping with any character
			for (var k in this.images) {
				if (!(k === "main" || k === "bird" || k === "bee" || k === "cat")) {
					continue;
				}
				var kcharacter = {
					x: this.images[k].x,
					y: this.images[k].y,
					image: this.images[k].image
				};
				if (this.isOverlapping(newapple, kcharacter)) {
					invalidCoord = true;
					break;
				}
			}
			if(invalidCoord) {
				continue;
			}
			// check if it's overlapping with any other apples
			for (i=0; i < this.yApples.length; i+=2) {
				var kapple = {
					x: this.yApples[i],
					y: this.yApples[i+1],
					image: this.images["yApple"].image
				}
				if (this.isOverlapping(newapple, kapple)) {
					invalidCoord = true;
					break;
				}
			}
			if(invalidCoord) {
				continue;
			}
			for (i=0; i < this.gApples.length; i+=2) {
				var kapple = {
					x: this.gApples[i],
					y: this.gApples[i+1],
					image: this.images["gApple"].image
				}
				if (this.isOverlapping(newapple, kapple)) {
					invalidCoord = true;
					break;
				}
			}
			if(invalidCoord) {
				continue;
			}
			break; //found the new coord
		}
		console.log("coord: %d, %d", coord[0], coord[1]);
		return coord;
	},

	isCharacterAt:function(img, key) {
		switch(key) {
			case "yApple":
				for (i=0; i < this.yApples.length; i+=2) {
					if(img.x === this.yApples[i] && img.y === this.yApples[i+1]) {
						return [true, i];
					}
				}
			break;
			case "gApple":
				for (i=0; i < this.gApples.length; i+=2) {
					if(img.x === this.gApples[i] && img.y === this.gApples[i+1]) {
						return [true, i];
					}
				}
			break;
			default:
				console.log("unhandled key at isCharacterAt");
			break;
		}
		return [false];
	},

	//TODO: Remove redundancy btw drawRandomYellowApple & drawRandomGreenApple
	// if list can be passed/accessed by reference
	drawRandomYellowApple:function() {
		var coord = this.getRandomAppleLocation();
		if(coord.length > 0) {
			this.updateCharPosn("yApple", coord[0], coord[1]);
			this.drawCharacter("yApple");
			(this.yApples).push(coord[0]);
			(this.yApples).push(coord[1]);
			// no need if javascript pass arguments by value TODO: find out what js does
			var img = {
				x: coord[0],
				y: coord[1],
				image: this.images["yApple"].image
			}
			setTimeout(function() {
				var ret = gameui.isCharacterAt(img, "yApple");
				if(ret[0] == true) {
					gameui.clearCharacter(img);
					//remove apple positions from yApples
					gameui.yApples.splice(ret[1], 2);
				}
			}, 4000);
		}
	},

	drawRandomGreenApple:function() {
		var coord = this.getRandomAppleLocation();
		if(coord.length > 0) {
			this.updateCharPosn("gApple", coord[0], coord[1]);
			this.drawCharacter("gApple");
			(this.gApples).push(coord[0]);
			(this.gApples).push(coord[1]);
			var img = {
				x: coord[0],
				y: coord[1],
				image: this.images["gApple"].image
			}
			setTimeout(function() {
				var ret = gameui.isCharacterAt(img, "gApple");
				if(ret[0] == true) {
					gameui.clearCharacter(img);
					//remove apple positions from gApples
					gameui.gApples.splice(ret[1], 2);
				}
			}, 4000);
		}
	},

	isOverlapping:function(img1, img2) {
		var mx = img1.x;
		var mxw = mx + img1.image.width;
		var my = img1.y;
		var myh = my + img1.image.height;

		var kx = img2.x;
		var kxw = kx + img2.image.width;
		var ky = img2.y;
		var kyh = ky + img2.image.height;

		//console.log("mx: %d, mxw: %d, my: %d, myh: %d", mx, mxw, my, myh);
		//console.log("kx: %d, kxw: %d, ky: %d, kyh: %d", kx, kxw, ky, kyh);

		if (!(kxw < mx || kx > mxw) &&
			!(kyh < my || ky > myh))  {
			return true;
		}
		return false;
	},

	canMove:function(key, x, y) {
		var mcharacter = {
			x: x,
			y: y,
			image: this.images[key].image
		};

		// check if any character is in the way
		for (var k in this.images) {
			if (k === key || !(k === "main" || k === "bird" || k === "bee" || k === "cat")) {
				continue;
			}
			
			if (x < this.images[key].min_x || x > this.images[key].max_x) {
				return false;
			}

			var kcharacter = {
				x: this.images[k].x,
				y: this.images[k].y,
				image: this.images[k].image
			};

			if(this.isOverlapping(mcharacter, kcharacter)) {
				return false;
			 }
		}
		return true;
	},

	moveCharacter:function(key, direction) {
		
		switch(direction) {
			case 38: //up
				var new_y = Math.max(this.images[key].y - moveBy, 0);
				if(this.canMove(key, this.images[key].x, new_y)) {
					this.clearCharacter(this.images[key]);
					this.updateCharPosn(key, this.images[key].x, new_y);
			   		this.drawCharacter(key);
			   	}
			break;
			case 39: //right
			   	var new_x = Math.min(this.images[key].x + moveBy, this.canvaswidth - this.images[key].image.width);
			   	if(this.canMove(key, new_x, this.images[key].y)) {
			   		this.clearCharacter(this.images[key]);
					this.updateCharPosn(key, new_x, this.images[key].y);
			   		this.drawCharacter(key);
			   	}
			break;
			case 40: //down
				var new_y = Math.min(this.images[key].y + moveBy, this.canvasheight - this.images[key].image.height);
				if(this.canMove(key, this.images[key].x, new_y)) {
					this.clearCharacter(this.images[key]);
					this.updateCharPosn(key, this.images[key].x, new_y);
			   		this.drawCharacter(key);
			   	}
			break;
			case 37: //left
				var new_x = Math.max(this.images[key].x - moveBy, 0);
				if(this.canMove(key, new_x, this.images[key].y)) {
					this.clearCharacter(this.images[key]);
					this.updateCharPosn(key, new_x, this.images[key].y);
			   		this.drawCharacter(key);
			   	}
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
	gameui.drawRandomYellowApple();
	gameui.drawRandomGreenApple();
	gameui.drawRandomYellowApple();
	gameui.drawRandomGreenApple();
	gameui.drawRandomYellowApple();
	gameui.drawRandomGreenApple();
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

