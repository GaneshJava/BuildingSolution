var prosyst_ws_client = require('./../services/prosyst_ws_client');
var config = require('./../config/configuration');
var report_templates = require('./../config/report_templates');
var request = require('xhr-request');
var mongo = require('../lib/mongo_service/controllers/MongoDBService');
var authorization_token = null;
var url = "url here";//your buildingsolution url
authorization_token = generateAuthorizationTokenForBuildingSolution(config.bs_tenant,config.bs_user,config.bs_pw);


// handle daily snapshot (24 hours)
handleDailySnapshot();
setInterval(handleDailySnapshot, 86400000);

// send system ping (each 5 minutes)
setInterval(sendPing, 300000);

prosyst_ws_client.singleton.addModule(function (message) {
	var messageObject = JSON.parse(message.data);
	
	console.log("[BUILDING_SOLUTION]: messageObject:", JSON.stringify(messageObject));

    var property = messageObject.properties.propertyName;
    var property_timestamp = messageObject.properties.timestamp;
    var uuid = messageObject.properties.id;
    
    if(property == "temperature"){

    	var new_temperature = Math.round(messageObject.properties.propertyValueNew);
    	
    	var query = {};
	    query["features.uuid"] = uuid;
	    
	    mongo.getDeviceAdvanced(query, function (data, err) {
	        if (!err) {
	            if (Object.keys(data).length > 0 && data.device[0] != undefined) {
	            	
	            	var focus_room_device = data.device[0];
	                	                
	                sendTemperature(focus_room_device,property_timestamp,new_temperature);
	                
	            } else {
	                console.log("[BUILDING_SOLUTION] " + uuid + " not found")
	            }
	        } else {
	            console.error(err.code + " : " + err.message);
	        }
	    });
    }
    
    
    if (property == "focusRoomState") {
    	
    	var newState = messageObject.properties.propertyValueNew;
    	
    	newState = newState.toLowerCase();

	    var query = {};
	    query["features.uuid"] = uuid;
	    
	    mongo.getDeviceAdvanced(query, function (data, err) {
	        if (!err) {
	            if (Object.keys(data).length > 0 && data.device[0] != undefined) {
	            	
	            	var focus_room_device = data.device[0];
	                	                
	                sendPresenceState(focus_room_device,property_timestamp,newState);
	                
	            } else {
	                console.log("[BUILDING_SOLUTION] " + uuid + " not found")
	            }
	        } else {
	            console.error(err.code + " : " + err.message);
	        }
	    });
    }
});



function generatePostSpaceDataURLParams(time_in_sec){
	var url_param = null;

	if(time_in_sec<10000000000) time_in_sec *= 1000;
	
	var time_param = new Date();
	time_param.setTime(time_in_sec);

	if(time_param){
		url_param = "day-" + (1900 + time_param.getYear()) + "-" + getMonthName((time_param.getMonth())) + "-" + time_param.getDate()
	}
	
	return url_param;
}

function generateYYYYMMDD(time_in_sec){
	var yyyy_mm_dd = null;
	
	if(time_in_sec<10000000000) time_in_sec *= 1000;
	
	var time_param = new Date();
	time_param.setTime(time_in_sec);
	
	yyyy_mm_dd = (1900 + time_param.getYear()) + "-" + checkTime(time_param.getMonth() + 1) + "-" + checkTime(time_param.getDate());
	
	return yyyy_mm_dd;
}

function getYear(time_in_sec){
	var year = null;
	
	if(time_in_sec<10000000000) time_in_sec *= 1000;
	
	var time_param = new Date();
	time_param.setTime(time_in_sec);
	
	year = 1900 + time_param.getYear();
	
	return year;
}

function getMonthName(month_int){
    var month_name = null;
    if(month_int === 0){
        month_name = "JAN";
    }
    if(month_int === 1){
        month_name = "FEB";
    }
    if(month_int === 2){
        month_name = "MAR";
    }
    if(month_int === 3){
        month_name = "APR";
    }
    if(month_int === 4){
        month_name = "MAY";
    }
    if(month_int === 5){
        month_name = "JUN";
    }
    if(month_int === 6){
        month_name = "JUL";
    }
    if(month_int === 7){
        month_name = "AUG";
    }
    if(month_int === 8){
        month_name = "SEP";
    }
    if(month_int === 9){
        month_name = "OCT";
    }
    if(month_int === 10){
        month_name = "NOV";
    }
    if(month_int === 11){
        month_name = "DEC";
    }
    
    return month_name;
}

function getTimeString(time_sec){
	//console.log("[BUILDING-SOLUTION-INTERFACE]-getTimeString: " + time_sec);
	
	if(time_sec<10000000000) time_sec *= 1000;
	
    var f_time = new Date();
    
    f_time.setTime(time_sec);
    
    var year  =  1900 + f_time.getYear();
    var month = checkTime(f_time.getMonth() + 1);
    var day   = checkTime(f_time.getDate());
    var h = checkTime(f_time.getHours());
    var m = checkTime(f_time.getMinutes());
    var s = checkTime(f_time.getSeconds());


    return year + "-" + month + "-" + day + "T" + h + ":" + m + ":" + s + ".000Z";
}

function getEventTimeString(time_sec){
	//console.log("[BUILDING-SOLUTION-INTERFACE]-getTimeString: " + time_sec);
	
	if(time_sec<10000000000) time_sec *= 1000;
	
    var f_time = new Date();
    
    f_time.setTime(time_sec);
    
    var year  =  1900 + f_time.getYear();
    var month = checkTime(f_time.getMonth() + 1);
    var day   = checkTime(f_time.getDate());
    var h = checkTime(f_time.getHours());
    var m = checkTime(f_time.getMinutes());
    var s = checkTime(f_time.getSeconds());


    return year + "-" + month + "-" + day + "T" + h + ":" + m + ":" + s + ".000+01:00";
}

function handleDailySnapshot(){
	
	var d = new Date();
	var n = d.getTime();
	var dateString = generateYYYYMMDD(n);
	var eventTimeString = getEventTimeString(n);
	
	var snapshot_json = null;
	
	console.log("[BUILDING-SOLUTION-INTERFACE] do the daily snapshot");
	
	var query = {};
    query["device_class"] = "FocusRoomSensorKit";
    
    mongo.getDeviceAdvanced(query, function (data, err) {
        if (!err) {
            if (Object.keys(data).length > 0) {
            	snapshot_json = [];
            	snapshot_json.push({
            			"schemaVersion": "1.0",
            			"systemId": config.bs_system_id,
            			"type": "Snapshot_Persisted",
            			"eventTst": eventTimeString,
            			"sentTst": eventTimeString,
            			"upserts":{
            				"devices":[]
            			}});
                        	
            	//console.log("[BUILDING-SOLUTION-INTERFACE] devices: ", JSON.stringify(data));
            	
            	for (var d = 0; d < data.device.length; d++) {
            		var affected_device = data.device[d];
            		
            		var device_snapshot_state = "READY";
            		if(affected_device.features.status !== "Online"){
            			device_snapshot_state = "CONNECTION_ERROR";
            		}
            		
            		
            		var device_label = affected_device.device_label;
               		var device_snapshot_name = "Focus Room Sensor Kit " + device_label;
            		
            		var focus_room_presence = true;
            		if(affected_device.features.focusRoomState !== "available"){
            			focus_room_presence = false;
            		}
            		
            		
            		if(affected_device.features.uuid != null){
            			if(affected_device.features.building_solution_id != null){
			            	var device_snapshot = {
			            		"id": affected_device.features.building_solution_id,
			            		"type": "Sensor",
			            		"subType": affected_device.device_class,
			            		"state": device_snapshot_state,
			            		"name": device_snapshot_name,
			            		"presenceCapability":{
			            			"presence": focus_room_presence
			            		}
			            	};
			            	
			            	snapshot_json[0].upserts.devices.push(device_snapshot);
            			}
            		}
            	}
            }
        }else {
            console.error(err.code + " : " + err.message);
        }
        
        //console.log("[BUILDING-SOLUTION-INTERFACE] snapshot_json: ", JSON.stringify(snapshot_json));
        
        if(snapshot_json != null){
            	request("url", {
				method: 'POST',
				json: true,
				body: snapshot_json,
				responseType: 'json',
				rejectUnauthorized: false,
				requestCert: false,
				headers: {
					'content-type': 'application/json',
					'Authorization': authorization_token	
				}
			}, function (err, data_report, response) {
				console.log('[BUILDING-SOLUTION-INTERFACE]: set device snapshot: status-code: ', response.statusCode);
				if (err){
					console.log('[BUILDING-SOLUTION-INTERFACE]: set device snapshot error: ', JSON.stringify(err));
					
				}
			});
        }
        
    });
}

function sendPing(){
	var d = new Date();
	var n = d.getTime();
	var dateString = generateYYYYMMDD(n);
	var eventTimeString = getEventTimeString(n);
	
	var ping_json = [];
			
	var ping_content = {
			"schemaVersion": "1.0",
	        "systemId": config.bs_system_id,
	        "type": "Ping",
	        "eventTst": eventTimeString,
	        "sentTst": eventTimeString
	};
	
	ping_json.push(ping_content);
	
	//console.log("[BUILDING-SOLUTION-INTERFACE] sendPing: ", JSON.stringify(ping_json));
	
	request(url, {
		method: 'POST',
		json: true,
		body: ping_json,
		responseType: 'json',
		rejectUnauthorized: false,
		requestCert: false,
		headers: {
			'content-type': 'application/json',
			'Authorization': authorization_token	
		}
	}, function (err, data_report, response) {
		console.log('[BUILDING-SOLUTION-INTERFACE]: sendPing: status-code: ', response.statusCode);
		if (err){
			console.log('[BUILDING-SOLUTION-INTERFACE]: sendPing error: ', JSON.stringify(err));
			
		}
	});
	
}

function sendTemperature(device,timestamp,temperature){
	var focusRoomLabel =  device.device_label.toString();
    var building_solution_id =  device.features.building_solution_id.toString();
        
    var eventTimeString = getEventTimeString(timestamp);
    
    var temperature_json = [];
    
    var temperature_content = {
    		"schemaVersion": "1.0",
            "systemId": config.bs_system_id,
            "type": "Event",
            "eventTst": eventTimeString,
            "sentTst": eventTimeString,
            "upserts": {
                "devices": [
                    {
                        "id": building_solution_id,
                        "state": "READY",
                        "temperatureCapability": {
                        	"temperature": temperature
                        }
                    }
                ]
            }
    };
    
    temperature_json.push(temperature_content);
    
    console.log("[BUILDING-SOLUTION-INTERFACE] sendTemperature: ", JSON.stringify(temperature_json));
	
	request(url, {
		method: 'POST',
		json: true,
		body: temperature_json,
		responseType: 'json',
		rejectUnauthorized: false,
		requestCert: false,
		headers: {
			'content-type': 'application/json',
			'Authorization': authorization_token	
		}
	}, function (err, data_report, response) {
		console.log('[BUILDING-SOLUTION-INTERFACE]: sendTemperature: status-code: ', response.statusCode);
		if (err){
			console.log('[BUILDING-SOLUTION-INTERFACE]: sendTemperature error: ', JSON.stringify(err));
			
		}
	});
}

function sendPresenceState(device, timestamp, state){
	var focusRoomLabel =  device.device_label.toString();
    var building_solution_id =  device.features.building_solution_id.toString();
    var presence_state = false;
    
    if(state === "occupied"){
    	presence_state = true;
    }
    
    var eventTimeString = getEventTimeString(timestamp);
    
    var presence_json = [];
    
    var presence_content = {
    		"schemaVersion": "1.0",
            "systemId": config.bs_system_id,
            "type": "Event",
            "eventTst": eventTimeString,
            "sentTst": eventTimeString,
            "upserts": {
                "devices": [
                    {
                        "id": building_solution_id,
                        "state": "READY",
                        "presenceCapability": {
                        	"presence": presence_state
                        }
                    }
                ]
            }
    };
    
    presence_json.push(presence_content);
    
    console.log("[BUILDING-SOLUTION-INTERFACE] sendPresenceState: ", JSON.stringify(presence_json));
	
	request(url, {
		method: 'POST',
		json: true,
		body: presence_json,
		responseType: 'json',
		rejectUnauthorized: false,
		requestCert: false,
		headers: {
			'content-type': 'application/json',
			'Authorization': authorization_token	
		}
	}, function (err, data_report, response) {
		console.log('[BUILDING-SOLUTION-INTERFACE]: sendPresenceState: status-code: ', response.statusCode);
		if (err){
			console.log('[BUILDING-SOLUTION-INTERFACE]: sendPresenceState error: ', JSON.stringify(err));
			
		}
	});
}

function checkTime(i) {
    return (i < 10) ? "0" + i : i;
}

function generateAuthorizationTokenForBuildingSolution(tenant, user, password){
	var auth = 'Basic ' + new Buffer(tenant + '\\' + user + ':' + password).toString('base64');
	
	return auth;
}
