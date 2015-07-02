//
// main.js
//

// Global variables
var canvas, context;
var width;
var canvaswidth, canvasheight
var numcells;
var images = new Array(5); // 5 images total

// Global variables for input
var main_coord_x, main_coord_y;
var draw_context;
var fire_range = 3;
var world_state = new Array(2);	// 2 world_states to reserve local and central's world_state. 

function drawCharacter(image, r, c, color) {
        context.drawImage(image, r, c, width, width);
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
	main_coord_x = main_coord_y = main_coord;
    drawCharacter(images[0], main_coord, main_coord, "green");
    drawCharacter(images[2], main_coord-width*2, main_coord-width*2, "red"); //test
    return;
}

function pageLoaded(){
	// Draw background grid
	drawBackground();
	
    // Image loading
	imageLoader.load("images/img_me1.png");
	imageLoader.load("images/img_me2.png");
    imageLoader.load("images/img_enemy1.png");
    imageLoader.load("images/img_enemy2.png");
}

function drawBackground(){
	// Get a handle to the canvas object
	canvas = document.getElementById('testcanvas');
	// Get the 2d context for this canvas
	draw_context = context = canvas.getContext('2d');

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
}

/* Writen By Haibo Bian */

// init function 
function init(){
	//load page
	pageLoaded();
	
	//initiate listener for user input
	// move action
	document.onkeydown = function(event){
		//alert(event.keyCode);
		move(images[0], main_coord_x, main_coord_y, "green", event.keyCode);
	}
	
	// fire action
	document.onmousedown = function(event) {
		//alert("fire");
		fire(main_coord_x, main_coord_y, "green");
	}
	
	document.onmouseup=function(){
		//alert("fire");
		ceaseFire(main_coord_x, main_coord_y);
	}
	//initiate AI enemies to move
	
}

// erease character
function clearCharacter(image, r, c) {
    context.clearRect( r, c, width, width);
}

// move character
function move(image, r, c, color, direction) {
	// clear original Image
	clearCharacter(image, r, c);

	// draw New Image
	// update new coordinate
	switch(direction){
		case 87:		//Up
			main_coord_y -= width;
			break;
		case 83:		//Down
			main_coord_y += width;
			break;
		case 65:		//Left
			main_coord_x -= width;
			break;
		case 68:		//Right
			main_coord_x += width;
			break;
	}
	
	// draw new image
	drawCharacter(image, main_coord_x, main_coord_y, "green");
	drawBackground();
}

// draw the fire range
function fire(r, c, color){
	if(color === "green") {
	        context.fillStyle = "rgba(0,255,0,0.4)";
	} else if (color === "red") {
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

// erase the fire range
function ceaseFire(r, c){

	//left
	context.clearRect(r-width*2, c, width*2, width);
	//top
	context.clearRect(r, c-width*2, width, width*2);
	//right
	context.clearRect(r+width, c, width*2, width);
	//bottom
	context.clearRect(r, c+width, width, width*2);
	
	drawBackground();	
}

/* Data Structures for calculating and judging */
/*
// player position
var position{
	x = 0;
	y = 0;
	set:function(pos_x,pos_y){
		this.x = pos_x;
		this.y = pos_y;
	}
}

// player death log
var death_log{
	death_time  = 0;
	death_times = 0;
	add_death:function(time){
		this.death_time = time;
		this.death_times++;
	}
	have_ever_died:function(){
		if(this.death_times == 0)
			return false;
		return true;
	}
}

// world_state
var world_state{
	player_num = 0;
	player_pos = [];
	player_logs = [];
	init:function(num){
		this.player_num = num;
		var i;
		for( i = 0; i < num; i++ ){
			this.player_pos.push({
				x: random();
				y: random();
			});
			this.player_logs.push({
				death_time:  0;
				death_times: 0;
			})
		}
	}
}
*/

