//
// game.js
//

// Global variables for settings
var moveLimitBy = 300;
var moveBy = 15;
var appleExpiryDuration = 40000; //for testing, it's very large
var moveBombBy = 10;
var bombDrawRate = 20;
var bombInterval = null;
var images = {};
var mainPlayer; //GameUI object
var mainCharacter = "elephant";

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
    		images[key] = image;
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
//THIS SHOULD CHANGE
function drawBombs() {
	var i = mainPlayer.bombList.length;
	console.log("drawBombs: %d", mainPlayer.bombList.length);
	//go backward as we might remove the bullet
	while(i--) {
		var new_x = mainPlayer.bombList[i].x;
		var new_y = mainPlayer.bombList[i].y;
		var bulletRemoved = false;

		var img = {
			x: new_x,
			y: new_y,
			image: mainPlayer.bombList[i].image
		};
		mainPlayer.clearCharacter(img);

		// check if the bomb is overlapping with any apple, if so, redraw apple
		for (j=0; j < mainPlayer.yApples.length; j+=2) {
			var kapple = {
				x: mainPlayer.yApples[j],
				y: mainPlayer.yApples[j+1],
				image: images["yApple"]
			}
			if (isOverlapping(img, kapple)) {
				context.drawImage(images["yApple"], kapple.x, kapple.y);
				break;
			}
		}
		for (j=0; j < mainPlayer.gApples.length; j+=2) {
			var kapple = {
				x: mainPlayer.gApples[j],
				y: mainPlayer.gApples[j+1],
				image: images["gApple"]
			}
			if (isOverlapping(img, kapple)) {
				context.drawImage(images["gApple"], kapple.x, kapple.y);
				break;
			}
		}

		switch(mainPlayer.bombList[i].dir) {
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

		// check if the bomb is overlapping with any character
		for(k in mainPlayer.playerStates) {
			if(!mainPlayer.isPlayer(k)) {
				continue;
			}
			if(isOverlapping(img, mainPlayer.playerStates[k])) {
				// damage the character
				mainPlayer.damageCharacter(k);

				// Remove bullet
				mainPlayer.bombList.splice(i,1);
				bulletRemoved = true;
			}
		}

		// if reached the end of canvas, clear it and remove from bombList
		if(reachedEnd(img)) {
			// clear the bullet and remove from bombList
			mainPlayer.bombList.splice(i,1);
			bulletRemoved = true;
		}

		if(!bulletRemoved) {
			context.drawImage(mainPlayer.bombList[i].image, img.x, img.y);
			mainPlayer.bombList[i].x = new_x;
			mainPlayer.bombList[i].y = new_y;
		}
	}
}

var context = 0;
var canvas = 0;
var canvaswidth = 0;
var canvasheight = 0;

function initUI() {
	$("body").css("overflow", "hidden"); //disable scroll bar action
	canvas = document.getElementById("gamecanvas");
	context = canvas.getContext("2d");
	canvaswidth = canvas.getAttribute("width");
	canvasheight = canvas.getAttribute("height");

	var imagesSrcs = [ "images/elephant.png", "elephant",
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
}

// === Some general image functions === //

//
// isOverlapping:
//   Given img1, img2 as variables that each contains, x, y, and image
//   e.g. var img1 = { x:0, y:0, image: images["elephant"] }
//   it returns either true or false whether two images are overlapping
//
function isOverlapping (img1, img2) {
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
}

// reachedEnd:
//    Given img that each contains x, y, and image
//    e.g. var img1 = { x:0, y:0, image: images["elephant"] }
//    returns either true or false whether the image has reached the end of canvas of any side
//
function reachedEnd(img) {
	return ((img.x < 0) ||
		    ((img.x + img.image.width) > canvaswidth) ||
		    (img.y < 0) ||
		    ((img.y + img.image.height) > canvasheight));
}

// === GameUI === //
// Player object

function GameUI (myCharacter) {

	this.myCharacter = myCharacter;
	this.yBulletsMax = 6;
	this.gBulletsMax = 4;
	this.heartsMax = 5;

	this.yApples = [];
	this.gApples = [];
	this.bombList = [];

	this.playerStates = {};
	this.playerStates["elephant"] = { x: 0, y: 0, yBulletsNum: 3, gBulletsNum: 2, heartsNum: 5, image: images["elephant"] };
	this.playerStates["bee"] = { x: 0, y: 0, yBulletsNum: 3, gBulletsNum: 2, heartsNum: 5, image: images["bee"] };
	this.playerStates["cat"] = { x: 0, y: 0, yBulletsNum: 3, gBulletsNum: 2, heartsNum: 5, image: images["cat"] };
	this.playerStates["bird"] = { x: 0, y: 0, yBulletsNum: 3, gBulletsNum: 2, heartsNum: 5, image: images["bird"] };
	this.playerStates["yApple"] = { x: 0, y: 0, image: images["yApple"] };
	this.playerStates["gApple"] = { x: 0, y: 0, image: images["gApple"] };

	// === drawHearts === //
	//   Draw the # of hears that the main character has

	this.drawHearts = function() { //only for the main character
		if(this.myCharacter != mainCharacter) {
			return;
		}
		var str = "";
		for(i = 0; i < this.playerStates[this.myCharacter].heartsNum; ++i) {
			str = str.concat("<img src=\"images/fullheart.png\"> ");
		}
		for(i = 0; i < this.heartsMax - this.playerStates[this.myCharacter].heartsNum; ++i) {
			str = str.concat("<img src=\"images/emptyheart.png\"> ");
		}
		$('.hearts').html(str);
	};

	// === drawYbullets === //
	//   Draw the # of yellow bullets that the main character has

	this.drawYbullets = function() { //only for the main character
		if(this.myCharacter != mainCharacter) {
			return;
		}
		var str = "";
		for(i = 0; i < this.playerStates[this.myCharacter].yBulletsNum; ++i) {
			str = str.concat("<img src=\"images/ybullet.png\"> ");
		}
		for(i = 0; i < this.yBulletsMax - this.playerStates[this.myCharacter].yBulletsNum; ++i) {
			str = str.concat("<img src=\"images/emptybullet.png\"> ");
		}
		$('.ybullets').html(str);
	};

	// === drawGbullets === //
	//   Draw the # of green bullets that the main character has

	this.drawGbullets = function() { //only for the main character
		if(this.myCharacter != mainCharacter) {
			return;
		}
		var str = "";
		for(i = 0; i < this.playerStates[this.myCharacter].gBulletsNum; ++i) {
			str = str.concat("<img src=\"images/gbullet.png\"> ");
		}
		for(i = 0; i < this.gBulletsMax - this.playerStates[this.myCharacter].gBulletsNum; ++i) {
			str = str.concat("<img src=\"images/emptybullet.png\"> ");
		}
		$('.gbullets').html(str);
	};

	// === drawCharacter === //
	//   Draw a character. x and y coordinates int he playerStates should be set

	this.drawCharacter = function(key) {
		if(this.myCharacter != mainCharacter) {
			return;
		}
		context.drawImage(images[key], this.playerStates[key].x, this.playerStates[key].y);
	};

	// === clearCharacter === //
	//   Clear a character

	this.clearCharacter = function(img) {
		if(this.myCharacter != mainCharacter) {
			return;
		}
		context.clearRect(img.x, img.y,
						  img.image.width,
						  img.image.height);
	};

	// === updateCharPosn === //
	//   Update the x, y coordinates of a character

	this.updateCharPosn = function(key, x, y) {
		this.playerStates[key].x = x;
		this.playerStates[key].y = y;
	};

	// === updatePosnLimit === //
	//   Not in use

	this.updatePosnLimit = function(key, min_x, max_x) {
		this.playerStates[key].min_x = min_x;
		this.playerStates[key].max_x = max_x;
	};

	// === damageCharacter === //
	//   Damage a character of the given key

	this.damageCharacter = function(key) {
		(this.playerStates[key].heartsNum)--;
		this.drawHearts();
		if(this.playerStates[key].heartsNum == 0) {
			//dead
			settings.makeSound("dead");
			this.clearCharacter(this.playerStates[key]);
			if(key === this.myCharacter) {
				// TODO: indicate game over
			}
		}
		else {
			settings.makeSound("hiccup");
		}
	};

	// === isPlayer === //
	//   Return whether the key is one of the players

	this.isPlayer = function(key) {
		return (key === "elephant" || key === "bird" || key === "cat" || key === "bee");
	};

	// TODO: Remove redundancy for two apple arrays

	// === getRandomAppleLocation === //
 	//   Get a random apple location
 	//   This random location should take into player's positions, and apples that were already drawn
 	//
 	//   WARNING! This function should be called only by the server!

	this.getRandomAppleLocation = function() {
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
			coord[0] = Math.max(0, Math.floor(Math.random() * canvaswidth) - images["yApple"].width);
			coord[1] = Math.max(0, Math.floor(Math.random() * canvasheight) - images["yApple"].height);
			var newapple = {
				x: coord[0],
				y: coord[1],
				image: images["yApple"] // do this because apple sizes are the same
			}
			// check if it's overlapping with any character
			for (var k in this.playerStates) {
				if (!(k === "elephant" || k === "bird" || k === "bee" || k === "cat")) {
					continue;
				}
				var kcharacter = {
					x: this.playerStates[k].x,
					y: this.playerStates[k].y,
					image: images[k]
				};
				if (isOverlapping(newapple, kcharacter)) {
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
					image: images["yApple"]
				}
				if (isOverlapping(newapple, kapple)) {
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
					image: images["gApple"]
				}
				if (isOverlapping(newapple, kapple)) {
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
	};

	// === isCharacterAt === //
	//   Given an image and key, check if the image is still there
	//   e.g. if someone already ate an apple, it shouldn't be cleared at timeout

	this.isCharacterAt = function(img, key) {
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
	};

	//TODO: Remove redundancy btw drawYellowApple & drawGreenApple
	// if list can be passed/accessed by reference

	// === drawYellowApple === //
	//   Given a coordinate of the yellow apple, draw the apple.
	//   Set a timeout at a fixed value of appleExpiryDuration

	this.drawYellowApple = function(coord) {
		//var coord = this.getRandomAppleLocation();
		if(coord.length > 0) {
			this.updateCharPosn("yApple", coord[0], coord[1]);
			this.drawCharacter("yApple");
			(this.yApples).push(coord[0]);
			(this.yApples).push(coord[1]);
			// no need if javascript pass arguments by value TODO: find out what js does
			var img = {
				x: coord[0],
				y: coord[1],
				image: images["yApple"]
			}
			//THIS SHOULD CHANGE!
			setTimeout(function() {
				var ret = mainPlayer.isCharacterAt(img, "yApple");
				if(ret[0] == true) {
					this.clearCharacter(img);
					//remove apple positions from yApples
					mainPlayer.yApples.splice(ret[1], 2);
				}
			}, appleExpiryDuration);
		}
	};

	// === drawGreenApple === //
	//   Given a coordinate of the green apple, draw the apple.
	//   Set a timeout at a fixed value of appleExpiryDuration

	this.drawGreenApple = function(coord) {
		//var coord = this.getRandomAppleLocation();
		if(coord.length > 0) {
			this.updateCharPosn("gApple", coord[0], coord[1]);
			this.drawCharacter("gApple");
			(this.gApples).push(coord[0]);
			(this.gApples).push(coord[1]);
			var img = {
				x: coord[0],
				y: coord[1],
				image: images["gApple"]
			}
			//THIS SHOULD CHANGE!
			setTimeout(function() {
				var ret = mainPlayer.isCharacterAt(img, "gApple");
				if(ret[0] == true) {
					this.clearCharacter(img);
					//remove apple positions from gApples
					mainPlayer.gApples.splice(ret[1], 2);
				}
			}, appleExpiryDuration);
		}
	};

	// === fireYellowBomb === //
	//   Whoever fires a yellow bomb, is given by the imgkey (e.g. "bee").
	//   Given the fire direction, add the bomb into the bomblist
	//   The bomblist elements are printed at every bombDrawRate by DrawBombs()

	this.fireYellowBomb = function(imgkey, dir) {
		if((this.playerStates[imgkey].yBulletsNum == 0) || (dir != 39 && dir != 37))
		{
			return;
		}

		settings.makeSound("shoot");
		var ybomb = {
				x: this.playerStates[imgkey].x,
				y: this.playerStates[imgkey].y + (Math.max(0, images[imgkey].height - images["yBomb"].height) / 2),
				dir: dir,
				image: images["yBomb"]
		};

		if(dir === 39) { //right
			ybomb.x += images[imgkey].width;
		} else { //left
			ybomb.x -= images["yBomb"].width;
		}
		this.bombList.push(ybomb);
		(this.playerStates[imgkey].yBulletsNum)--;
		this.drawYbullets();
	};

	// === fireGreenBomb === //
	//   Whoever fires a green bomb, is given by the imgkey (e.g. "bee").
	//   Given the fire direction, add the bomb into the bomblist
	//   The bomblist elements are printed at every bombDrawRate by DrawBombs()

	this.fireGreenBomb = function(imgkey, dir) {
		if(this.playerStates[imgkey].gBulletsNum == 0 || (dir != 38 && dir != 40))
		{
			return;
		}

		settings.makeSound("shoot");
		var gbomb = {
				x: this.playerStates[imgkey].x + (images[imgkey].width / 2),
				y: this.playerStates[imgkey].y,
				dir: dir,
				image: images["gBomb"]
		};

		if(dir === 40) { //down
			gbomb.y += images[imgkey].height;
		} else { //up
			gbomb.y -= images["gBomb"].height;
		}
		this.bombList.push(gbomb);
		(this.playerStates[imgkey].gBulletsNum)--;
		this.drawGbullets();
	};

	// === canMove === //
	//   Returns true or false whether the character of the given key can move into the given coordinates, x and y.
	//   If there's an apple in the way, eat the apple

	this.canMove = function(key, x, y) {
		// if (x < this.playerStates[key].min_x || x > this.playerStates[key].max_x) {
		// 	return false;
		// }

		var mcharacter = {
			x: x,
			y: y,
			image: images[key]
		};

		// check if any character is in the way
		for (var k in this.playerStates) {
			if (k === key) {
				continue;
			}

			var kcharacter = {
				x: this.playerStates[k].x,
				y: this.playerStates[k].y,
				image: images[k]
			};

			//TODO: I don't really know about how to access reference of something in javascript
			// I can remove redundancy in the code later if find that out

			// If a character encounters an apple while moving, it has to eat it
			// Go through the apple arrays to see if the character is overlapping with any apples
			if (k === "yApple") {
				for(i = 0; i < this.yApples.length; i+=2) {
					kcharacter.x = this.yApples[i];
					kcharacter.y = this.yApples[i+1];
					// eat yellow apple
					if (isOverlapping(mcharacter, kcharacter)) {
						var ret = this.isCharacterAt(kcharacter, k);
						if(ret[0] == true) {
							settings.makeSound("applebite");
							this.clearCharacter(kcharacter);
							//remove apple positions from yApples
							this.yApples.splice(ret[1], 2);
							if(this.playerStates[key].yBulletsNum != this.yBulletsMax) {
								(this.playerStates[key].yBulletsNum)++;
								settings.makeSound("blop");
								this.drawYbullets();
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
					if (isOverlapping(mcharacter, kcharacter)) {
						var ret = this.isCharacterAt(kcharacter, k);
						if(ret[0] == true) {
							settings.makeSound("applebite");
							this.clearCharacter(kcharacter);
							//remove apple positions from gApples
							this.gApples.splice(ret[1], 2);
							if(this.playerStates[key].gBulletsNum != this.gBulletsMax) {
								(this.playerStates[key].gBulletsNum)++;
								settings.makeSound("blop");
								this.drawGbullets();
							}
						}
					}
				}
			}
			// if overlapping with another player, return false (it can't move)
			else if (this.isPlayer(k)) {
				if (isOverlapping(mcharacter, kcharacter)) {
					return false;
				}
			}
		}
		return true;
	};

	this.moveCharacter = function(key, direction) {
		switch(direction) {
			case 38: //up
				var new_y = Math.max(this.playerStates[key].y - moveBy, 0);
				if(this.canMove(key, this.playerStates[key].x, new_y)) {
					this.clearCharacter(this.playerStates[key]);
					this.updateCharPosn(key, this.playerStates[key].x, new_y);
			   		this.drawCharacter(key);
			   	}
			break;
			case 39: //right
			   	var new_x = Math.min(this.playerStates[key].x + moveBy, canvaswidth - images[key].width);
			   	if(this.canMove(key, new_x, this.playerStates[key].y)) {
			   		this.clearCharacter(this.playerStates[key]);
					this.updateCharPosn(key, new_x, this.playerStates[key].y);
			   		this.drawCharacter(key);
			   	}
			break;
			case 40: //down
				var new_y = Math.min(this.playerStates[key].y + moveBy, canvasheight - images[key].height);
				if(this.canMove(key, this.playerStates[key].x, new_y)) {
					this.clearCharacter(this.playerStates[key]);
					this.updateCharPosn(key, this.playerStates[key].x, new_y);
			   		this.drawCharacter(key);
			   	}
			break;
			case 37: //left
				var new_x = Math.max(this.playerStates[key].x - moveBy, 0);
				if(this.canMove(key, new_x, this.playerStates[key].y)) {
					this.clearCharacter(this.playerStates[key]);
					this.updateCharPosn(key, new_x, this.playerStates[key].y);
			   		this.drawCharacter(key);
			   	}
			break;
			default:
			break;
		}
	};
}

// === keyHandler ===//
//  Key press only affects the main character

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
			    		mainPlayer.fireGreenBomb(mainCharacter, e.which);
			    	}
			    	else if(this.Dkeydown) {
			    		mainPlayer.fireYellowBomb(mainCharacter, e.which);
			    	}
			    	else {
			    		mainPlayer.moveCharacter(mainCharacter, e.which);
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

	mainPlayer = new GameUI("elephant");

	mainPlayer.drawHearts();
	mainPlayer.drawYbullets();
	mainPlayer.drawGbullets();

	bombInterval = setInterval(drawBombs, bombDrawRate);

	// === init character positions === //

	var offset = 50;
	mainPlayer.updateCharPosn("elephant", offset, offset);
	mainPlayer.updatePosnLimit("elephant", 0, moveLimitBy);
	mainPlayer.drawCharacter("elephant");

	// bird is on the opposite side of main
	var xmax = canvaswidth - images["bird"].width;
	var ymax = canvasheight - images["bird"].height;
	mainPlayer.updateCharPosn("bird", xmax - offset, offset);
	mainPlayer.updatePosnLimit("bird", xmax - moveLimitBy, xmax);
	mainPlayer.drawCharacter("bird");

	ymax = canvasheight - images["cat"].height;
	mainPlayer.updateCharPosn("cat", offset, ymax - offset);
	mainPlayer.updatePosnLimit("cat", 0, moveLimitBy);
	mainPlayer.drawCharacter("cat");

	// bee is one the opposite side of main
	xmax = canvaswidth - images["bee"].width;
	ymax = canvasheight - images["bee"].height;
	mainPlayer.updateCharPosn("bee", xmax - offset, ymax - offset);
	mainPlayer.updatePosnLimit("bee", xmax - moveLimitBy, xmax);
	mainPlayer.drawCharacter("bee");

	// === Real game logic starts === //
	keyHandler.init();
	for(i=0; i < 10; ++i) {
		var coord = mainPlayer.getRandomAppleLocation();
		if(coord.length > 0) {
			mainPlayer.drawGreenApple(mainPlayer.getRandomAppleLocation());
		}
		coord = mainPlayer.getRandomAppleLocation();
		if(coord.length > 0) {
			mainPlayer.drawYellowApple(mainPlayer.getRandomAppleLocation());
		}
	}
}

var startscreen = {
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
			initUI();
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
		this.soundEffects["hiccup"] = new Audio();
		this.soundEffects["hiccup"].src = "sound/hiccup.mp3";
		this.soundEffects["dead"] = new Audio();
		this.soundEffects["dead"].src = "sound/dead.mp3";

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

/* === data structures for background calculation === */
// Bullet class
function Bullet(x, y){
	this.gBullet = x;
	this.yBullet = y;
}

// Position class
function position(x, y){
	this.x = x;
	this.y = y;
}

position.prototype.set = function(pos_x, pos_y){
	this.x = pos_x;
	this.y = pos_y;
}

position.prototype.setx = function(pos_x){
	this.x = pos_x;
}

position.prototype.sety = function(pox_y){
	this.y = pos_y;
}

position.prototype.getx = function(){
	return this.x;
}

position.prototype.gety = function(){
	return this.y;
}

// apple class
function apple(x, y){
	this.x = x;
	this.y = y;
	this.edible = true;
}

// action class
function event(time, player, action){
	this.time = time;
	this.player = player;
	this.action = action;
}

event.prototype.gettime = function(){
	return this.time;
}

event.prototype.getplayer = function(){
	return this.player;
}

event.prototype.getaction = function(){
	return this.action;
}

// world_state class
function world_state(){
	this.player_pos = [];
	this.dead = [];
	this.Bullets = [];
	this.Apples = [];
}

world_state.prototype.init = function(){
	for(var i = 0; i < 4; i++){
		// load player_pos
		
		
		// load if dead
		this.dead.push(0);
		
		// load bullets info
		this.Bullet.push(new Bullet(0, 0));
	}

	// load apple info
	
	// set time interval, generate apples every 5 seconds

}

world_state.prototype.apply = function(action){
	// judge if dead first

	// judge if ate any apple

	// judge if killed anyone

	// update corresponding data

}
