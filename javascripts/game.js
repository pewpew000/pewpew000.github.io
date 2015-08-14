//
// game.js
//

// Global variables for settings
var moveLimitBy = 300;
var moveBy = 15;

var appleExpiryDuration = 3000; //for testing, it's very large

var moveBombBy = 10;
var bombDrawRate = 50; //1000;
var bombInterval = null;
var bombRange = 2;

var images = {};

var mainPlayer; //GameUI objects
var birdPlayer;
var catPlayer;
var beePlayer;
var server; 
 
var mainCharacter = "elephant";

var latencyList = [];

// Global variables for background calculation
speculation_k1 = 3; // for key actions
speculation_k2 = 3; // for move actions
refresh_req = 100; // in terms of milliseconds

// Global varaibles for different strategies
 var strategy = "linear"; // using linear consistency
// var strategy = "spec_actions"; // using speculation on actions
// var strategy = "hints"; // using hints


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
				$('#tutorial').click(function(){
					$('#tutorial').hide();
                    $('#gametop').show();
                    playGame();
				});
				$('#tutorial').keypress(function(){
					$('#tutorial').hide();
                    $('#gametop').show();
                    playGame();
				});
    		}
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

// buffers used for background
	this.localbuffer = [];
	this.pending_k1 = 0; // pending for firing
	this.pending_k2 = 0; // pending for moving
//	this.bufferNum = 0;

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
		if(this.myCharacter == "elephant"){
			this.drawHearts();
			if(this.playerStates[key].heartsNum <= 0) {
				//dead
				settings.makeSound("dead");
				this.clearCharacter(this.playerStates[key]);
				if(key === "elephant") {
					// TODO: indicate game over
					// alert("Game Over!");
				}
			} else {
				settings.makeSound("hiccup");
			}
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
/*				var kcharacter = {
					x: this.playerStates[k].x,
					y: this.playerStates[k].y,
					image: images[k]
				};
*/				if (isOverlapping(newapple, this.playerStates[k])) {
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

			setTimeout(cleanyApple(this, img), appleExpiryDuration);
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

			setTimeout(cleangApple(this, img), appleExpiryDuration);
		}
	};

	// === fireYellowBomb === //
	//   Whoever fires a yellow bomb, is given by the imgkey (e.g. "bee").
	//   Given the fire direction, add the bomb into the bomblist
	//   The bomblist elements are printed at every bombDrawRate by DrawBombs()
	this.fireYellowBomb = function(imgkey, dir) {
        if(this.playerStates[imgkey].yBulletsNum == 0 || (dir != 39 && dir != 37))
        {
            return;
        }

        settings.makeSound("shoot");

        var ybomb = {
                x: this.playerStates[imgkey].x,
                y: this.playerStates[imgkey].y + (Math.max(0, images[imgkey].height - images["explosion"].height) / 2),
                dir: dir,
                image: images["explosion"]
        };

        // set the coordinate accordingly
        if(dir === 39) { // DOWN
            ybomb.x += (images[imgkey].width + 1);
        } else { // UP
            ybomb.x -= (images["explosion"].width+1);
        }

        // check the firing range and update player state if in fire range
        this.checkRange(ybomb, this.myCharacter);

        // update bullet info
        (this.playerStates[imgkey].yBulletsNum)--;
        this.drawYbullets();
    };

	// === fireGreenBomb === //
	//   Whoever fires a green bomb, is given by the imgkey (e.g. "bee").
	//   Given the fire direction, add the bomb into the bomblist
	//   The bomblist elements are printed at every bombDrawRate by DrawBombs()

	// === New version of fireGreenBomb === //
	// to fulfill the goal that only order matters, the old logic will make this
	// really hard to acheve. Thus change this function to a easier version. it 
	// only check if there is anyone in the range of its fire range. for mainPla
	// -er, draw the fire range.
	
	this.fireGreenBomb = function(imgkey, dir) {
		if(this.playerStates[imgkey].gBulletsNum == 0 || (dir != 38 && dir != 40))
		{
			return;
		}

		settings.makeSound("shoot");

		var gbomb = {
				x: this.playerStates[imgkey].x + 5, // + (images["explosion"].width / 2),
				y: this.playerStates[imgkey].y,
				dir: dir,
				image: images["explosion"]
		};

		// set the coordinate accordingly
		if(dir === 40) { // DOWN
			gbomb.y += (images[imgkey].height+1);
		} else { // UP
			gbomb.y -= (images["explosion"].height+1);
		}
		
		// check the firing range and update player state if in fire range
		this.checkRange(gbomb, this.myCharacter);

		// update bullet info
		(this.playerStates[imgkey].gBulletsNum)--;
		this.drawGbullets();
	};

	// === check if anyone in fireRange === //
	// it will update world state if anyone in the range
	this.checkRange = function(bomb){

		// check all players to check if overlapped
		for(k in this.playerStates){
            if(!(k === "elephant" || k === "bird" || k === "bee" || k === "cat"))
               continue;

        	var kcharacter = {
            	x: this.playerStates[k].x,
                y: this.playerStates[k].y,
                image: images[k]
            };
			
			var localbomb = {
				x: bomb.x,
				y: bomb.y,
				dir: bomb.dir,
				image: bomb.image
			};
			
			for(var i = 0; i < bombRange; i++){	
	            if(isOverlapping(localbomb, kcharacter)){
                    this.damageCharacter(k);
					break;
                }
				
				 // update bomb coord
          	  switch(localbomb.dir){
            	    case 37: // LEFT
                	    localbomb.x -= localbomb.image.width;
	                break;
    	            case 39: // RIGHT
        	            localbomb.x += localbomb.image.width;
            	    break;
               		case 38: // UP
                    	localbomb.y -= localbomb.image.height;
	                break;
    	            case 40: // DOWN
        	            localbomb.y += localbomb.image.height;
            	    break;
	            }

	            // check if out of range
    	        if(reachedEnd(localbomb))
        	        break;
            }
        }

		for(var i = 0; i < bombRange; i++){
			// check all players to check if overlapped
			// for the mainPlayer, draw the range
			if(this.myCharacter == "elephant"){
				context.drawImage(bomb.image, bomb.x, bomb.y);
				//setTimeout(this.clearCharacter(bomb), 5000);
				setTimeout( cleanFire(bomb.x, bomb.y, this), 500);
			
				// check if the bomb is overlapping with any apple, if so, redraw apple
    	        for (j=0; j < mainPlayer.yApples.length; j+=2) {
        	        var kapple = {
            	        x: mainPlayer.yApples[j],
                	    y: mainPlayer.yApples[j+1],
                    	image: images["yApple"]
              	  	}
                	if (isOverlapping(bomb, kapple)) {
                    	context.drawImage(images["yApple"], kapple.x, kapple.y);
                    //	break;
                	}
            	}
 	           for (j=0; j < mainPlayer.gApples.length; j+=2) {
    	            var kapple = {
        	            x: mainPlayer.gApples[j],
            	        y: mainPlayer.gApples[j+1],
                	    image: images["gApple"]
              		  }
               		if (isOverlapping(bomb, kapple)) {
                    	context.drawImage(images["gApple"], kapple.x, kapple.y);
                    //break;
                	}
            	}
			}

			// update bomb coord
			switch(bomb.dir){
				case 37: // LEFT
					bomb.x -= bomb.image.width;
				break;
				case 39: // RIGHT
					bomb.x += bomb.image.width;
				break;
				case 38: // UP
					bomb.y -= bomb.image.height;
				break;
				case 40: // DOWN
					bomb.y += bomb.image.height;
				break;
			}

			// check if out of range
			if(reachedEnd(bomb))
				break;
		}
	};

	// === cleanFire === //
/*	this.cleanFire = function(x, y){
    	return function(){

       		context.clearRect(x, y,
            	              images["explosion"].width,
                	          images["explosion"].height);
			var bomb = {
				x: x,
				y: y,
				image: images["explosion"]
			};
			for(k in this.playerStates){
				if(!(k == "elephant" || k == "bird" || k == "cat" || k == "bee"))
					continue;

				var kCharacter = {
					x: this.playerStates[k].x,
					y: this.playerStates[k].y,
					image: images[k]
				};

				if(isOverlapping(kCharacter, bomb)){
					if(this.playerStates[k].heartsNum > 0){
						this.drawCharacter(k);
					} else {
						this.cleanCharacter(this.playerStates[k]);
					}
				}
			}
		};
	};
*/
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
				if (isOverlapping(mcharacter, kcharacter) && this.playerStates[k].heartsNum > 0) {
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

	// synchronize world states to be the same as the other
	this.synchStates = function(other){
		// clean speculating datas
		if(this.myCharacter == "elephant" || this.myCharacter == "bird" || this.myCharacter == "bee" || this.myCharacter == "cat"){
			this.pending_k1 = 0;
			this.pending_k2 = 0;
		}
		var coord = {x: 0, y: 0, image: images["yApple"]};

		// yApples
		for(var i = this.yApples.length - 1; i > 0; i -= 2){
			coord.x = this.yApples[i-1];
			coord.y = this.yApples[i];
			var ret = other.isCharacterAt(coord, "yApple");
			if( ret == false ){
				this.yApples.splice(i-1, 2);
				this.clearCharacter(coord);
			}
		}
		
		// gApples
		for(var i = this.gApples.length - 1; i > 0; i -= 2){
			coord.x = this.gApples[i-1];
			coord.y = this.gApples[i];
			var ret = other.isCharacterAt(coord, "gApple");
			if( ret == false ){
				this.gApples.splice(i-1, 2);
				this.clearCharacter(coord);
			}

		}

		// playerStates
		for(k in this.playerStates){ // x: 0, y: 0, yBulletsNum: 3, gBulletsNum: 2, heartsNum: 5
			var changed = [];
			var img = {
				x: this.playerStates[k].x,
				y: this.playerStates[k].y,
				image: images[k]
			};
		
			changed[0] = false;
			changed[1] = false;
 
			if(img.x != other.playerStates[k].x || img.y != other.playerStates[k].y){
				this.clearCharacter(img);
				changed[0] = true;
			}

			if(this.playerStates[k].yBulletsNum != other.playerStates[k].yBulletsNum || this.playerStates[k].gBulletsNum != other.playerStates[k].gBulletsNum )
				changed[1] = true;

			this.playerStates[k].x = other.playerStates[k].x;
			this.playerStates[k].y = other.playerStates[k].y;
			this.playerStates[k].yBulletsNum = other.playerStates[k].yBulletsNum;
			this.playerStates[k].gBulletsNum = other.playerStates[k].gBulletsNum;
			this.playerStates[k].heartsNum = other.playerStates[k].heartsNum;
			if(changed[0])
				this.drawCharacter(k);
			if(changed[1]){
				//this.drawBullets();
				this.drawYbullets();
				this.drawGbullets();
			}
			this.drawHearts();
		}
	};

	this.findclearbuff = function(item){ // delete events acknowledged by the server
		for(var i = 0; i < this.localbuffer.length; i++){
			if(this.localbuffer[i].player == item.player && this.localbuffer[i].fNum == item.fNum && this.localbuffer[i].dir == item.dir){
				this.localbuffer.splice(i, 1);
			}
		}
	};

	this.localbuff = function(funcNum, Character, direction){

		if(this.myCharacter == "server"){ // for the server buffer
			// update the world state
			switch(funcNum){
				case 0:
					this.fireGreenBomb(Character, direction);
				break;
				case 1:
					this.fireYellowBomb(Character, direction);
				break;
				case 2:
					this.moveCharacter(Character, direction);
				break;
			}

			/* behave differently for different strategies */
			if(strategy != "linear"){
				// set timeout to send info to all ack world states
				setTimeout( function(){ mainack.localbuff(funcNum, Character, direction); }, latencyList["server"].elephant );
				setTimeout( function(){ birdack.localbuff(funcNum, Character, direction); }, latencyList["server"].bird );
				setTimeout( function(){  catack.localbuff(funcNum, Character, direction); }, latencyList["server"].cat );
				setTimeout( function(){  beeack.localbuff(funcNum, Character, direction); }, latencyList["server"].bee );
			} else {
				setTimeout( function(){ mainPlayer.runFunc(funcNum, Character, direction); }, latencyList["server"].elephant );
				setTimeout( function(){ birdPlayer.runFunc(funcNum, Character, direction); }, latencyList["server"].bird );
				setTimeout( function(){  catPlayer.runFunc(funcNum, Character, direction); }, latencyList["server"].cat );
				setTimeout( function(){  beePlayer.runFunc(funcNum, Character, direction); }, latencyList["server"].bee );
			}

		} else if(this.myCharacter == "elephantack" || this.myCharacter == "birdack" || this.myCharacter == "catack" || this.myCharacter == "beeack" ){
			/* behave differently for different strategies */
			if(strategy == "linear") return;

  			/* for the ack world states */
			// insert to local buffer immediately
			this.localbuffer.push( {player: Character, fNum: funcNum, dir: direction} );

			//update the world state
			switch(funcNum){
                case 0:
                    this.fireGreenBomb(Character, direction);
					if(Character.substr(0,3) == this.myCharacter.substr(0,3))
						this.pending_k1++;
                break;
                case 1:
                    this.fireYellowBomb(Character, direction);
					if(Character.substr(0,3) == this.myCharacter.substr(0,3))
						this.pending_k1++;
                break;
                case 2:
                    this.moveCharacter(Character, direction);
					if(Character.substr(0,3) == this.myCharacter.substr(0,3))
						this.pending_k2++;
                break;
            }

			if(this.pending_k1 >= speculation_k1 || this.pending_k2 >= speculation_k2){
		
				if(this.myCharacter == "elephantack"){
					console.log("catchyou");
				}	

				// synchronize 
				synchAck(this);
			}
		} else { /* for the prediction world states */
			/* differnt for different strategies */
			if(strategy != "linear"){
				// insert to local buffer immediately
				this.localbuffer.push( {player: Character, fNum: funcNum, dir: direction} );

				// update the number of actions in the buffer now
				if(funcNum != 2){ // firing situation
					if(this.pending_k1 < speculation_k1){ 
						if(Character == this.myCharacter) // adddddddddddddddddddddddddd
							this.pending_k1 += 1;
						if(funcNum == 0){
							this.fireGreenBomb(Character, direction);
						} else {
							this.fireYellowBomb(Character, direction);
						}
					} else {	// when firing speculation has come to limit
						this.pending_k2 = speculation_k2;
					}
				} else {	// moving situation
					if(this.pending_k2 < speculation_k2){
//						this.bufferNum += 1;		// note down how many actions have been buffered
						if(Character == this.myCharacter) // adddddddddddddddddd
							this.pending_k2 += 1;
						this.moveCharacter(Character, direction);
					} else {	// when moving speculation has come to limit
						this.pending_k1 = speculation_k1;
					}
				}

				// if is self action, set timeout and insert it to otherplayer's buffer
				if(Character === this.myCharacter){
					if(strategy == "hints"){
						if(Character != "elephant")
							setTimeout( function(){ mainPlayer.localbuff(funcNum, Character, direction); }, latencyList[Character].elephant);	// to all other players
						if(Character != "bird")
							setTimeout( function(){ birdPlayer.localbuff(funcNum, Character, direction); }, latencyList[Character].bird);	// to all other players
						if(Character != "cat")
							setTimeout( function(){ catPlayer.localbuff(funcNum, Character, direction); }, latencyList[Character].cat);	// to all other players
						if(Character != "bee")
							setTimeout( function(){ beePlayer.localbuff(funcNum, Character, direction); }, latencyList[Character].bee);	// to all other players
					}
					setTimeout( function(){ server.localbuff(funcNum, Character, direction); }, latencyList[Character].server);	// to the server
				}
			} else { // for linear consistency, just draw stuff when called localbuff.
				setTimeout( function(){ server.localbuff(funcNum, Character, direction); }, latencyList[Character].server); // to the server
			}
		} 

	};

	this.runFunc = function(funcNum, Character, direction){
		switch(funcNum){
            case 0:
               this.fireGreenBomb(Character, direction);
            break;
            case 1:
               this.fireYellowBomb(Character, direction);
            break;
            case 2:
               this.moveCharacter(Character, direction);
            break;
        }
	};

	this.run = function(){ // running until pending_k big enough
		var i = 0;
		while( i < this.localbuffer.length && this.pending_k1 < speculation_k1 && this.pending_k2 < speculation_k2 ){
			switch(this.localbuffer[i].fNum){
			case 0:
				this.fireGreenBomb(this.localbuffer[i].player, this.localbuffer[i].direction);
				this.pending_k1 += 1;
			break;
			case 1:
				this.fireYellowBomb(this.localbuffer[i].player, this.localbuffer[i].direction);
				this.pending_k1 += 1;
			break;
			case 2:
				this.moveCharacter(this.localbuffer[i].player, this.localbuffer[i].direction);
			break;
			}
			i++;
		}
	};
/*
	this.start_AI = function(){
		var tmp = setInterval(this.AI_move(), genRandom(20, 50));
	};
*/
	this.AI_move = function(){
		if(this.playerStates[this.myCharacter].heartsNum <= 0 ) return;
		if(this.playerStates[this.myCharacter].gBulletsNum > 0 || this.playerStates[this.myCharacter].yBulletsNum > 0){		// if has bullet, kill others
			var judge = this.cankill(this.myCharacter, "elephant" );
			// if can't kill
			if(judge == 0){ // can't kill, stay away from mainPlayer
				this.AI_chase("elephant");
			} else if(judge[0] == 1){ // can horizon kill
				this.localbuff(0, this.myCharacter, judge[1]); //fireGreenBomb(this.myCharacter, judge[1]);
			} else { // can vertical kill
				this.localbuff(1, this.myCharacter, judge[1]); //fireYellowBomb(this.myCharacter, judge[1]);
			}

		} else {			// if has no bullet, if has apples, chase; if no apples, avoid
			// if there are apples now, chase the apple
			if(this.yApples.length > 0 || this.gApples.length > 0){
				this.AI_chaseApple();
			} else {
				// if there are no apple now
				this.AI_runAway("elephant");
			}
		}
	};

	// chase player: chased
	this.AI_chase = function(chased){
		var x_diff = this.playerStates[this.myCharacter].x - this.playerStates[chased].x;
		var y_diff = this.playerStates[this.myCharacter].y - this.playerStates[chased].y;
		if( Math.abs(x_diff) >= Math.abs(y_diff) ){
			switch(genRandom(0,2)){
				case 0:
					if(x_diff > 0){
             		   this.localbuff(2, this.myCharacter, 37); // left
		            } else {
        		        this.localbuff(2, this.myCharacter, 39); // right
           			}
				break;
				default:
					if(y_diff > 0){
						this.localbuff(2, this.myCharacter, 38); // up
					} else {
						this.localbuff(2, this.myCharacter, 40); // down
					}
				break;
			}
		} else {
			switch(genRandom(0,2)){
				case 0:
					if(y_diff > 0){
                        this.localbuff(2, this.myCharacter, 38); // up
                    } else {
                        this.localbuff(2, this.myCharacter, 40); // down
                    }
				break;
				default:
					if(x_diff > 0){
						this.localbuff(2, this.myCharacter, 37); // left
					} else {
						this.localbuff(2, this.myCharacter, 39); // right
					}
				break;
			}
		}
	};

	// run away from player
	this.AI_runAway = function(player){
		var x_diff = this.playerStates[this.myCharacter].x - this.playerStates[player].x;
        var y_diff = this.playerStates[this.myCharacter].y - this.playerStates[player].y;

		if( Math.abs(x_diff) >= Math.abs(y_diff) ){
            if(y_diff > 0){
                this.localbuff(2, this.myCharacter, 40); // up
            } else {
                this.localbuff(2, this.myCharacter, 38); // down
            }
        } else {
            if(x_diff > 0){
                this.localbuff(2, this.myCharacter, 39); // left
            } else {
                this.localbuff(2, this.myCharacter, 37); // right
            }
        }

	};

	// chase Apple
	this.AI_chaseApple = function(){
		var choose = {
			dist: 99999,
			xdist: 0,
			ydist: 0,
//			kind: 0,
//			index: 0
		};
		var self = {
			x: this.playerStates[this.myCharacter].x,
			y: this.playerStates[this.myCharacter].y
		};

		// choose the apple closet to self
		for(var i = 0; i < this.yApples.length; i+= 2){
			if( choose.dist > Math.abs( Math.pow(self.x - this.yApples[i], 2) - Math.pow(self.y - this.yApples[i+1], 2) ) ){
				choose.dist = Math.abs( Math.pow(self.x - this.yApples[i], 2) - Math.pow(self.y - this.yApples[i+1], 2) );
				choose.xdist = self.x - this.yApples[i];
				choose.ydist = self.y - this.yApples[i+1];
//				choose.kind = 1;
//				choose.index = i;
			}
		}

		for(var i = 0; i < this.gApples.length; i += 2){
			if( choose.dist > Math.abs( Math.pow(self.x - this.yApples[i], 2) - Math.pow(self.y - this.yApples[i+1], 2) ) ){
				choose.dist = Math.abs( Math.pow(self.x - this.yApples[i], 2) - Math.pow(self.y - this.yApples[i+1], 2) );
				choose.xdist = self.x - this.yApples[i];
				choose.ydist = self.y - this.yApples[i+1];
//				choose.kind = 2;
//				choose.index = i;
			}
		}

		// go towards the apple
		if(Math.abs(choose.xdist) > Math.abs(choose.ydist)){
			if(choose.ydist >= 0){
				this.localbuff(2, this.myCharacter, 38); // up
			} else {
				this.localbuff(2, this.myCharacter, 40); // down
			}
		} else {
			if(choose.xdist >= 0){
				this.localbuff(2, this.myCharacter, 37); // left
			} else {
				this.localbuff(2, this.myCharacter, 39); // right
			}
		}
	};

	// judge if can kill. if can kill then how to kill, if can't return 0
	this.cankill = function(killer, victim){
		var res = [];
		if( Math.abs(this.playerStates[killer].x - this.playerStates[victim].x) < images["explosion"].width ){
//			res[0] = 1; // the 
			if(Math.abs(this.playerStates[killer].y - this.playerStates[victim].y) <= images["explosion"].height * bombRange){
				res[0] = 1;
				if(this.playerStates[killer].y > this.playerStates[victim].y){
					res[1] = 38; // fire up
				} else {
					res[1] = 40; // fire down
				}
			} else {
				return (res[0] = 0); // fire down
			}
			return res;
		}

		if( Math.abs(this.playerStates[killer].y - this.playerStates[victim].y) < images["explosion"].height ){
//			res[0] = 2;
			if(Math.abs(this.playerStates[killer].x - this.playerStates[victim].x) <= images["explosion"].width * bombRange){
				res[0] = 2;
				if(this.playerStates[killer].x > this.playerStates[victim].x){
					res[1] = 37;
				} else {
					res[1] = 39;
				}
			} else {
				return (res[0] = 0);
			}
			return res;
		}

		return (res[0] = 0);
	};
}

// === clean fire == //
function cleanFire(x, y, world){
    return function(){

		context.clearRect(x, y,
                          images["explosion"].width,
                          images["explosion"].height);
        var bomb = {
            x: x,
            y: y,
            image: images["explosion"]
        };
        for(k in world.playerStates){
            if(!(k == "elephant" || k == "bird" || k == "cat" || k == "bee"))
                continue;
/*
            var kCharacter = {
                x: world.playerStates[k].x,
                y: world.playerStates[k].y,
                image: images[k]
            };
*/
            if(isOverlapping(world.playerStates[k], bomb)){
                if(world.playerStates[k].heartsNum > 0){
                    world.drawCharacter(k);
                } else {
                    world.clearCharacter(world.playerStates[k]);
                }
            }
        }
    };

}

// === clean apple === //
function cleangApple(self, img){
	return function(){
		var ret = self.isCharacterAt(img, "gApple");
    	if(ret[0] == true) {
    		self.clearCharacter(img);
        	//remove apple positions from gApples
       	 	self.gApples.splice(ret[1], 2);
    	}

		if(self.myCharacter == "elephant"){
            for(k in self.playerCharacters){
                if(!(k == "elephant" || k == "cat" || k == "bee" || k == "bird"))
                    continue;
                
                if(isOverlapping(img, self.playerStates[k])){
                    self.drawCharacter(self.playerStates[k]);
                }
            }
        }

	}
}

function cleanyApple(self, img){
    return function(){
        var ret = self.isCharacterAt(img, "yApple");
        if(ret[0] == true) {
            self.clearCharacter(img);
            //remove apple positions from gApples
         self.yApples.splice(ret[1], 2);
        }

		if(self.myCharacter == "elephant"){
			for(k in self.playerCharacters){
				if(!(k == "elephant" || k == "cat" || k == "bee" || k == "bird"))
					continue;

				if(isOverlapping(img, self.playerStates[k])){
					self.drawCharacter(self.playerStates[k]);
				}
			}
		}
    }
}


// === keyHandler ===//
//  Key press only affects the main character

var keyHandler = {
	init:function() {
		$('html').keydown(function(e){
		    switch(e.which) {
			    case 38: //up
			    case 39: //right
			    case 40: //down
			    case 37: //left
					mainPlayer.localbuff(2, mainCharacter, e.which);
			    break;
			    case 87: // W -> G
					mainPlayer.localbuff(0, mainCharacter, 38);
			    break;
			    case 83: // S -> G
					mainPlayer.localbuff(0, mainCharacter, 40);
			    break;
			    case 65: // A -> Y
					mainPlayer.localbuff(1, mainCharacter, 37);
			    break;
			    case 68: // D -> Y
					mainPlayer.localbuff(1, mainCharacter, 39);
			    break;
			    default:
			    break;
			}
		});

	},
}

function initPositions(player) {
	var offset = 50;
	player.updateCharPosn("elephant", offset, offset);
	player.updatePosnLimit("elephant", 0, moveLimitBy);
	player.drawCharacter("elephant");

	// bird is on the opposite side of main
	var xmax = canvaswidth - images["bird"].width;
	var ymax = canvasheight - images["bird"].height;
	player.updateCharPosn("bird", xmax - offset, offset);
	player.updatePosnLimit("bird", xmax - moveLimitBy, xmax);
	player.drawCharacter("bird");

	ymax = canvasheight - images["cat"].height;
	player.updateCharPosn("cat", offset, ymax - offset);
	player.updatePosnLimit("cat", 0, moveLimitBy);
	player.drawCharacter("cat");

	// bee is one the opposite side of main
	xmax = canvaswidth - images["bee"].width;
	ymax = canvasheight - images["bee"].height;
	player.updateCharPosn("bee", xmax - offset, ymax - offset);
	player.updatePosnLimit("bee", xmax - moveLimitBy, xmax);
	player.drawCharacter("bee");
}

function playGame() {

	/* setup all players skeleton */
	mainPlayer = new GameUI("elephant");
    birdPlayer = new GameUI("bird");
	catPlayer  = new GameUI("cat");
	beePlayer  = new GameUI("bee");
	server     = new GameUI("server");
	
	/* setup all players' ack skeleton */
	mainack = new GameUI("elephantack");
    birdack = new GameUI("birdack");
	catack  = new GameUI("catack");
	beeack  = new GameUI("beeack");

//    	console.log(playersList["bird"].latencyList["elephant"]);

	/* latency infomation initialize */
    latencyList["elephant"] = { "bird": 60, "cat": 50, "bee": 50, "server": 100  };
    latencyList["bird"]     = { "elephant": 60, "cat": 40, "bee": 40, "server": 120  };
    latencyList["cat"]      = { "elephant": 50, "bird": 40, "bee": 60, "server": 90  };
    latencyList["bee"]      = { "elephant": 50, "cat": 60, "bird": 40, "server": 110  };
    latencyList["server"]   = { "elephant": 100, "cat": 90, "bee": 110, "bird": 120  };

/*
    latencyList["elephant"] = { "bird": 10, "cat": 10, "bee": 10, "server": 20  };
    latencyList["bird"]     = { "elephant": 10, "cat": 10, "bee": 10, "server": 20  };
    latencyList["cat"]      = { "elephant": 10, "bird": 10, "bee": 10, "server": 20  };
    latencyList["bee"]      = { "elephant": 10, "cat": 10, "bird": 10, "server": 20  };
    latencyList["server"]   = { "elephant": 20, "cat": 20, "bee": 20, "bird": 20  };
*/
	mainPlayer.drawHearts();
	mainPlayer.drawYbullets();
	mainPlayer.drawGbullets();

	// update bomb info for all worlds
/*	setInterval(function(){drawBombs(mainPlayer);}, bombDrawRate);
	setInterval(function(){drawBombs(mainack);}, bombDrawRate);
	setInterval(function(){drawBombs(birdPlayer);}, bombDrawRate);
	setInterval(function(){drawBombs(birdack);}, bombDrawRate);
	setInterval(function(){drawBombs(catPlayer);}, bombDrawRate);
	setInterval(function(){drawBombs(catack);}, bombDrawRate);
	setInterval(function(){drawBombs(beePlayer);}, bombDrawRate);
	setInterval(function(){drawBombs(beeack);}, bombDrawRate);
	setInterval(function(){drawBombs(server);}, bombDrawRate); // server update bombs
*/
	// === init character positions === //
    initPositions(mainPlayer);
    initPositions(birdPlayer);
    initPositions(catPlayer);
    initPositions(beePlayer);
    initPositions(server);

	// init ack positions
    initPositions(mainack);
    initPositions(birdack);
    initPositions(catack);
    initPositions(beeack);

	// === Real game logic starts === //
	keyHandler.init();


	// generate apples at the server every interval
	//genApple();
	setInterval(genApple, 10000);

	// start AIs
//	setInterval(function(){ birdPlayer.AI_move(); }, genRandom(500, 1000));
//	setInterval(function(){ catPlayer.AI_move(); }, genRandom(500, 1000));
//	setInterval(function(){ beePlayer.AI_move(); }, genRandom(500, 1000));

	// refresh with interval
/*	setInterval(function(){ synchAck(mainack);}, 100);
	setInterval(function(){ synchAck(birdack);}, 100);
	setInterval(function(){ synchAck(catack);}, 100);
	setInterval(function(){ synchAck(beeack);}, 100);
*/
}

function sendgApples(coord){
	setTimeout( function(){ mainPlayer.drawGreenApple(coord); }, latencyList["server"].elephant);//latencyList["server"].elephant);
    setTimeout( function(){ mainack.drawGreenApple(coord); }, latencyList["server"].elephant);
    setTimeout( function(){ birdPlayer.drawGreenApple(coord); }, latencyList["server"].bird);
    setTimeout( function(){ birdack.drawGreenApple(coord); }, latencyList["server"].bird);
    setTimeout( function(){ catPlayer.drawGreenApple(coord); }, latencyList["server"].cat);
    setTimeout( function(){ catack.drawGreenApple(coord); }, latencyList["server"].cat);
    setTimeout( function(){ beePlayer.drawGreenApple(coord); }, latencyList["server"].bee);
    setTimeout( function(){ beeack.drawGreenApple(coord); }, latencyList["server"].bee);
}

function sendyApples(coord){
	setTimeout( function(){ mainPlayer.drawYellowApple(coord); }, latencyList["server"].elephant);
    setTimeout( function(){ mainack.drawYellowApple(coord); }, latencyList["server"].elephant);
    setTimeout( function(){ birdPlayer.drawYellowApple(coord); }, latencyList["server"].bird);
    setTimeout( function(){ birdack.drawYellowApple(coord); }, latencyList["server"].bird);
    setTimeout( function(){ catPlayer.drawYellowApple(coord); }, latencyList["server"].cat);
    setTimeout( function(){ catack.drawYellowApple(coord); }, latencyList["server"].cat);
    setTimeout( function(){ beePlayer.drawYellowApple(coord); }, latencyList["server"].bee);
    setTimeout( function(){ beeack.drawYellowApple(coord); }, latencyList["server"].bee);
}

// let the server generate apples
function genApple(){
	// generate apples and put into server
	for(i=0; i < 10; ++i) {
        var coord = server.getRandomAppleLocation();
        if(coord.length > 0) {
            server.drawGreenApple(coord);
        }

        coord = server.getRandomAppleLocation();
        if(coord.length > 0) {
            server.drawYellowApple(coord);
        }
    }
	
	// insert these apples into other player's ack world
	for(i= 0; i < server.gApples.length; i += 2){
		var coord = [];
		coord[0] = server.gApples[i];
		coord[1] = server.gApples[i+1];
		sendgApples(coord);
	}

	for(i= 0; i < server.yApples.length; i++){
		var coord = [];
		coord[0] = server.yApples[i];
		coord[1] = server.gApples[i+1];
		sendyApples(coord)
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

// synchronize world states: ack and prediction
function synchAck(world){

	if(world.pending_k1 == 0 && world.pending_k2 == 0) 
		return;

 	// synchronize with prediction copy
	if( world.myCharacter == "elephantack" ){
    	synchronize(mainack, mainPlayer);
    } else if( world.myCharacter == "birdack" ){
        synchronize(birdack, birdPlayer);
    } else if( world.myCharacter == "catack" ){
        synchronize(catack, catPlayer);
    } else {
        synchronize(beeack, beePlayer);
    }
    
    world.pending_k1 = 0;
    world.pending_k2 = 0;
}

// synchronize world states: ack and prediction
function synchronize(ackworld, predworld){
	// delete acked events in predworld local buffer
	for(var i = 0; i < ackworld.localbuffer.length; i++)
		predworld.findclearbuff(ackworld.localbuffer[i]);

	// clean ackworld's local buffer
	ackworld.localbuffer.splice(0, ackworld.localbuffer.length);

	// synchronize the position & apple || now not synchronizing bombList
	predworld.synchStates(ackworld);

	// if predworld's local buffer is not empty, need to go on rendering.
	if( predworld.localbuffer.length > 0 ){
		predworld.run();	// go on rendering stuff and stuck at certain point.
	}
}

// return random number in range: [a, b]
function genRandom(a, b){
    return (Math.floor(Math.random() * (b - a + 1)) + a);
}

