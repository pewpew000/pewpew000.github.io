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
var player_num = 5;
var player_score = 0;
var player_death = 0;
var dead = [];
var enemies = [];

// Global variables for background policies
var player_latency;
var player_fluct;
var speculation_deg_0;	// for bonus action
var speculation_deg_1;	// for fire action
var speculation_deg_2;	// for move action


// Global Variables for experiment
var p_time = new Date();
var rollbacks;
var latency;
var latency_among;
var action_num;
var c_sequencer = [];	// array for central sequencer
var l_sequencer = [];	// array for local sequencer
var received_wstates = [];	// array for world states received from central
var pointer_now;	//pointer to proceed and draw stuff.
//var myWorker = new Worker("worker.js");

// Global Variables for countDown
var play_time = 61;

// Global Variables for speculation
var speculation_k1;
var speculation_k2;
var speculating;
var actions = [];

// === functions for score board === //
// count down function
function myCountDown() {
    if(play_time == 0){
		//alert("time up, your grade is "+(player_score-player_death));
		return;
	}
	play_time -= 1;
    document.getElementById("countDown").innerHTML = play_time;
}
// update death
function update_death(){
	document.getElementById("myDeath").innerHTML = player_death;
}
// update score
function update_score(){
	document.getElementById("myScore").innerHTML = player_score;
}

// === functions for drawing === //
// draw character
function drawCharacter(image, r, c) {
        context.drawImage(image, r, c, width, width);
}

// erase character
function clearCharacter(image, r, c) {
    context.clearRect( r, c, width, width);
}

// draw all players
function drawPlayers(num){
	var i;
	for( i = 1; i < player_num; i++ ){
		if( i == num ) continue;
		if(!dead[i])
			context.drawImage(images[2], main_coord_x + width*world_states[0].player_pos[i].x, main_coord_y + width*world_states[0].player_pos[i].y, width, width);
	}
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

// move character and update data
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
	drawPlayers(player);
}

// judge if killed
function killed( player, tokill ){
	if( dead[tokill] || dead[player] ) return false;
	if( world_states[0].player_pos[tokill].y == world_states[0].player_pos[player].y && Math.abs(world_states[0].player_pos[tokill].x - world_states[0].player_pos[player].x) < fire_range ){
		return true;
	}
	if( world_states[0].player_pos[tokill].x == world_states[0].player_pos[player].x && Math.abs(world_states[0].player_pos[tokill].y - world_states[0].player_pos[player].y) < fire_range ){
		return true;
	}
	return false;
}

// judge and kill
function try_killed( player, tokill ){
	if( dead[tokill] || dead[player] ) return false;
	if( world_states[0].player_pos[tokill].y == world_states[0].player_pos[player].y && Math.abs(world_states[0].player_pos[tokill].x - world_states[player].player_pos[player].x) < fire_range ){
		fire(main_coord_x+width*world_states[0].player_pos[player].x, main_coord_y+width*world_states[0].player_pos[player].y, "red", player);
		return true;
	}
	if( world_states[0].player_pos[tokill].x == world_states[0].player_pos[player].x && Math.abs(world_states[0].player_pos[tokill].y - world_states[player].player_pos[player].y) < fire_range ){
		fire(main_coord_x+width*world_states[0].player_pos[player].x, main_coord_y+width*world_states[0].player_pos[player].y, "red", player);
		return true;
	}
	return false;
}

// reborn to update state
function reborn( the_dead ){
	return function() { dead[the_dead] = 0 };
}

// draw the fire range and calculate points
function fire(r, c, color, player){
	// draw fire range
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
	
	// update world_state
	
	var i;
	for( i = 0; i < player_num; i++ ){
		
		if( i == player ) continue;
		if( killed(player, i) ){
			//player_score++;
			dead[i] = 1;
			setTimeout( reborn(i), 3000);
			if(i == 0){
				player_death++;
				update_death();
			} else if(player == 0){
				player_score++;
				update_score();
			}
		}
	}
	
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

// === actions === //
function event(time, player, act){
	this.time = time;
	this.player = player;
	this.action = act;
}

// ###########################
// ==world_state== //
function world_state(){
	this.player_num = 0;
	this.player_pos = [];
	this.player_logs = [];
}

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

// ===AI enemy=== //
function AI_Enemy(AI_num){
	this.num = AI_num;
}

AI_Enemy.prototype.start = function(num){
	setInterval(AI_move(num), 500);
}

function AI_move( i ){
	return function(){
		if( killed(i, 0) ){
			// kill player
			fire(main_coord_x+width*world_states[0].player_pos[i].x, main_coord_y+width*world_states[0].player_pos[i].y, "red", i);
			//insert action into local l_sequencer
			push_to_local(p_time.getTime() + Math.floor(Math.random() * 60) + latency_among, i, 0);
			//insert action into central s_sequencer
			push_to_central(p_time.getTime() + Math.floor((Math.random() * 60)) + latency, i, 0);
		} else { //chase player
			chase(i, 0);
		}
	}
}

// let enemy chase player
function chase(chaser, chased){
	if(dead[chaser]) return;
	if(world_states[0].player_pos[chaser].x == world_states[0].player_pos[chased].x){
		if(world_states[0].player_pos[chaser].y > world_states[0].player_pos[chased].y){
			//world_states[0].player_pos[chaser].y -= 1;
			move(images[2], main_coord_x + width * world_states[0].player_pos[chaser].x, main_coord_y + width * world_states[0].player_pos[chaser].y, chaser, 87);
			//insert action into local l_sequencer
			push_to_local(p_time.getTime() + Math.floor(Math.random() * 60) + latency_among, chaser, 87);
			//insert action into central s_sequencer
			push_to_central(p_time.getTime() + Math.floor((Math.random() * 60)) + latency, chaser, 87);
		} else {
			move(images[2], main_coord_x + width * world_states[0].player_pos[chaser].x, main_coord_y + width * world_states[0].player_pos[chaser].y, chaser, 83);
			//insert action into local l_sequencer
			push_to_local(p_time.getTime() + Math.floor(Math.random() * 60) + latency_among, chaser, 83);
			//insert action into central s_sequencer
			push_to_central(p_time.getTime() + Math.floor((Math.random() * 60)) + latency, chaser, 83);
		}
		return;
	}
	if(world_states[0].player_pos[chaser].y == world_states[0].player_pos[chased].y){
		if(world_states[0].player_pos[chaser].x > world_states[0].player_pos[chased].x){
			//world_states[0].player_pos[chaser].x -= 1;
			move(images[2], main_coord_x + width * world_states[0].player_pos[chaser].x, main_coord_y + width * world_states[0].player_pos[chaser].y, chaser, 65);
			//insert action into local l_sequencer
			push_to_local(p_time.getTime() + Math.floor(Math.random() * 60) + latency_among, chaser, 65);
			//insert action into central s_sequencer
			push_to_central(p_time.getTime() + Math.floor((Math.random() * 60)) + latency, chaser, 65);
		} else {
			//world_states[0].player_pos[chaser].x += 1;
			move(images[2], main_coord_x + width * world_states[0].player_pos[chaser].x, main_coord_y + width * world_states[0].player_pos[chaser].y, chaser, 68);
			//insert action into local l_sequencer
			push_to_local(p_time.getTime() + Math.floor(Math.random() * 60) + latency_among, chaser, 68);
			//insert action into central s_sequencer
			push_to_central(p_time.getTime() + Math.floor((Math.random() * 60)) + latency, chaser, 68);
		}
		return;
	}
	switch( Math.floor(Math.random() * (2)) ){
		case 1:
			if(world_states[0].player_pos[chaser].x > world_states[0].player_pos[chased].x){
				//world_states[0].player_pos[chaser].x -= 1;
				move(images[2], main_coord_x + width * world_states[0].player_pos[chaser].x, main_coord_y + width * world_states[0].player_pos[chaser].y, chaser, 65);
				//insert action into local l_sequencer
				push_to_local(p_time.getTime() + Math.floor(Math.random() * 60) + latency_among, chaser, 65);
				//insert action into central s_sequencer
				push_to_central(p_time.getTime() + Math.floor((Math.random() * 60)) + latency, chaser, 65);
			} else {
				//world_states[0].player_pos[chaser].x += 1;
				move(images[2], main_coord_x + width * world_states[0].player_pos[chaser].x, main_coord_y + width * world_states[0].player_pos[chaser].y, chaser, 68);
				//insert action into local l_sequencer
				push_to_local(p_time.getTime() + Math.floor(Math.random() * 60) + latency_among, chaser, 68);
				//insert action into central s_sequencer
				push_to_central(p_time.getTime() + Math.floor((Math.random() * 60)) + latency, chaser, 68);
			}
			return;
		case 0:
			if(world_states[0].player_pos[chaser].y > world_states[0].player_pos[chased].y){
				//world_states[0].player_pos[chaser].y -= 1;
				move(images[2], main_coord_x + width * world_states[0].player_pos[chaser].x, main_coord_y + width * world_states[0].player_pos[chaser].y, chaser, 87);
				//insert action into local l_sequencer
				push_to_local(p_time.getTime() + Math.floor(Math.random() * 60) + latency_among, chaser, 87);
				//insert action into central s_sequencer
				push_to_central(p_time.getTime() + Math.floor((Math.random() * 60)) + latency, chaser, 87);
			} else {
				//world_states[0].player_pos[chaser].y += 1;
				move(images[2], main_coord_x + width * world_states[0].player_pos[chaser].x, main_coord_y + width * world_states[0].player_pos[chaser].y, chaser, 83);
				//insert action into local l_sequencer
				push_to_local(p_time.getTime() + Math.floor(Math.random() * 60) + latency_among, chaser, 83);
				//insert action into central s_sequencer
				push_to_central(p_time.getTime() + Math.floor((Math.random() * 60)) + latency, chaser, 83);
			}
			return;
	}
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

// === functions for different models === //
// sort function
function my_sort(a, b){
	return a.time - b.time;
}

// insert actions into local l_sequencer
function push_to_local(time, player, action){
	l_sequencer.push( new event(time, player, action) );
	l_sequencer.sort(my_sort);
}

// insert actions into local l_sequencer
function push_to_central(time, player, action){
	c_sequencer.push( new event(time, player, action) );
	c_sequencer.sort(my_sort);
}

// === functions for bounded-eventual consistency models === //
// to locally apply or block
function start_speculate( act ){
	// push to local action array
	
	// add latency and push to central array
	
	// decide to locally apply or block
	
	// update speculating value
	
	// calculate and 
	
	// this is the example to use array array.splice(indexToRemove, numberToRemove);
}

// to compare world state with central and redraw if different
function sync(){
	//compare world_states
	
	//redraw if world_states are different
	
}


// ============================================ init function ============================== // 
function init(){

	// ================== init world_state data =============== //
	world_states[0] = new world_state();
	world_states[0].init(player_num);
	world_states[1] = (JSON.parse(JSON.stringify(world_states[0]))); //cloneobject isn't working well :(
	var i = 0;
	for( ; i < player_num; i++ ){
		dead.push(0);
	}
	
	
	// =================== load page ===================== //
	pageLoaded();
	
	// ======== initiate listener for user input========== //
	// move action
	document.onkeydown = function(event){
		//alert(event.keyCode);
		move(images[0], main_coord_x+width*world_states[0].player_pos[0].x, main_coord_y+width*world_states[0].player_pos[0].y, 0, event.keyCode);
		//insert action into local l_sequencer
		push_to_local(p_time.getTime(), 0, event.keyCode);
		//insert action into central s_sequencer
		push_to_central(p_time.getTime() + Math.floor((Math.random() * 60)) + latency, 0, event.keyCode);
	}
	
	// fire action
	document.onmousedown = function(event) {
		fire(main_coord_x+width*world_states[0].player_pos[0].x, main_coord_y+width*world_states[0].player_pos[0].y, "green", 0);
		//insert action into local l_sequencer
		push_to_local(p_time.getTime(), 0, event.keyCode);
		//insert action into central s_sequencer
		push_to_central(p_time.getTime() + Math.floor((Math.random() * 60)) + latency, 0, event.keyCode);
	}
	
	document.onmouseup=function(){
		ceaseFire(main_coord_x+width*world_states[0].player_pos[0].x, main_coord_y+width*world_states[0].player_pos[0].y);
	}
	
	// ======= initiate AI enemies to move =============== //
	// start all AI enemies
	for( i = 1; i < player_num; i++ ){
		enemies.push( new AI_Enemy(i) );
		enemies[i-1].start(i);
	}
	// =========== initiate Background calculation ==========//
	/*
		myWorker is staic for posting actions.
	*/
	
	// =========== choose/set speculation level ==========//
	
	
	// ================== start timer ===================== //
	var timeCountDown = setInterval(function(){myCountDown()},1000);
	update_death();
	update_score();
	
	// ======= collect useful game data ============ //
	
}

