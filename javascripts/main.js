//
// main.js
//

// Gloabal variables
var canvas, context;
var width;
var canvaswidth, canvasheight
var numcells;
var img_me1;

function drawMainCharacter(r, c) {
        context.drawImage(img_me1, r, c, width, width);
		context.fillStyle = "rgba(0,255,0,0.6)";
		//left
		context.fillRect(r-width, c, width, width);
		//top
		context.fillRect(r, c-width, width, width);
		//right
		context.fillRect(r+width, c, width, width);
		//bottom
		context.fillRect(r, c+width, width, width);
}

function pageLoaded(){
	// Get a handle to the canvas object
	canvas = document.getElementById('testcanvas');
	// Get the 2d context for this canvas
	context = canvas.getContext('2d');

	// Get information from the document
    canvaswidth = canvas.getAttribute('width');
    canvasheight = canvas.getAttribute('height');

	numcells = 9;
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

	// Draw the main character
	img_me1 = new Image();
	img_me1.onload = function() {
        //Main character
        var main_row_coord = Math.floor(numcells/2)*width;
        var main_col_coord = Math.floor(numcells/2)*width;
		drawMainCharacter(main_row_coord, main_col_coord);
	}
	img_me1.src = "images/img_me1.png";
	
}
