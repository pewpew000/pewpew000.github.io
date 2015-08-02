//
// main.js
//

// Global variables for drawing
var canvas, context;
var width;
var canvaswidth, canvasheight
var numcells;
var images = new Array(5); // 5 images total

var imageLoader = {
	loaded:true,
    loadedImages:0,
    totalImages:0,
    load:function(url){
    	this.loaded = false;
    	var image = new Image();
    	image.src = url;
    	images[this.totalImages] = image;
    	this.totalImages++;
    	image.onload = function() {
    		imageLoader.loadedImages++;
    		if(imageLoader.loadedImages === imageLoader.totalImages) {
    			imageLoader.loaded = true;
    			playGame();
    		}
    	}
    }
}

function pageLoaded(){
	// Draw background grid
	//drawBackground();
	
    // Image loading
	imageLoader.load("images/pinkbird.png");
	imageLoader.load("images/bluebird.png");
    imageLoader.load("images/ball.png");
    imageLoader.load("images/greenball.png");
    imageLoader.load("images/elephant.png");
    imageLoader.load("images/cat.png");
    imageLoader.load("images/bee.png");
    imageLoader.load("images/explosion.png");
}

var game= {
	init: function(){
		$('.gamelayer').hide();
		$('#titlescreen').show();
		$('#loading').hide();
		$('#startgame').hide();
		for(i = 0; i < 2; i++){
			$('#birdfront').animate({top: '+=20'},{duration: 250});
			$('#birdfront').animate({top: '-=20'},{duration: 150});
		}
		setTimeout(function() { $('#startgame').show() }, 700);
	}
}

var sound= new Audio();
sound.src = "sound/background.mp3"
//sound.play();

// ============================================ init function ============================== // 
function initgame(){

	game.init();
	// =================== load page ===================== //
	
	pageLoaded();
	
}

