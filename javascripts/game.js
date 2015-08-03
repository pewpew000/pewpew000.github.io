//
// main.js
//

// Global variables for drawing
var canvas, context;
var width;
var canvaswidth, canvasheight
var numcells;
var images = new Array(10); // 10 images total

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

function playGame() {

}

function pageLoaded(){	
    // Image loading
	imageLoader.load("images/pinkbird.png");
	imageLoader.load("images/bluebird.png");
    imageLoader.load("images/yellowball.png");
    imageLoader.load("images/greenball.png");
    imageLoader.load("images/yellowapple.png");
    imageLoader.load("images/greenapple.png");
    imageLoader.load("images/elephant.png");
    imageLoader.load("images/cat.png");
    imageLoader.load("images/bee.png");
    imageLoader.load("images/explosion.png");
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
			pageLoaded();
		});

		$(function () {
		   function runIt() {
		      $('#birdfront').animate({top: '+=20'},{duration: 250})
		               .animate({top: '-=20'},{duration: 150})
		               .animate({top: '+=20'},{duration: 250})
		               .animate({top: '-=20'},{duration: 150})
		               .delay(1200).show("#birdfront", runIt);
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

