//
// game.js
//

// Global variables for settings
var moveLimitBy = 300;
var moveBy = 15;
var appleExpiryDuration = 40000; //for testing, it's very large
var moveBombBy = 10;
var bombDrawRate = 20;

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
    			image: image,
    			yBulletsNum: 3,
    			gBulletsNum: 2,
    			heartsNum: 5
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
					$('#gametop').show();
					playGame();
				});
    		}
    	}
    }
}

// this is called inside setInterval
// bomb element: x, y, dir, image
function drawBombs() {
	var i = gameui.bombList.length;
	console.log("drawBombs: %d", gameui.bombList.length);
	//go backward as we might remove the bullet
	while(i--) {
		var new_x = gameui.bombList[i].x;
		var new_y = gameui.bombList[i].y;
		var bulletRemoved = false;

		var img = {
			x: new_x,
			y: new_y,
			image: gameui.bombList[i].image
		};
		gameui.clearCharacter(img);

		switch(gameui.bombList[i].dir) {
			case 39: //right
			new_x += moveBombBy;
			break;
			case 37: //left
			new_x -= moveBombBy;
			break;
			case 38: //up
			new_y -= moveBombBy;
			break;
			case 40: //down
			new_y += moveBombBy;
			default:
			break;
		}

		img.x = new_x;
		img.y = new_y;

		gameui.context.drawImage(gameui.bombList[i].image, img.x, img.y);

		// check if the bomb is overlapping with any character
		for(k in gameui.images) {
			if(!gameui.isPlayer(k)) {
				continue;
			}
			if(gameui.isOverlapping(img, gameui.images[k])) {
				// kill the character
				console.log("whoa");
				// Clear and remove bullet
				gameui.clearCharacter(img);
			}
		}

		// if reached the end of canvas, clear it and remove from bombList
		if(gameui.reachedEnd(img)) {
			// TODO: if there's any item (e.g. apple) you need to redraw

			// clear the bullet and remove from bombList
			gameui.clearCharacter(img);
			gameui.bombList.splice(i,1);
			bulletRemoved = true;
		}

		if(!bulletRemoved) {
			gameui.bombList[i].x = new_x;
			gameui.bombList[i].y = new_y;
		}
	}
}


var gameui = {
	context:0,
	canvas:0,
	canvaswidth:0,
	canvasheight:0,
	yBulletsMax:6,
	gBulletsMax:4,
	heartsMax:5,
	images: {}, //name is probably bit misleading... Also I didn't separate characters from other images. This is associative array of character variables
	yApples: [],
	gApples: [],
	bombList: [],

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
					   	   "images/yellowball.png", "yBomb",
					   	   "images/greenball.png", "gBomb",
					   	   "images/yellowapple.png", "yApple",
					   	   "images/greenapple.png", "gApple",
					   	   "images/explosion.png", "explosion" ];

		for(i=0; i < imagesSrcs.length; i++) {
			imageLoader.load(imagesSrcs[i], imagesSrcs[i+1]);
			i++;
		}
	},

	drawHearts:function() { //only for the main character
		var str = "";
		for(i = 0; i < this.images["main"].heartsNum; ++i) {
			str = str.concat("<img src=\"images/fullheart.png\"> ");
		}
		for(i = 0; i < this.heartsMax - this.images["main"].heartsNum; ++i) {
			str = str.concat("<img src=\"images/emptyheart.png\"> ");
		}
		$('.hearts').html(str);
	},

	drawYbullets:function() { //only for the main character
		var str = "";
		for(i = 0; i < this.images["main"].yBulletsNum; ++i) {
			str = str.concat("<img src=\"images/ybullet.png\"> ");
		}
		for(i = 0; i < this.yBulletsMax - this.images["main"].yBulletsNum; ++i) {
			str = str.concat("<img src=\"images/emptybullet.png\"> ");
		}
		$('.ybullets').html(str);
	},

	drawGbullets:function() { //only for the main character
		var str = "";
		for(i = 0; i < this.images["main"].gBulletsNum; ++i) {
			str = str.concat("<img src=\"images/gbullet.png\"> ");
		}
		for(i = 0; i < this.gBulletsMax - this.images["main"].gBulletsNum; ++i) {
			str = str.concat("<img src=\"images/emptybullet.png\"> ");
		}
		$('.gbullets').html(str);
	},

	drawCharacter:function(key) {
		this.context.drawImage(this.images[key].image, this.images[key].x, this.images[key].y);
	},

	reachedEnd:function(img) {
		return ((img.x < 0) ||
			    ((img.x + img.image.width) > this.canvaswidth) ||
			    (img.y < 0) ||
			    ((img.y + img.image.height) > this.canvasheight));
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

	isPlayer:function(key) {
		return (key === "main" || key === "bird" || key === "cat" || key === "bee");
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
			}, appleExpiryDuration);
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
			}, appleExpiryDuration);
		}
	},

	fireYellowBomb:function(imgkey, dir) {
		if(this.images[imgkey].yBulletsNum == 0) {
			return;
		}
		switch(dir) {
			case 39: //right
			case 37: //left
			settings.makeSound("shoot");
			var ybomb = {
				x: this.images[imgkey].x + this.images[imgkey].image.width,
				y: this.images[imgkey].y + (Math.max(0, this.images[imgkey].image.height - this.images["yBomb"].image.height) / 2),
				dir: dir,
				image: this.images["yBomb"].image
			};
			this.bombList.push(ybomb);
			console.log("bomblist length: %d", this.bombList.length);
			(this.images[imgkey].yBulletsNum)--;
			this.drawYbullets();
		    default:
		    break;
		}
	},

	fireGreenBomb:function(imgkey, dir) {
		if(this.images[imgkey].gBulletsNum == 0) {
			return;
		}
		switch(dir) {
			case 38: //up
		    case 40: //down
		    settings.makeSound("shoot");
		    var gbomb = {
				x: this.images[imgkey].x + this.images[imgkey].image.width,
				y: this.images[imgkey].y + (Math.max(0, this.images[imgkey].image.height - this.images["yBomb"].image.height) / 2),
				dir: dir,
				image: this.images["gBomb"].image
			};
			this.bombList.push(gbomb);
			console.log("bomblist length: %d", this.bombList.length);
			(this.images[imgkey].gBulletsNum)--;
			this.drawGbullets();
		    default:
		    break;
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
		if (x < this.images[key].min_x || x > this.images[key].max_x) {
			return false;
		}

		var mcharacter = {
			x: x,
			y: y,
			image: this.images[key].image
		};

		// check if any character is in the way
		for (var k in this.images) {
			if (k === key) {
				continue;
			}

			var kcharacter = {
				x: this.images[k].x,
				y: this.images[k].y,
				image: this.images[k].image
			};

			//TODO: I don't really know about how to access reference of something in javascript
			// I can remove redundancy in the code later if find that out
			if (k === "yApple") {
				for(i = 0; i < this.yApples.length; i+=2) {
					kcharacter.x = this.yApples[i];
					kcharacter.y = this.yApples[i+1];
					// eat yellow apple
					if (this.isOverlapping(mcharacter, kcharacter)) {
						var ret = this.isCharacterAt(kcharacter, k);
						if(ret[0] == true) {
							settings.makeSound("applebite");
							this.clearCharacter(kcharacter);
							//remove apple positions from yApples
							this.yApples.splice(ret[1], 2);
							if(this.images[key].yBulletsNum != this.yBulletsMax) {
								(this.images[key].yBulletsNum)++;
								settings.makeSound("blop");
								if(key === "main") {
									this.drawYbullets();
								}
							}
						}
					}
				}
			}
			else if (k === "gApple") {
				for(i = 0; i < this.gApples.length; i+=2) {
					kcharacter.x = this.gApples[i];
					kcharacter.y = this.gApples[i+1];
					// eat green apple
					if (this.isOverlapping(mcharacter, kcharacter)) {
						var ret = this.isCharacterAt(kcharacter, k);
						if(ret[0] == true) {
							settings.makeSound("applebite");
							this.clearCharacter(kcharacter);
							//remove apple positions from gApples
							this.gApples.splice(ret[1], 2);
							if(this.images[key].gBulletsNum != this.gBulletsMax) {
								(this.images[key].gBulletsNum)++;
								settings.makeSound("blop");
								if(key === "main") {
									this.drawGbullets();
								}
							}
						}
					}
				}
			}
			else if (this.isPlayer(k)) {
				if (this.isOverlapping(mcharacter, kcharacter)) {
					return false;
				}
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
	Wkeydown: false,
	Dkeydown: false,

	init:function() {
		$('html').keydown(function(e){
		    switch(e.which) {
			    case 38: //up
			    case 39: //right
			    case 40: //down
			    case 37: //left
			    	if(this.Wkeydown) {
			    		gameui.fireGreenBomb("main", e.which);
			    	}
			    	else if(this.Dkeydown) {
			    		gameui.fireYellowBomb("main", e.which);
			    	}
			    	else {
			    		gameui.moveCharacter("main", e.which);
			    	}
			    break;
			    case 87: //W -> G
			    	this.Wkeydown = true;
			    break;
			    case 68: //D -> Y
			    	this.Dkeydown = true;
			    break;
			    default:
			    break;
			}
		});

		$('html').keyup(function(e){
		    switch(e.which) {
			    case 87: //W for Green
			    	this.Wkeydown = false;
			    break;
			    case 68: //D for Yellow
			    	this.Dkeydown = false;
			    break;
			    default:
			    break;
			}
		});
	},
}

function playGame() {

	gameui.drawHearts();
	gameui.drawYbullets();
	gameui.drawGbullets();

	setInterval(drawBombs, bombDrawRate);

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
	for(i=0; i < 10; ++i) {
		gameui.drawRandomGreenApple();
		gameui.drawRandomYellowApple();
	}
}

var startscreen= {
	init: function(){
		$('.gamelayer').hide();
		$('#titlescreen').show();
		$('#loading').hide();
		$('#startgame').hide();
		$('#tutorial').hide();
		$('#gametop').hide();
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
	soundEffects:{},

	init: function() {
		sound = new Audio();
		sound.src = "sound/background.mp3";
		sound.loop = true;
		sound.play();
		isSoundOn = true;

		// probably we should load sound the same way we load images
		this.soundEffects["applebite"] = new Audio();
		this.soundEffects["applebite"].src = "sound/applebite.mp3";
		this.soundEffects["blop"] = new Audio();
		this.soundEffects["blop"].src = "sound/blop.mp3";
		this.soundEffects["shoot"] = new Audio();
		this.soundEffects["shoot"].src = "sound/shoot.mp3";

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
	},

	makeSound: function(key) {
		if(isSoundOn) {
			this.soundEffects[key].play();
		}
	}
}

function initgame(){
	startscreen.init();
	settings.init();
}

