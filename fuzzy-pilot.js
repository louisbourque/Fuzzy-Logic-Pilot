//config object used to set the parameters of the game. This object is passed to the worker thread to initialize it
var config = new Object();
config.offset = 5;
config.runTimeout = 0;
config.ac_img_width = 16;
config.ac_img_width_max =Math.sqrt((config.ac_img_width)*(config.ac_img_width) + (config.ac_img_width) * (config.ac_img_width));
config.ac_img_width_add = config.ac_img_width_max - config.ac_img_width;
config.area_width=800;
config.area_height=500;
config.runway_x = 412;
config.runway_y = 229;
config.downwind = 120;
config.base = 240;
config.final_leg = 229;

//Translation of measurements simulated vs real world
// 1px = 50 feet
// 1 knot = 100 feet per minute
// 1 knot = 0.5 pixels per minute
// 10 knots = 5 ppm
// 1 cycle = 10 seconds
// 1 knot = 0.5/18 pixels per cycle

//aircraft class. This Aircraft is different that the one in pilot.js.
//This class, along with information about the aircraft positon and state, holds the worker thread used to perform calculations leading to decisions
function Aircraft(registration,x,y,alt,heading,airspeed){
	this.registration = registration;
	this.x = x;
	this.y = y;
	this.alt = alt;
	this.heading = heading;
	this.airspeed = airspeed;
	this.pilot = new Worker("pilot.js");
	this.pilot.onmessage = function(event) {
		handle_pilot_call(event.data);
	};
	this.pilot.onerror = function(error) {  
		//console.log(error.message);
	};
	//initialize the worker thread by sending it the parameters of the aircraft
	var message = new Object();
	message.act = "init";
	message.data = new Object();
	message.data.config = config;
	message.data.aircraft = new Object();
	message.data.aircraft.registration = registration;
	message.data.aircraft.x = x;
	message.data.aircraft.y = y;
	message.data.aircraft.alt = alt;
	message.data.aircraft.heading = heading;
	message.data.aircraft.airspeed = airspeed;
	this.pilot.postMessage(JSON.stringify(message));
	//draw the airplane
	this.plane_image = plane_image1;
	this.canvas = document.createElement("canvas");
	this.canvas.width = config.ac_img_width_max;
	this.canvas.height = config.ac_img_width_max;
	this.ctx = this.canvas.getContext("2d");
	set_heading(this,this.heading);
}
//the canvas used to draw the state of the game
var canvas;
var ctx;
var cyro_area;
var plane_image1;

//game state
var stop_running = true;
var flights = new Object();

//initialize
function init(){
	canvas = document.getElementById('canvas');
	ctx = canvas.getContext("2d");
	cyro_area =  document.getElementById('cyro_img');
	plane_image1 =  document.getElementById('plane1_img');
	
	//can use these initial states for testing scenarios, or use "Add Plane" button
	
	//two aircraft one ahead of the other
	//flights['2'] = new Aircraft('2',750,100,2000,270,80);flights['3'] = new Aircraft('3',700,100,2000,270,80);
	
	//two aircraft, side by side
	//flights['4'] = new Aircraft('4',400,500,2000,360,100);flights['5'] = new Aircraft('5',440,500,2000,360,100);
	
	//two aircraft, one above the other
	//flights['6'] = new Aircraft('6',400,450,1200,360,100);flights['7'] = new Aircraft('7',400,430,2000,360,100);
	
	//three aircraft converge
	//flights['8'] = new Aircraft('8',400,500,2000,360,100);flights['9'] = new Aircraft('9',440,500,2000,360,100);flights['10'] = new Aircraft('10',480,500,2000,360,100);
	
	//aircraft meet at downwind
	//flights['11'] = new Aircraft('11',750,100,2000,270,80);flights['12'] = new Aircraft('12',400,500,2000,360,100);
	start();
	add_planes_loop();
}

//This function runs repeatedly. Tells each worker thread to update
function run(){
	for (i in flights) {
		var message = new Object();
		message.act = "update";
		//get a list of airplanes that are considered to be too close
		message.data = getPlanesNearby(flights[i]);
		//console.log(message.data);
		flights[i].pilot.postMessage(JSON.stringify(message));
	}
	clearTimeout(config.runTimeout);
	if(!stop_running)
		config.runTimeout = setTimeout(run, 200);
	
}

//rotates the image to display it with the nose pointing in the heading
function set_heading(plane,new_heading){
		plane.ctx.save();
		plane.ctx.translate(config.ac_img_width_add/2,config.ac_img_width_add/2); // at least center image on screen
		plane.ctx.translate(config.ac_img_width/2,config.ac_img_width/2);		  // we move image back to its orginal 
		plane.ctx.rotate(((new_heading-45)%360)* Math.PI / 180);					  // rotate image
		plane.ctx.translate(-config.ac_img_width/2,-config.ac_img_width/2);	  // move image to its center, so we can rotate around its center
		plane.ctx.clearRect(0,0,config.ac_img_width_max,config.ac_img_width_max);
		plane.ctx.drawImage(plane.plane_image,0,0,config.ac_img_width,config.ac_img_width);
		plane.ctx.restore();
}

//this function is called whenver a worker thread sends a message
function handle_pilot_call(data){
	var resultObj = JSON.parse(data);
	if(resultObj.act == undefined){
		//console.log(resultObj); //if the message was not set as expected, log it in firebug
	}
	else{
		switch(resultObj.act){
			case "debug":
				//console.log(resultObj.data); //if the message is a debug, log the data to firebug
				break;
			case "update":
				//the worker is giving updated aircraft state
				if(flights[resultObj.data.registration] != undefined){
					if(resultObj.data.circuit == "landed"){
						//if the aircraft has landed, discard it
						delete flights[resultObj.data.registration];
					}else{
						//update the game state with the new aircraft information
						set_heading(flights[resultObj.data.registration],resultObj.data.heading);
						flights[resultObj.data.registration].x = parseInt(resultObj.data.x);
						flights[resultObj.data.registration].y = parseInt(resultObj.data.y);
						flights[resultObj.data.registration].alt = parseInt(resultObj.data.alt);
						flights[resultObj.data.registration].airspeed = parseInt(resultObj.data.airspeed);
					}
				}
				break;
		}
	}
}

//start the run loop
function start(){
	document.getElementById('stop_start').value = "Stop";
	clearTimeout(config.runTimeout);
	stop_running = false;
	run();
}
//pause the game
function stop(){
	document.getElementById('stop_start').value = "Start";
	stop_running = true;
	clearTimeout(config.runTimeout);
}

function stop_start(){
	if(stop_running){
		start();
	}else{
		stop();
	}
}

//Redraw the screen based on the state
function refresh_view(){
	//draw the scenery, aircraft as appropriate
	ctx.drawImage(cyro_area,0,0);
	for (i in flights) {
		//draw each aircraft on the map
		var center_x = flights[i].x-(config.ac_img_width_max/2);
		var center_y = flights[i].y-(config.ac_img_width_max/2);
		ctx.drawImage(flights[i].canvas,center_x,center_y); 
		ctx.strokeStyle = "#FF0";
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(center_x+15,center_y+15);
		ctx.lineTo(center_x+25,center_y+25);
		ctx.lineTo(center_x+40,center_y+25);
		ctx.stroke();
		ctx.fillStyle = "#FF0";
		ctx.strokeStyle = "#000";
		//display stats on the aircraft so we can see it's registration, alt and airspeed
		ctx.font = "10pt Courier";
		ctx.strokeText(flights[i].registration, center_x+42, center_y+25);
		ctx.strokeText(flights[i].alt, center_x+42, center_y+35);
		ctx.strokeText(flights[i].airspeed, center_x+42, center_y+45);
		ctx.fillText(flights[i].registration, center_x+42, center_y+25);
		ctx.fillText(flights[i].alt, center_x+42, center_y+35);
		ctx.fillText(flights[i].airspeed, center_x+42, center_y+45);
		
	}
	
}

// shim layer with setTimeout fallback
    window.requestAnimFrame = (function(){
      return  window.requestAnimationFrame       || 
              window.webkitRequestAnimationFrame || 
              window.mozRequestAnimationFrame    || 
              window.oRequestAnimationFrame      || 
              window.msRequestAnimationFrame     || 
              function(/* function */ callback, /* DOMElement */ element){
                window.setTimeout(callback, 1000 / 60);
              };
    })();
    
    (function animloop(){
      requestAnimFrame(animloop, canvas);
      refresh_view();
    })();


//add an aircraft to the map. Randmonly decied which side it will be on, then
// place at a random location on that edge of the map
function addPlane(){
	if(typeof(cyro_area) != 'undefined'){
		var initial_position = parseInt(Math.random()*5);
		var init_pos_x;
		var init_pos_y;
		var init_heading;
		switch(initial_position){
			case 1:
				//right
				init_pos_x = config.area_width
				init_pos_y = parseInt(Math.random()*config.area_height);
				init_heading = 270;
				break;
			case 2:
				//bottom
				init_pos_x = parseInt(Math.random()*config.area_width);
				init_pos_y = config.area_height;
				init_heading = 1;
				break;
			case 3:
				//left
				init_pos_x = 0;
				init_pos_y = parseInt(Math.random()*config.area_height);
				init_heading = 90;
				break;
			default:
				//top
				init_pos_x = parseInt(Math.random()*config.area_width);
				init_pos_y = 0;
				init_heading = 180;
		}
		var callsign = "";
		do{
			callsign = randomString();
		}while(flights[callsign] != undefined)
		flights[callsign] = new Aircraft(callsign,init_pos_x,init_pos_y,2000,init_heading,100);
	}
}

function add_planes_loop(){
	if(document.getElementById('auto_add_plane').checked){
		addPlane();
	}
	setTimeout(add_planes_loop, 15000);
}

//returns any aircraft that is "too close" to the given airplane
function getPlanesNearby(plane1){
	var tempResults = new Array();
	var results = new Array();
	var distance = 0;
	//horizontal distance
	for(x in flights){
		if(plane1.registration != flights[x].registration){
			var diffX = plane1.x - flights[x].x;
			var diffY = plane1.y - flights[x].y;
			var aDistance = Math.sqrt(diffX*diffX + diffY*diffY);
			//70px ~= 1km seperation
			if(aDistance < 70){
				tempResults.unshift(flights[x]);
			}
		}
	}
	
	//vertical distance
	for(var i = 0;i<tempResults.length;i++){
		//if alt diff is more than 500, separation is sufficient
		if(Math.abs(plane1.alt-tempResults[i].alt) < 500){
			var aPlane = new Object();
			aPlane.registration = tempResults[i].registration;
			aPlane.x = tempResults[i].x;
			aPlane.y = tempResults[i].y;
			aPlane.alt = tempResults[i].alt;
			aPlane.heading = tempResults[i].heading;
			aPlane.airspeed = tempResults[i].airspeed;
			results.unshift(aPlane);
		}
	}
	return results;
}

//randomly generate a callsign
function randomString() {
	var chars = "ABCDEFGHIJKLMNOPQRSTUVWXTZ";
	var string_length = 4;
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}