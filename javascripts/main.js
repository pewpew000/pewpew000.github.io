//
// main.js
//

// Gloabal variables
var canvas, context;
var width;
var canvaswidth, canvasheight
var numcells;
var images = new Array(5); // 5 images total

function drawCharacter(image, r, c, color) {
        context.drawImage(image, r, c, width, width);
        if(color === "green") {
	        context.fillStyle = "rgba(0,255,0,0.4)";
	    }
	    else if (color === "red") {
	    	context.fillStyle = "rgba(255,0,0,0.4)";
	    }
		//left
		context.fillRect(r-width*2, c, width*2, width);
		//top
		context.fillRect(r, c-width*2, width, width*2);
		//right
		context.fillRect(r+width, c, width*2, width);
		//bottom
		context.fillRect(r, c+width, width, width*2);
}

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

function playGame() {
    // Draw characters
    var main_coord = Math.floor(numcells/2)*width;
    drawCharacter(images[0], main_coord, main_coord, "green");
    drawCharacter(images[2], main_coord-width*2, main_coord-width*2, "red"); //test
    return;
}

function pageLoaded(){
	// Get a handle to the canvas object
	canvas = document.getElementById('testcanvas');
	// Get the 2d context for this canvas
	context = canvas.getContext('2d');

	// Get information from the document
    canvaswidth = canvas.getAttribute('width');
    canvasheight = canvas.getAttribute('height');

	numcells = 11; // Looks better when it's an odd number
    width = canvaswidth / numcells; //assume this is also height

    // Drawing lines dividing the canvas
    var i;
	context.beginPath();
	for(i=0; i < canvaswidth/numcells; ++i) {
		context.moveTo(i*width,0);
		context.lineTo(i*width, canvasheight);
		context.moveTo(0,i*width);
		context.lineTo(canvaswidth, i*width);
	}
	context.closePath();
	context.stroke();

    // Image loading
	imageLoader.load("images/img_me1.png");
	imageLoader.load("images/img_me2.png");
    imageLoader.load("images/img_enemy1.png");
    imageLoader.load("images/img_enemy2.png");
}
