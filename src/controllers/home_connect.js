var amqp_connector = require('./../services/amqp_connector');
var config = require('./../config/configuration');
var request = require('xhr-request');
//var ClientOAuth2 = require('client-oauth2');
var simulation = false;
var token;
var bshAuth;


//initBSHOAuth2Client();

//token = getToken();

amqp_connector.singleton.addModule("power_on", function (message, callback) {
    //console.log("[DEVICE MANAGER] device-methods: message:", JSON.stringify(message));
	triggerHomeConnectAction(message, callback, "power_on");
});

amqp_connector.singleton.addModule("power_off", function (message, callback) {
    //console.log("[DEVICE MANAGER] device-methods: message:", JSON.stringify(message));
	triggerHomeConnectAction(message, callback, "power_off");
});

amqp_connector.singleton.addModule("start", function (message, callback) {
    //console.log("[DEVICE MANAGER] device-methods: message:", JSON.stringify(message));
	triggerHomeConnectAction(message, callback, "start");
});

amqp_connector.singleton.addModule("stop", function (message, callback) {
    //console.log("[DEVICE MANAGER] device-methods: message:", JSON.stringify(message));
	triggerHomeConnectAction(message, callback, "stop");
});

amqp_connector.singleton.addModule("open_door", function (message, callback) {
    //console.log("[DEVICE MANAGER] device-methods: message:", JSON.stringify(message));
	triggerHomeConnectAction(message, callback, "open_door");
});

amqp_connector.singleton.addModule("close_door", function (message, callback) {
    //console.log("[DEVICE MANAGER] device-methods: message:", JSON.stringify(message));
	triggerHomeConnectAction(message, callback, "close_door");
});

amqp_connector.singleton.addModule("set_start_time", function (message, callback) {
    //console.log("[DEVICE MANAGER] device-methods: message:", JSON.stringify(message));
	triggerHomeConnectAction(message, callback, "set_start_time");
});

amqp_connector.singleton.addModule("set_end_time", function (message, callback) {
    //console.log("[DEVICE MANAGER] device-methods: message:", JSON.stringify(message));
	triggerHomeConnectAction(message, callback, "set_end_time");
});

amqp_connector.singleton.addModule("set_program", function (message, callback) {
    //console.log("[DEVICE MANAGER] device-methods: message:", JSON.stringify(message));
	triggerHomeConnectAction(message, callback, "set_program");
});

function triggerHomeConnectAction(message,callback,action){
	if(message != null){
		
		//get authorization token from home connect
		//config.hc_api_key
		//config.simulator_api_client
		// get token
		//var token = getToken();
		
		var device_label = message.device.device_label;
		var device_class = message.device.device_class;
		
		// Check whether to use simulator of Home Connect or not
		if(message.device.features.simulation){
			if(message.device.features.simulation === true){
				simulation = true;
			}
		}
		
		var response;
		
		console.log("[HOME CONNECT] action:", JSON.stringify(action));
		console.log("[HOME CONNECT] message:", JSON.stringify(message));
		
		// get device from Home Connect
		if(message.device.features.haid){
			//var response = bsh.getTest();
			console.log("[HOME CONNECT] getTest response: ",response);
		}else{
			response = {
			        'code': 500,
			        'message': "Missing \"haid\" parameter for [" + device_class + "] " + device_label
			};
			callback(JSON.stringify(response));
		}
		
		switch(action){
			case "set_start_time":
				response = startTimeHandling(message, callback);
				break;
			case "set_end_time":
				response = endTimeHandling(message, callback);
				break;
			case "set_program":
				response = programHandling(message, callback);
				break;
			case "power_on":
				response = power_onHandling(message, callback);
				break;
			case "power_off":
				response = power_offHandling(message, callback);
				break;
			case "start":
				response = startHandling(message, callback);
				break;
			case "stop":
				response = stopHandling(message, callback);
				break;
			case "open_door":
				response = openDoorHandling(message, callback);
				break;
			case "close_door":
				response = closeDoorHandling(message, callback);
				break;
			default:
				response = {
			        'code': 200,
			        'message': "[" + device_class + "] " + device_label + " set to: " + action
				};		
		}
		
		callback(JSON.stringify(response));
	} else {
	    var response = {
	        'code': 500,
	        'message': "No message provided for home-connect method."
	    };
	    callback(JSON.stringify(response));
	}
}

function power_onHandling(message, callback){
	var device_label = message.device.device_label;
	var device_class = message.device.device_class;
	var response;
	
	response = {
	        'code': 200,
	        'message': "Power on [" + device_class + "] " + device_label
	};
	
	return response;
}

function power_offHandling(message, callback){
	var device_label = message.device.device_label;
	var device_class = message.device.device_class;
	var response;
	
	response = {
	        'code': 200,
	        'message': "Power off [" + device_class + "] " + device_label
	};
	
	return response;
}

function startHandling(message, callback){
	var device_label = message.device.device_label;
	var device_class = message.device.device_class;
	var response;
	
	response = {
			'code': 200,
			'message': "Start [" + device_class + "] " + device_label
	};
	
	return response;
}

function stopHandling(message, callback){
	var device_label = message.device.device_label;
	var device_class = message.device.device_class;
	var response;
	
	response = {
	        'code': 200,
	        'message': "Stop [" + device_class + "] " + device_label
	};
	
	return response;
}

function openDoorHandling(message, callback){
	var device_label = message.device.device_label;
	var device_class = message.device.device_class;
	var response;
	
	response = {
	        'code': 200,
	        'message': "Open door for [" + device_class + "] " + device_label
	};
	
	return response;
}

function closeDoorHandling(message, callback){
	var device_label = message.device.device_label;
	var device_class = message.device.device_class;
	var response;
	
	response = {
	        'code': 200, 
	        'message': "Close door for [" + device_class + "] " + device_label
	};
	
	return response;
}

function startTimeHandling(message, callback){
	var device_label = message.device.device_label;
	var device_class = message.device.device_class;
	var response;
	
	if(message.method_body){
		if(message.method_body.time){
			var start_time = message.method_body.time
			response = {
			        'code': 200,
			        'message': "Set start-time to: " + start_time + " for [" + device_class + "] " + device_label
			};
		}else{
			response = {
			        'code': 400,
			        'message': "Missing time-value to set start-time for [" + device_class + "] " + device_label
			};
		}
	}else{
		response = {
		        'code': 400,
		        'message': "Missing time-value to set start-time for [" + device_class + "] " + device_label
		};
	}
	return response;
}

function endTimeHandling(message, callback){
	var device_label = message.device.device_label;
	var device_class = message.device.device_class;
	var response;
	
	if(message.method_body){
		if(message.method_body.time){
			var end_time = message.method_body.time
			response = {
			        'code': 200,
			        'message': "Set end-time to: " + end_time + " for[" + device_class + "] " + device_label
			};
		}else{
			response = {
			        'code': 400,
			        'message': "Missing time-value to set as end-time for [" + device_class + "] " + device_label
			};
		}
	}else{
		response = {
		        'code': 400,
		        'message': "Missing time-value to set as end-time for [" + device_class + "] " + device_label
		};
	}
	
	return response;
}

function programHandling(message, callback){
	var device_label = message.device.device_label;
	var device_class = message.device.device_class;
	var response;
	
	if(message.method_body){
		if(message.method_body.program){
			var selected_program = message.method_body.program
			response = {
			        'code': 200,
			        'message': "Set program to: " + selected_program + " for[" + device_class + "] " + device_label
			};
		}else{
			response = {
			        'code': 400,
			        'message': "Missing program-value to set for[" + device_class + "] " + device_label
			};
		}
	}else{
		response = {
		        'code': 400,
		        'message': "Missing program-value to set for[" + device_class + "] " + device_label
		};
	}
	
	return response;
}

