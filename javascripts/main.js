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
var world_states = new Array(3);	// 2 world_states to reserve local and central's world_state. 
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
var latency_to_centr_e;	// latency for enemies to central
var latency_to_player;	//	latency among other enemies and player
var latency_to_centr_l;	//	latency between player to central
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
function drawPlayers( world_state ){
////	var i;
	context.clearRect(0, 0, canvas.width, canvas.height);
	drawBackground();
	for(var i = 0; i < 5; i++ ){
		if(!world_state.ifdead(i)) {
			if( i != 0 ){
				context.drawImage(images[2], main_coord_x + width*world_states[0].player_pos[i].x, main_coord_y + width*world_states[0].player_pos[i].y, width, width);
//				ceaseFire(main_coord_x + width*world_states[0].player_pos[i].x, main_coord_y + width*world_states[0].player_pos[i].y);
			} else {
				context.drawImage(images[0], main_coord_x + width*world_states[0].player_pos[i].x, main_coord_y + width*world_states[0].player_pos[i].y, width, width);
//				clearCharacter(images[0], main_coord_x + width*world_states[0].player_pos[i].x, main_coord_y + width*world_states[0].player_pos[i].y);
//				ceaseFire(main_coord_x + width*world_states[0].player_pos[i].x, main_coord_y + width*world_states[0].player_pos[i].y);
			}
		}
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

position.prototype.setx = function(pos_x) {
	this.x = pos_x;
}

position.prototype.sety = function(pos_y) {
	this.y = pos_y;
}

// return postion
position.prototype.getx = function(){
	return this.x;
}

position.prototype.gety = function(){
	return this.y;
}

// #########################

// == player death log == //
function death_log(){
//	this.death_time  = 0;
	this.death_times = 0;
}

// add death
death_log.prototype.add_death = function(){
//	this.death_time = time;
	this.death_times++;
}
// check if has died
death_log.prototype.have_ever_died = function(){
	if(this.death_times == 0)
			return false;
	return true;
}
// check how many times has dead
death_log.prototype.getdtimes = function(){
	return this.death_times;
}

death_log.prototype.setdtimes = function(times) {
	death_times = times;
}
// ##########################

// === actions === //
function event(time, player, act){
	this.time = time;
	this.player = player;
	this.action = act;
}

// get player
event.prototype.getplayer = function(){
	return this.player;
}

// get action
event.prototype.getaction = function() {
	return this.action;
}

// ###########################
// ==world_state== //
function world_state( num ){
	this.player_num = num;
	this.player_pos = new Array(num);
	this.player_logs = new Array(num);
	this.dead = new Array(num);
}

// get player_num
world_state.prototype.getpnum = function(){
	return this.player_num;
}

// world_state copy
world_state.prototype.initcopy = function(other){
	this.player_num = other.getpnum();
	for( var i = 0; i < other.getpnum(); i++ ){
		this.player_pos[i] = new position(other.getx(i), other.gety(i));
		this.player_logs[i] = new death_log();
		this.dead[i] = other.ifdead(i);
	}
}

// world_state copy
world_state.prototype.copy = function(other){
	this.player_num = other.getpnum();
	for( var i = 0; i < other.getpnum(); i++ ){
		this.player_pos[i].set(other.getx(i), other.gety(i));//.push( new position(other.getx(i), other.gety(i)) );
		this.player_logs[i].setdtimes(other.getlog(i));//.push( new death_log() );
		this.dead[i] = other.ifdead(i);
	}
}

// world_state init
world_state.prototype.init = function(){
//	this.player_num = num;
//	var i;
	for(var i = 0; i < this.player_num; i++ ){
		this.player_pos[i] = new position(Math.floor((Math.random() * 10)) - 5, Math.floor((Math.random() * 10)) - 5); 
		this.player_logs[i] = new death_log();
		this.dead[i] = 0;
	}
}

// return certain player's info
world_state.prototype.getlog = function(player){
	return this.player_logs[player].getdtimes();
}

world_state.prototype.getx = function(player){
	return this.player_pos[player].getx();
}

world_state.prototype.gety = function(player){
	return this.player_pos[player].gety();
}

world_state.prototype.ifdead = function(player) {
	return this.dead[player];
}

// world_state apply event
world_state.prototype.apply = function(player, action){
	if(dead[player]) return;
	switch(action){
		case 87:	//Up
			if(this.player_pos[player].y > -5)
				this.player_pos[player].y -= 1;
			break;
		case 83:	//Down
			if(this.player_pos[player].y < 5)
				this.player_pos[player].y += 1;
			break;
		case 65:	//Left
			if(this.player_pos[player].x > -5)
				this.player_pos[player].x -= 1;
			break;
		case 68:	//Right
			if(this.player_pos[player].x < 5)
				this.player_pos[player].x += 1;
			break;
		default:	//Fire
			for(var i = 0; i < player_num; i++){
				if(i == player) continue;
				if( killed(player, i, 1) ){
					this.dead[i] = 1;
					setTimeout( this.reborn(i), 3000 );
				}
			}
			break;
	}
}

// apply actions until some degree
world_state.prototype.consapply = function( sequence, degree ) {
	for( var i = 0; i < degree && i < sequence.length; i++ )
		this.apply( sequence[i] );
}

// reborn to update state
world_state.prototype.reborn = function( the_dead ){
	return function() { dead[the_dead] = 0 };
}

// synch function
world_state.prototype.synch = function (other, player, action){
// synchronize the world states
	if( this.getx(player) != other.getx(player) )
		this.player_pos[player].setx( other.getx(player) );
	if( this.gety(player) != other.gety(player) )
		this.player_pos[player].sety( other.gety(player) );

	if( this.getlog(player) != other.getlog(player) )
		this.player_logs[player].setdtimes( other.getlog(player) );
// remove corresponding actions in local buffer 
	find_delete(player, action);
}

// judge if killed
function killed( player, tokill, world ){
    if( world_states[world].dead[tokill] || world_states[world].dead[player] ) return false;
    if( world_states[world].player_pos[tokill].y == world_states[world].player_pos[player].y && Math.abs(world_states[world].player_pos[tokill].x - world_states[world].player_pos[player].x) < fire_range ){
        return true;
    }
    if( world_states[world].player_pos[tokill].x == world_states[world].player_pos[player].x && Math.abs(world_states[world].player_pos[tokill].y - world_states[world].player_pos[player].y) < fire_range ){
        return true;
    }
    return false;
}


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
		if( killed(i, 0, 0) ){
			// kill player
//			fire(main_coord_x+width*world_states[0].player_pos[i].x, main_coord_y+width*world_states[0].player_pos[i].y, "red", i);

			//insert action into local l_sequencer			
			setTimeout( function() {push_to_local(p_time.getTime() - genrandom(latency_to_player - 15, latency_to_player + 15) + genrandom(latency_to_centr_e - 15, latency_to_centr_e + 15), i, 0);}, genrandom(latency_to_player - 15, latency_to_player + 15));
			//insert action into central s_sequencer
			setTimeout( function() {update_central(i, 0);}, genrandom(latency_to_centr_e - 15, latency_to_centr_e + 15) );
			// push_to_central(p_time.getTime() + Math.floor((Math.random() * 60)) + latency, i, 0);
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
//			move(images[2], main_coord_x + width * world_states[0].player_pos[chaser].x, main_coord_y + width * world_states[0].player_pos[chaser].y, chaser, 87);
			//insert action into local l_sequencer			
			setTimeout( function() {push_to_local(p_time.getTime() - genrandom(latency_to_player - 15, latency_to_player + 15) + genrandom(latency_to_centr_e - 15, latency_to_centr_e + 15), chaser, 87);}, genrandom(latency_to_player - 15, latency_to_player + 15));
			//insert action into central s_sequencer
			setTimeout( function() {update_central(chaser, 87);}, genrandom(latency_to_centr_e - 15, latency_to_centr_e + 15) );
		} else {
//			move(images[2], main_coord_x + width * world_states[0].player_pos[chaser].x, main_coord_y + width * world_states[0].player_pos[chaser].y, chaser, 83);
			//insert action into local l_sequencer			
			setTimeout( function() {push_to_local(p_time.getTime() - genrandom(latency_to_player - 15, latency_to_player + 15) + genrandom(latency_to_centr_e - 15, latency_to_centr_e + 15), chaser, 83);}, genrandom(latency_to_player - 15, latency_to_player + 15));
			//insert action into central s_sequencer
			setTimeout( function() {update_central(chaser, 83);}, genrandom(latency_to_centr_e - 15, latency_to_centr_e + 15) );
		}
		return;
	}
	if(world_states[0].player_pos[chaser].y == world_states[0].player_pos[chased].y){
		if(world_states[0].player_pos[chaser].x > world_states[0].player_pos[chased].x){
			//world_states[0].player_pos[chaser].x -= 1;
//			move(images[2], main_coord_x + width * world_states[0].player_pos[chaser].x, main_coord_y + width * world_states[0].player_pos[chaser].y, chaser, 65);
			//insert action into local l_sequencer			
			setTimeout( function() {push_to_local(p_time.getTime() - genrandom(latency_to_player - 15, latency_to_player + 15) + genrandom(latency_to_centr_e - 15, latency_to_centr_e + 15), chaser, 65);}, genrandom(latency_to_player - 15, latency_to_player + 15));
			//insert action into central s_sequencer
			setTimeout( function() {update_central(chaser, 65);}, genrandom(latency_to_centr_e - 15, latency_to_centr_e + 15) );
		} else {
			//world_states[0].player_pos[chaser].x += 1;
//			move(images[2], main_coord_x + width * world_states[0].player_pos[chaser].x, main_coord_y + width * world_states[0].player_pos[chaser].y, chaser, 68);
			//insert action into local l_sequencer			
			setTimeout( function() {push_to_local(p_time.getTime() - genrandom(latency_to_player - 15, latency_to_player + 15) + genrandom(latency_to_centr_e - 15, latency_to_centr_e + 15), chaser, 68);}, genrandom(latency_to_player - 15, latency_to_player + 15));
			//insert action into central s_sequencer
			setTimeout( function() {update_central(chaser, 68);}, genrandom(latency_to_centr_e - 15, latency_to_centr_e + 15) );
		}
		return;
	}
	switch( Math.floor(Math.random() * (2)) ){
		case 1:
			if(world_states[0].player_pos[chaser].x > world_states[0].player_pos[chased].x){
				//world_states[0].player_pos[chaser].x -= 1;
//				move(images[2], main_coord_x + width * world_states[0].player_pos[chaser].x, main_coord_y + width * world_states[0].player_pos[chaser].y, chaser, 65);
				//insert action into local l_sequencer			
				setTimeout( function() {push_to_local(p_time.getTime() - genrandom(latency_to_player - 15, latency_to_player + 15) + genrandom(latency_to_centr_e - 15, latency_to_centr_e + 15), chaser, 65);}, genrandom(latency_to_player - 15, latency_to_player + 15));
				//insert action into central s_sequencer
				setTimeout( function() {update_central(chaser, 65);}, genrandom(latency_to_centr_e - 15, latency_to_centr_e + 15) );
			} else {
				//world_states[0].player_pos[chaser].x += 1;
//				move(images[2], main_coord_x + width * world_states[0].player_pos[chaser].x, main_coord_y + width * world_states[0].player_pos[chaser].y, chaser, 68);
				//insert action into local l_sequencer			
				setTimeout( function() {push_to_local(p_time.getTime() - genrandom(latency_to_player - 15, latency_to_player + 15) + genrandom(latency_to_centr_e - 15, latency_to_centr_e + 15), chaser, 68);}, genrandom(latency_to_player - 15, latency_to_player + 15));
				//insert action into central s_sequencer
				setTimeout( function() {update_central(chaser, 68);}, genrandom(latency_to_centr_e - 15, latency_to_centr_e + 15) );
			}
			return;
		case 0:
			if(world_states[0].player_pos[chaser].y > world_states[0].player_pos[chased].y){
				//world_states[0].player_pos[chaser].y -= 1;
//				move(images[2], main_coord_x + width * world_states[0].player_pos[chaser].x, main_coord_y + width * world_states[0].player_pos[chaser].y, chaser, 87);
				//insert action into local l_sequencer			
				setTimeout( function() {push_to_local(p_time.getTime() - genrandom(latency_to_player - 15, latency_to_player + 15) + genrandom(latency_to_centr_e - 15, latency_to_centr_e + 15), chaser, 87);}, genrandom(latency_to_player - 15, latency_to_player + 15));
				//insert action into central s_sequencer
				setTimeout( function() {update_central(chaser, 87);}, genrandom(latency_to_centr_e - 15, latency_to_centr_e + 15) );
			} else {
				//world_states[0].player_pos[chaser].y += 1;
//				move(images[2], main_coord_x + width * world_states[0].player_pos[chaser].x, main_coord_y + width * world_states[0].player_pos[chaser].y, chaser, 83);
				//insert action into local l_sequencer			
				setTimeout( function() {push_to_local(p_time.getTime() - genrandom(latency_to_player - 15, latency_to_player + 15) + genrandom(latency_to_centr_e - 15, latency_to_centr_e + 15), chaser, 83);}, genrandom(latency_to_player - 15, latency_to_player + 15));
				//insert action into central s_sequencer
				setTimeout( function() {update_central(chaser, 83);}, genrandom(latency_to_centr_e - 15, latency_to_centr_e + 15) );
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

// === function to generate random number === //
// return random number in range: [a, b]
function genrandom(a, b){
	return (Math.floor(Math.random() * (b - a + 1)) + a); 
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

// look for particular action in local array and delete it
function find_delete(player, action){
	for(var i = 0; i < l_sequencer.length; i++){
		if( l_sequencer[i].getplayer() == player && l_sequencer[i].getaction() == action ){
			l_sequencer.splice(i, 1);
			return;
		}
	}
}

// insert actions into local l_sequencer
// insert events to array and sort /* should be pushed immediately and processed by the central */
/*function push_to_central(player, action){
	c_sequencer.push( new event(time, player, action) );
	c_sequencer.sort(my_sort);
}
*/
// === functions for the background === //
function update_central(player, action){
//	return function() {
		world_states[1].apply(player, action);	//apply the action to central world state.
		setTimeout(world_states[2].synch(world_states[1], player, action), genrandom(85, 115));	// update only certain player's state.
//	};
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
// function sync(other, player){
	//compare world_states
	
	//redraw if world_states are different
	
//}

// === functions for manipulating the buffer === //
//function 


// ============================================ init function ============================== // 
function init(){
	// ================== init world_state data =============== //
	for(var i = 0; i < 3; i++){
		world_states[i] = new world_state(player_num);
	}

	world_states[0].init();
	//world_states[1] = new world_state();//jQuery.extend(true, {}, world_states[0]);//(JSON.parse(JSON.stringify(world_states[0]))); //cloneobject isn't working well :(
	world_states[1].initcopy(world_states[0]);
	world_states[2].initcopy(world_states[0]); // world_state2 for synch useage

	for( var i = 0; i < player_num; i++ ){
		dead.push(0);
	}
	// =================== load page ===================== //
	pageLoaded();
	// ======== initiate listener for user input========== //
	// move action
	document.onkeydown = function(event){
		//alert(event.keyCode);
		// move(images[0], main_coord_x+width*world_states[0].player_pos[0].x, main_coord_y+width*world_states[0].player_pos[0].y, 0, event.keyCode);
		//insert action into local l_sequencer
		push_to_local(p_time.getTime() + genrandom(170, 230), 0, event.keyCode);
		// processed by central after some time.
		setTimeout(function(){update_central(0, event.keyCode);}, genrandom(85, 115));
		//push_to_central(p_time.getTime() + Math.floor((Math.random() * 60)) + latency, 0, event.keyCode);
	}
	
	// fire action
	document.onmousedown = function(event) {
		// fire(main_coord_x+width*world_states[0].player_pos[0].x, main_coord_y+width*world_states[0].player_pos[0].y, "green", 0);
		//insert action into local l_sequencer
		push_to_local(p_time.getTime() + genrandom(170, 230), 0, event.keyCode);
		//processed by central after some time.
		setTimeout(function(){update_central(0, event.keyCode);}, genrandom(85, 115));
		//push_to_central(p_time.getTime() + Math.floor((Math.random() * 60)) + latency, 0, event.keyCode);
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

	// draw players periodically
	setInterval(function() { world_states[0].copy(world_states[2]); world_states[0].consapply(l_sequencer, 5); drawPlayers(world_states[0]); }, 100);	// periodically update the world states: update compare and draw
	// =========== initiate Background calculation ==========//
	/*
		myWorker is staic for posting actions.
	*/
	
	// =========== choose/set speculation level ==========//
	
	// ================== start timer ===================== //
//	var timeCountDown = setInterval(function(){myCountDown()},1000);
//	update_death();
//	update_score();
	
	// ======= collect useful game data ============ //
}

