/* serialPort.js
created by : Tim Buckley
2017/08/04 */

var uart = require('./serialPort');
const hexParser = require('./hexParser');

const MIN_PACKET_LENGTH = 8;

var index = 0;
var interval = null;
var timeout = null;
var comPort = null;
var resetLoopInterval = null;
var resetInterval = null;
var resetRetries = 0;



const COMMAND = {
		NO_RESPONSE : 	0x0,
		DATA : 			0x1,
		RESET : 		0x2,
		BOOT : 			0x3,
        INFO :          0x4,
		VERIFY : 		0x5,
		READ : 			0x6
	};

module.exports = {
	initialise : function(callback){
        var response = 0;
        var comPorts = 0;
        var comIndex = 0;
        resetRetries = 0;

        clearInterval(resetLoopInterval);
        clearInterval(resetInterval);
        resetLoopInterval = null;
        resetInterval = null;
        console.log("Clearing Intervals");

        uart.close(() => { });

        resetInterval = setInterval(function () {
            uart.getPorts(function (err, ports) {
                if (err) {
                    console.log(err);
                }
                else {
                    comPorts = ports;
                }
            });
        }, 1000);

        resetLoopInterval = setInterval(function () {
            if (comPorts.length > 0) {
                switch (response) {
                    case 0:
                        response = 1;
                        uart.initialise(comPorts[comIndex].comName, function (err, result) {
                            if (err) {
                                response = 2;
                                console.log(err);
                            }
                            else {
                                if(result == "packet Detected"){
                                    console.log("DEVICE CONNECTED");
                                    uart.write(buildResetPacket(), () => {
                                        uart.write(buildResetPacket(), () => {
                                            uart.write(buildResetPacket(), () => {
                                                    
                                                setTimeout(() => {
                                                    reset((err, result) => {
                                                        if(err){
                                                            console.log(err);
                                                            uart.close(() => { });
                                                            response = 2;
                                                        }
                                                        else{
                                                            uart.close(() => {
                                                                uart.start(comPorts[comIndex].comName);
                                                                clearInterval(resetLoopInterval);
                                                                clearInterval(resetInterval);    
                                                                callback(null, result);   
                                                            });                                        
                                                        }

                                                    });
                                                }, 20);

                                            });
                                        });
                                    });

                                }
                                else{
                                    reset((err, result) => {
                                        if(err){
                                            console.log("Nothing ON: " + comPorts[comIndex].comName);
                                            uart.close(() => { });
                                            response = 2;
                                        }
                                        else{
                                            uart.close(() => {
                                                uart.start(comPorts[comIndex].comName);
                                                clearInterval(resetLoopInterval);
                                                clearInterval(resetInterval);    
                                                callback(null, result);   
                                            });                                                    
                                        }

                                    });
                                    
                                }
                            }
                        });
                        break;

                    case 1:
                        break;

                    case 2:
                        response = 0;
                        comIndex++;
                        if (comIndex == comPorts.length) {
                            callback("Searching for Device", null);
                            comIndex = 0;
                            resetRetries++;
                            if (resetRetries >= 3) {
                                callback("No Device Detected", null);
                            }
                        }
                        break;
                }
            }
        }, 1);
	},
	
	write : function(callback){
		var response = 0;
		var index = 0;
		var total = 0;
		var retries = 0;
		
		hexParser.getTotalBlocks((err, result) => {
			if(err){
				console.log(err)
			}
			else{
				total = result;
			}
		});
		
		var writeInterval = setInterval(function(){
			switch(response){
				case 0 :
				hexParser.getBlock(index, (err, result) => {
					uart.write(buildPacket(COMMAND.DATA, result.address, result.data, result.crc), (err, res) => {
						if(err){
							console.log(err);
						}
						else{
                            console.log("Writing block " + index);
						}
					});
					waitForResponse(COMMAND.DATA, 2000, (err, res) => {
						if(err){
                            console.log(err);
                            callback("No Reply", null);
							retries++;
							if(retries < 3){
								response = 0;
							}
							else{
                                callback("Failed", null);
								clearInterval(writeInterval);
							}					
						}
						else{
							if((uart.getCrc()) == result.crc){
                                callback(null, Math.round(index*100/total) + 1);
								retries = 0;
								response = 2;
							}
							else{
                                console.log("CRC mismatch => Expected: " + result.crc + ". Received: " + (uart.getCrc()));
                                callback("CRC ERROR", null);
								retries++;
								if(retries < 3){
									response = 0;
								}
								else{
                                    callback("Failed", null);
									clearInterval(writeInterval);
								}								
							}
							
						}
					});
				});
				response = 1;
				break;
				
				case 1 :
				break;
				
				case 2 :
				index++;
				
				if(index == total){
                    callback(null, "Success");
					clearInterval(writeInterval);
				}
				else{
					response = 0;
				}
				break;
			}
		}, 1);
	},
	
	verify : function(callback){
		var response = 0;
		var index = 0;
		var total = 0;
		var retries = 0;
		
		hexParser.getTotalBlocks((err, result) => {
			if(err){
				console.log(err)
			}
			else{
				total = result;
			}
		});
		
		var writeInterval = setInterval(function(){
			switch(response){
				case 0 :
				hexParser.getBlock(index, (err, result) => {
					uart.write(buildPacket(COMMAND.VERIFY, result.address, null, result.crc), (err, res) => {
						if(err){
							console.log(err);
						}
						else{
							console.log("Verifying Block " + index);
						}
					});
					waitForResponse(COMMAND.VERIFY, 500, (err, res) =>{
						if(err){
							console.log(err);
                            callback("No Reply", null);
                            retries++;
							if(retries < 3){
								response = 0;
							}
							else{
								callback("Failed", null);
								clearInterval(writeInterval);
							}					
						}
						else{
							if((uart.getCrc()) == result.crc){
                                callback(null, Math.round(index * 100 / total) + 1);
                                retries = 0;
								response = 2;
							}
							else{
                                callback("CRC ERROR", null);
                                console.log("CRC mismatch => Expected: " + result.crc + ". Received: " + (uart.getCrc()));
								retries++;
								if(retries < 3){
									response = 0;
								}
								else{
									callback("Failed", null);
									clearInterval(writeInterval);
								}								
							}
							
						}
					});	
				});
				
				response = 1;
				break;
				
				case 1 :
				break;
				
				case 2 :
				index++;
				
				if(index == total)
				{
					callback(null, "Success");
					clearInterval(writeInterval);
				}
				else{
					response = 0;
				}
				break;
			}
		}, 1);
	},
	
	read : function(callback){
	    uart.write(buildPacket(COMMAND.READ, null, null, null), (err, res) => {
			if(err){
				console.log(err);
			}
			else{
				console.log("Reading User Flash...");
			}
        });
        waitForResponse(COMMAND.READ, 2000, (err, result) => {
            if (err) {
                callback(err);
            }
            else {
                callback(null, uart.getData());
            }
        });
					
	},
	
    boot: function (callback) {
        hexParser.getTotalCrc(function (err, crc){
            if (err) {
                console.log(error);
            }
            else {
                uart.write(buildPacket(COMMAND.BOOT, null, null, crc), (err, result) => {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        console.log(result);
                    }
                });
                waitForResponse(COMMAND.BOOT, 5000, (err, result) => {
                    if (err) {
                        callback(err);
                    }
                    else {
                        callback(null, "Success");
                    }
                });
            }
        });
    },

    info: function (blocks, callback) {
        hexParser.getTotalCrc((err, crc) => {
            if (err) {
                console.log(err);
            }
            else {
                uart.write(buildPacket(COMMAND.INFO, blocks, null, null), (err, result) => {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        console.log(result);
                    }
                });
                waitForResponse(COMMAND.INFO, 3000, (err, result) => {
                    if (err) {
                        callback(err);
                    }
                    else {
                        var infoData = {
                            thisCrc : crc,
                            deviceCrc: uart.getCrc(),
                            thisBlocks: blocks,
                            deviceBlocks: uart.getAddress()
                        }
                        callback(null, infoData);
                    }
                });
            }
        });
    }
}

function waitForResponse(command, timeoutLength, callback){
	
	timeout = setTimeout(function(){
			callback("NO RESPONSE", null);
			clearInterval(interval);
			timeout = null;
			interval = null;
			
	}, timeoutLength);
	
	interval = setInterval( function (){
		var response = uart.checkResponse();
		switch(response){
			case COMMAND.NO_RESPONSE :
			break;
			
			case (command + 0x10) :
			clearInterval(interval);
			clearTimeout(timeout);
			timeout = null;
			interval = null;
			callback(null, response);
			break;
			
			default :
			break;
		}
	}, 1);
}

function buildPacket(command, address, data, crc){
	var packet = [];
	/*Command*/
	packet.push(command);
	/*address*/
	let packetAddress = 0x00000000;
	if(address != null)
	{
		packetAddress = address;
	}
	packet.push((address >> 24) & 0xFF);
	packet.push((address >> 16) & 0xFF);
	packet.push((address >> 8) & 0xFF);
	packet.push(address & 0xFF);
	/*data*/
	if(data != null){
		packet = packet.concat(data);
	}
	/*crc*/
	let packetCrc = 0x00000000;
	if(crc != null){
		packetCrc = crc;
	}
	packet.push((packetCrc >> 24) & 0xFF);
	packet.push((packetCrc >> 16) & 0xFF);
	packet.push((packetCrc >> 8) & 0xFF);
	packet.push(packetCrc & 0xFF);
	
	/*add in any escape Characters*/
	var result = [];
	result.push(0xAA);
	for(var i = 0; i < packet.length; i++){
		if(packet[i] == 0x1B || packet[i] == 0x14 || 0xAA == packet[i]){
			result.push(0x1B);
		}
		result.push(packet[i]);
	}
	/*Terminating character*/
	result.push(0x14);
	result.push(0x00);
	return result;
}

function reset(callback) {
    uart.write(buildPacket(COMMAND.RESET, null, null, null), (err, result) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log(result);
        }
    });
    waitForResponse(COMMAND.RESET, 50, (err, result) => {
        if (err) {
            callback(err, null);
        }
        else {
            var version = uart.getData();
            var info = createInfoObject(version);
            callback(null, info);
        }
    });
}

function buildResetPacket(){
    var packet = [];
    /*55 01 80 02 01 01 B4 54 AA*/ 
    packet.push(0x55);
    packet.push(0x01);
    packet.push(0x80);
    packet.push(0x02);
    packet.push(0x01);
    packet.push(0x01);
    packet.push(0xB4);
    packet.push(0x54);
    packet.push(0xAA);

    return packet;
}

function createInfoObject(raw){
    var infoObjectRaw = {
        bootVer: raw.splice(0, 4),
        device: raw.splice(0, 3),
        serial: raw.splice(0, 7),
        pcb: raw.splice(0, 12) 
    }
    var infoObject = {
        bootVer: [],
        device: [],
        serial: [],
        pcb: [],
    }
    infoObjectRaw.bootVer.forEach(byte => {
        infoObject.bootVer.push(String.fromCharCode(byte));
    });
    infoObject.bootVer = infoObject.bootVer.join("");
    infoObjectRaw.device.forEach(byte => {
        infoObject.device.push(String.fromCharCode(byte));
    });
    infoObject.device = infoObject.device.join("");
    infoObjectRaw.serial.forEach(byte => {
        infoObject.serial.push(String.fromCharCode(byte));
    });
    infoObject.serial = infoObject.serial.join("");
    infoObjectRaw.pcb.forEach(byte => {
        infoObject.pcb.push(String.fromCharCode(byte));
    });
    infoObject.pcb = infoObject.pcb.join("");
    return infoObject;
}
