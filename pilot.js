//import scripts:
//json2.js is an open source JSON parser, available at http://www.json.org/js.html
//json2.js is used to convert objects to string when passing to/from the worker
importScripts('json2.js');
//fuzzy.js is a fuzzy logic library created by Alain Bonardi, Isis Truck - Ircam & Paris 8 University
//fuzzy.js is available at http://imtr.ircam.fr/index.php/FuzzyLib and is free for artistic work and/or scientific research.
importScripts('fuzzy.js');

/**
This is the worker. It is used by virus.html to perform all the CPU-intensive
processing, so the GUI will remain responsive. This worker is given the state of the grid,
and performs the computations that are used to find the best move.

The worker is initialized and given instructions by virus.html.
The worker sends the state information back to virus.html to be drawn on the screen
  so the user can see what the new state is.
**/

//simplified aircraft class to store information about self.
function Aircraft(registration,x,y,alt,heading,airspeed){
	this.registration = registration;
	this.x = x;
	this.y = y;
	this.alt = alt;
	this.heading = heading;
	this.airspeed = airspeed;
	this.vsi = 0;
}

//variables to store state
var config;
var me;
var altitude_controller;
var nearby_flights;

//Translation of measurements simulated vs real world
// 1px = 50 feet
// 1 knot = 100 feet per minute
// 1 knot = 0.5 pixels per minute
// 10 knots = 5 ppm
// 1 cycle = 10 seconds
// 1 knot = 0.5/18 pixels per cycle

//this is the function that is called whenever the worker receives a message.
//based on the content of the message (event.data.act), do the appropriate action.
onmessage = function(event) {
	var message = JSON.parse(event.data);
	switch(message.act){
		case 'update':
			if(me != undefined){
				//update location of nearby aircraft
				nearby_flights = message.data;
				update();
			}
			break;
		case 'init':
			//initialization - setup config, self state ("me") and setup fuzzy sets to be used later
			config = message.data.config;
			me = new Aircraft(message.data.aircraft.registration,message.data.aircraft.x,message.data.aircraft.y,message.data.aircraft.alt,message.data.aircraft.heading,message.data.aircraft.airspeed);
			altitude_controller = new FSS("altitude");
			altitude_controller.FSS_Fill(-99999,0.0,-200,0.0,-100,0.1,-50,0.4,0,0.5,50,0.6,100,0.9,200,1.0,99999,1.0);
			
			heading_controller = new FSS("heading");
			heading_controller.FSS_Fill(-360,0.0,-90,0.0,-45,0.1,-15,0.4,0,0.5,15,0.6,45,0.9,90,1.0,360,1.0);
			
			//value = North, 1-value = South
			NorthSouth_controller = new FSS("NorthSouth");
			NorthSouth_controller.FSS_Fill(-99999,1.0,-200,1.0,0,0.5,200,0.0,99999,0.0);
			//value = East, 1-value = West
			EastWest_controller = new FSS("EastWest");
			EastWest_controller.FSS_Fill(-99999,0.0,-200,0.0,0,0.5,200,1.0,99999,1.0);
			break;
	}
}

//move the aircraft as appropriate and send updated state to the browser
function update(){
	
	//determine position relative to the field. Are we to the N, S, E or W?
	var position = new Object();
	position["north"] = NorthSouth_controller.FSS_GetMembershipValue(me.y-config.runway_y);
	position["south"] = 1-position["north"];
	position["east"] = EastWest_controller.FSS_GetMembershipValue(me.x-config.runway_x);
	position["west"] = 1-position["east"];
	
	var max = 0;
	var position_mostly;
	for(x in position){
		if(position[x] > max){
			max = position[x];
			position_mostly = x;
		}
	}
	
	//set target altitude, airspeed and position based on where we are:
	
	if(me.circuit == undefined){
		if(position_mostly == "north" || position_mostly == "west")
			me.circuit = "overhead_arrival";
		if(position_mostly == "east")
			me.circuit = "straight_in_downwind";
		if(position_mostly == "south")
			me.circuit = "overhead_the_field";
	}
	
	//default targets
	var target_alt = 1200;//circuit height
	var target_airspeed = 100;//circuit height
	var target_x = config.runway_x;
	var target_y = config.runway_y;
	//depending on where we are in the circuit, set targets appropriately
	if(me.circuit == "overhead_arrival"){
		if(me.y > config.runway_y){
			me.circuit = "overhead_turn_1";
		}else{
			target_alt = 1700;
			target_airspeed = 100;
			target_x = config.runway_x;
			target_y = config.runway_y;
		}
	}
	if(me.circuit == "overhead_turn_1"){
		if(me.y > config.runway_y+60){
			me.circuit = "overhead_turn_2";
		}else{
			target_alt = 1700;
			target_airspeed = 90;
			target_x = config.runway_x-90;
			target_y = config.runway_y+90;
		}
	}
	if(me.circuit == "overhead_turn_2"){
		if(me.x > config.runway_x+30){
			me.circuit = "overhead_the_field";
		}else{
			target_alt = 1200;
			target_airspeed = 70;
			target_x = config.runway_x+90;
			target_y = config.runway_y+90;
		}
	}
	if(me.circuit == "overhead_the_field"){
		if(me.y < config.runway_y){
			me.circuit = "overhead_crosswind";
		}else{
			target_alt = 1200;
			target_airspeed = 90;
			target_x = config.runway_x;
			target_y = config.runway_y;
		}
	}
	if(me.circuit == "overhead_crosswind"){
		if(me.y < config.downwind){
			me.circuit = "downwind";
		}else{
			target_alt = 1200;
			target_airspeed = 90;
			target_x = config.runway_x;
			target_y = config.downwind;
		}
	}
	if(me.circuit == "straight_in_downwind"){
		if(me.x < config.runway_x+50){
			me.circuit = "downwind";
		}else{
			target_alt = 1200;
			target_airspeed = 80;
			target_x = config.runway_x+40;
			target_y = config.downwind;
		}
	}
	if(me.circuit == "downwind"){
		if(me.x < config.base){
			me.circuit = "base";
		}else{
			target_alt = 1200;
			target_airspeed = 80;
			target_x = config.base;
			target_y = config.downwind;
		}
	}
	if(me.circuit == "base"){
		if(me.y > config.final_leg){
			me.circuit = "final";
		}else{
			target_alt = 700;
			target_airspeed = 70;
			target_x = config.base;
			target_y = config.final_leg;
		}
	}
	if(me.circuit == "final"){
		if(me.x > (config.runway_x-40)){
			me.circuit = "landed";
		}else{
			target_alt = 188;
			target_airspeed = 65;
			target_x = config.runway_x;
			target_y = config.runway_y;
		}
	}
	
	//find out how many degrees we are off from the heading we want to be on to reach the target
	var desired_heading = calculate_bearing(me.x,me.y,target_x,target_y);

	var heading_difference = desired_heading-me.heading;
	//have to adjust difference so we don't try to turn more than 180 degrees
	while(heading_difference > 180 || heading_difference < -180){
		if(heading_difference > 180){
			heading_difference = (heading_difference-360);
		}
		if(heading_difference < -180){
			heading_difference = (heading_difference+360);
		}
	}
	
	//Airspeed correction based on proximity of aircraft ahead or behind
	var airspeed_val_2 = new FSS("airspeed_val_2");
	airspeed_val_2.FSS_Fill(65, 0, 120, 0);
	
	// HEADING CORRECTION
	var heading_val_1 = new FSS("heading_val_1");
	var heading_val_2 = new FSS("heading_val_2");
	var heading_val_final = new FSS("heading_val_final");
	//adjust heading based on distance from desired heading
	heading_val_1.FSS_Fuzzyfication((heading_controller.FSS_GetMembershipValue(heading_difference)-0.5)*360, -180, 180, "TRIANGULAR_ABSOLUTE", 0, 90, 90);
	//adjust heading based on proximity to other aircraft. By defauly, do nothing
	//default fuzzy set, all 0's so we don't change heading if there's no other aircraft
	heading_val_2.FSS_Fill(-180, 0, 0, 0, 180, 0);
	
	//for all nearby aircraft, determine if/which direction/how much we need to turn or accelerate.
	for(var i = 0;i < nearby_flights.length;i++){
		//calculate heading towards the other aircraft
		var relative_bearing = calculate_bearing(me.x,me.y,nearby_flights[i].x,nearby_flights[i].y);
		
		//postMessage('{"act":"debug","data":"'+me.registration+': '+nearby_flights[i].registration+' is rb:'+relative_bearing+'"}');
		
		var heading_difference = relative_bearing-me.heading;
		//adjust to see where the other a/c is relative to us (ahead or behind)
		if(heading_difference > 180 || heading_difference < -180){
			if(heading_difference > 180){
				heading_difference = (heading_difference-360);
			}
			if(heading_difference < -180){
				heading_difference = (heading_difference+360);
			}
		}
		//postMessage('{"act":"debug","data":"'+me.registration+': '+nearby_flights[i].registration+' is hd:'+heading_difference+'"}');
		if(heading_difference == 0){
			//aircraft is headon, turn to the right
			heading_val_2.FSS_Insert(180,1);
			//slow down
			airspeed_val_2.FSS_Insert(me.airspeed-20,0);
			airspeed_val_2.FSS_Insert(me.airspeed-10,1);
			airspeed_val_2.FSS_Insert(me.airspeed,0);
		}else if(heading_difference > -90 && heading_difference < 90){
			//aircraft is ahead us us, turn away
			var correction = 0;
			//if the a/c is to the right, turn left, otherwise, turn right
			if(heading_difference > 0)
				correction = heading_difference - 180;
			else
				correction = heading_difference + 180;
			heading_val_2.FSS_Insert(correction,1);
			//slow down
			airspeed_val_2.FSS_Insert(me.airspeed-20,0);
			airspeed_val_2.FSS_Insert(me.airspeed-10,1);
			airspeed_val_2.FSS_Insert(me.airspeed,0);
		}else{
			//aircraft is behind us speed up a little to give them room
			airspeed_val_2.FSS_Insert(me.airspeed,0);
			airspeed_val_2.FSS_Insert(me.airspeed+10,1);
			airspeed_val_2.FSS_Insert(me.airspeed+20,0);		}
	}
	
	//merge the two fuzzy sets, take the max value of both sets.
	for(var i = -180;i<=180;i++){
		heading_val_final.FSS_Insert(i, Math.max(heading_val_1.FSS_GetMembershipValue(i),heading_val_2.FSS_GetMembershipValue(i)));
	}
	
	var heading_correction = heading_val_final.FSS_Defuzzification();
	
	//adjust heading based on correction divide by 18 for 1 cycle
	me.heading = (me.heading + (heading_correction/18))%360;
	
	
	// ALTITUDE CORRECTION
	var altitude_val_1 = new FSS("altitude_val_1");
	var altitude_val_2 = new FSS("altitude_val_2");
	var altitude_val_3 = new FSS("altitude_val_3");
	var altitude_val_final = new FSS("altitude_val_final");
	//adjust height based on target altitude
	altitude_val_1.FSS_Fuzzyfication((altitude_controller.FSS_GetMembershipValue(me.alt-target_alt)-0.5)*-500, -500, 500, "TRIANGULAR_ABSOLUTE", 0, 500, 500);
	//give the plane momentum, so we can't start descending 500 fpm instantly
	altitude_val_2.FSS_Fill(me.vsi-400, 0, me.vsi, 1, me.vsi+400, 0);	
	//if there are aircraft above/underneath, can't climb/descent as appropriate
	altitude_val_3.FSS_Fill(-1000, 1, 0, 1, 1000, 1);
	for(var i = 0;i < nearby_flights.length;i++){
		if(Math.abs(nearby_flights[i].alt - me.alt) > 50){
			if(nearby_flights[i].alt > me.alt){
				//don't climb
				altitude_val_3.FSS_Insert(0, 0);
				altitude_val_3.FSS_Insert(1, 0);
				altitude_val_3.FSS_Insert(1000, 0);
			}else{
				//don't descend
				altitude_val_3.FSS_Insert(0, 0);
				altitude_val_3.FSS_Insert(-1, 0);
				altitude_val_3.FSS_Insert(-1000, 0);			
			}
		}
	}
	
	for(var i = -1000;i<=1000;i++){
		//final fuzzy set is the   max (min(sets 1 and 3) and 2)
		//min(1,3) for pilot decision, 3 stops the pilot from deciding to climb
		//max that with 3 for momentum of the aircraft to stabilize the altitude
		altitude_val_final.FSS_Insert(i, Math.max(Math.min(altitude_val_1.FSS_GetMembershipValue(i),altitude_val_3.FSS_GetMembershipValue(i)),altitude_val_2.FSS_GetMembershipValue(i)));
	}
	
	
	var alt_correction = altitude_val_final.FSS_Defuzzification();
	
	// adjust altitude based on correction
	me.vsi = alt_correction;
	//correction is feet per minute. Divide by 18 for 1 cycle
	me.alt = me.alt + (alt_correction/18);
	
	
	// AIRSPEED CORRECTION
	//current speed (tend to want to maintain speed), give the plane momentum
	var airspeed_val_1 = new FSS("airspeed_val_1");
	airspeed_val_1.FSS_Fuzzyfication(me.airspeed, 65, 120, "TRIANGULAR_ABSOLUTE", 0, 10, 10);
	//adjust for proximity to other aircraft.
	//airspeed_val_2 is declared above so we can set it based on aircraft ahead or behind, which is calculated above
	//var airspeed_val_2 = new FSS("airspeed_val_2");
	//adjust for desired speed based on location in the circuit
	var airspeed_val_3 = new FSS("airspeed_val_3");
	airspeed_val_3.FSS_Fuzzyfication(target_airspeed, 65, 120, "TRIANGULAR_ABSOLUTE", 0, 10, 10);
	
	var airspeed_val_final = new FSS("airspeed_val_final");
	for(var i = 55;i<=120;i++){
		//final fuzzy set is the   max (max(sets 1 and 2) and 3)
		airspeed_val_final.FSS_Insert(i, Math.max(Math.max(airspeed_val_1.FSS_GetMembershipValue(i),airspeed_val_2.FSS_GetMembershipValue(i)),airspeed_val_3.FSS_GetMembershipValue(i)));
	}
	
	//obtain new airspeed
	me.airspeed = airspeed_val_final.FSS_Defuzzification();
	
	//determine how far the plane will move forward (in pixels)
	var forward_movement = (0.5/18) * me.airspeed;
	
	//postMessage('{"act":"debug","data":"'+airspeed_val_final.FSS_TextDisplay()+'"}');
	//move the plane forward by forward_movement pixels
	me.x = me.x + Math.sin((me.heading)* Math.PI / 180)*forward_movement;
	me.y = me.y - Math.cos((me.heading)* Math.PI / 180)*forward_movement;
	//send the new state to browser
	var message = new Object();
	message.act = "update";
	message.data = new Object();
	message.data.registration = me.registration;
	message.data.x = me.x;
	message.data.y = me.y;
	message.data.alt = me.alt;
	message.data.heading = me.heading;
	message.data.airspeed = me.airspeed;
	message.data.circuit = me.circuit;
	postMessage(JSON.stringify(message));
	
}

//calculate a bearing from point 1 to point 3
function calculate_bearing(x1,y1,x2,y2){
	var y = Math.sin(y2-y1) * Math.cos(x2);
	var x = Math.cos(x1)*Math.sin(x2) -
        Math.sin(x1)*Math.cos(x2)*Math.cos(y2-y1);
	var relative_bearing = Math.atan((y2-y1)/(x2-x1))* 180 / Math.PI;
	if(x2>x1){
		relative_bearing = (relative_bearing+90)%360;
	}else{
		relative_bearing = (relative_bearing+270)%360;
	}
	return relative_bearing;
}