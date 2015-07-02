//
// main.js
//

// Global variables for drawing
var canvas, context;
var width;
var canvaswidth, canvasheight
var numcells;
var images = new Array(5); // 5 images total

// Global variables for input and calculating
var main_coord_x, main_coord_y;
var draw_context;
var fire_range = 3;
var world_states = new Array(2);	// 2 world_states to reserve local and central's world_state. 
var player_num = 6;


function drawCharacter(image, r, c) {
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
	var i;
    var main_coord = Math.floor(numcells/2)*width;
	main_coord_x = main_coord_y = main_coord;
	drawCharacter(images[0], main_coord_x + width * world_states[0].player_pos[0].x, main_coord_y + width * world_states[0].player_pos[0].y);
	for( i = 1; i < player_num; i++ ){
		drawCharacter(images[2], main_coord_x + width * world_states[0].player_pos[i].x, main_coord_y + width * world_states[0].player_pos[i].y); 
	}
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

// erease character
function clearCharacter(image, r, c) {
    context.clearRect( r, c, width, width);
}

// move character
function move(image, r, c, player, direction) {
	
	// draw New Image
	// update new coordinate
	switch(direction){
		case 87:		//Up
			if( world_states[0].player_pos[player].y > -5 ){
				clearCharacter(image, r, c);
				world_states[0].player_pos[player].y -= 1;
			}
			break;
		case 83:		//Down
			if( world_states[0].player_pos[player].y < 5 ){
				clearCharacter(image, r, c);
				world_states[0].player_pos[player].y += 1;
			}
			break;
		case 65:		//Left
			if( world_states[0].player_pos[player].x > -5 ){
				clearCharacter(image, r, c);
				world_states[0].player_pos[player].x -= 1;
			}
			break;
		case 68:		//Right
			if( world_states[0].player_pos[player].x < 5 ){
				clearCharacter(image, r, c);
				world_states[0].player_pos[player].x += 1;
			}
			break;
		default:
			return;
	}
	
	// draw new image
	drawCharacter(image, main_coord_x+width*world_states[0].player_pos[player].x, main_coord_y+width*world_states[0].player_pos[player].y);
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

/* ===================Data Structures for calculating and judging==================== */

// == player position == //
function position(pos_x, pos_y){
	this.x = pos_x;
	this.y = pos_y;
}
/*
// copy constructor
function position(other){
	this.x = other.x;
	this.y = other.y;
}
*/
// set new position
position.prototype.set = function(pos_x, pos_y){
	this.x = pos_x;
	this.y = pos_y;
}
// #########################

// == player death log == //
function death_log(){
	this.death_time  = 0;
	this.death_times = 0;
}
/*
// copy constructor
function death_log(other){
	this.death_time = other.death_time;
	this.death_time = other.death_times;
}
*/
// add death
death_log.prototype.add_death = function(time){
	this.death_time = time;
	this.death_times++;
}
// check if has died
death_log.prototype.have_ever_died = function(){
	if(this.death_times == 0)
			return false;
	return true;
}

// ##########################

// ==world_state== //
function world_state(){
	this.player_num = 0;
	this.player_pos = [];
	this.player_logs = [];
}
/*
// copy constructor
function world_state(other){
	var i;
	this.player_num = other.player_num;
	this.player_pos = [];
	this.player_logs = [];
	for( i = 0; i < this.player_num; i++ ){
		player_pos.push( new position(other.player_pos[i]) );
		player_logs.push( new death_log() );
	}
}
*/
// world_state init
world_state.prototype.init = function(num){
	this.player_num = num;
	var i;
	for( i = 0; i < num; i++ ){
		this.player_pos.push(new position(Math.floor((Math.random() * 10)) - 5, Math.floor((Math.random() * 10)) - 5)); 
		this.player_logs.push(new death_log());
	}
}

// world_state apply event

// world_state print 
world_state.prototype.print = function(num){
	return this.player_pos[num].x;
}

// ############################
function cloneObject(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
 
    var temp = obj.constructor(); // give temp the original obj's constructor
    for (var key in obj) {
        temp[key] = cloneObject(obj[key]);
    }
 
    return temp;
}

// ============================================ init function ============================== // 
function init(){

	// ================== init world_state =============== //
	world_states[0] = new world_state();
	world_states[0].init(player_num);
	world_states[1] = (JSON.parse(JSON.stringify(world_states[0]))); //cloneobject isn't working well :(

	// =================== load page ===================== //
	pageLoaded();
	
	// ======== initiate listener for user input========== //
	// move action
	document.onkeydown = function(event){
		//alert(event.keyCode);
		move(images[0], main_coord_x+width*world_states[0].player_pos[0].x, main_coord_y+width*world_states[0].player_pos[0].y, 0, event.keyCode);
	}
	
	// fire action
	document.onmousedown = function(event) {
		fire(main_coord_x+width*world_states[0].player_pos[0].x, main_coord_y+width*world_states[0].player_pos[0].y, "green");
	}
	
	document.onmouseup=function(){
		ceaseFire(main_coord_x+width*world_states[0].player_pos[0].x, main_coord_y+width*world_states[0].player_pos[0].y);
	}
	
	// ======= initiate AI enemies to move =============== //
	
}

