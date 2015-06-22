//
// main.js
//

function pageLoaded(){
	// Get a handle to the canvas object
	var canvas = document.getElementById('testcanvas');
	// Get the 2d context for this canvas
	var context = canvas.getContext('2d');

	// Get information from the document
    var canvaswidth = canvas.getAttribute('width');
    var canvasheight = canvas.getAttribute('height');
	var i, numcells = 8;
    var width = canvaswidth / numcells;

    // Drawing lines dividing the canvas
	context.beginPath();
	for(i=0; i < canvaswidth/numcells; ++i) {
		context.moveTo(i*width,0);
		context.lineTo(i*width, canvasheight);
		context.moveTo(0,i*width);
		context.lineTo(canvaswidth, i*width);
	}
	context.closePath();
	context.stroke();
}
