/* serialPort.js
created by : Tim Buckley
2017/08/04 */

var buffer = [];								
var bufferIndex = 0;												
const BUFFER_SIZE = 3000;
const RX_TIMEOUT = 1000;

var raw = [];
var rawLength = 0;

var rxPtr = 0;
var interruptCounter = 0;

const START_BYTE 	= 0xAA;
const ESCAPE_BYTE 	= 0x1B;
const EOT_BYTE		= 0x14;

var env = require('./environmentVariables');						
const serialPort = require('serialport');							
const byteLength = serialPort.parsers.ByteLength;					
var port;
var parser;

var deviceDetect = false;

module.exports = {
	
    getPorts: function (callback) {
        serialPort.list().
        then(result => {
            callback(null, result);
        },
        error => {
            callback(error, null);
        });
    },

    close: function(callback){
		
		try {
            port.close((err, result) => {
                if (err) {
                    console.log("Port is Not Open");
                }
                else {
                    callback();
                }
            });
        } catch (e) {
            console.log("Port is Not Open");
        }
    },

    initialise: function (portName, callback) {
        buffer = [];
		bufferIndex = 0;
		deviceDetected = false;
		var initialTimeout;
        try {
			
			console.log("OPENING: " + portName);
			port = new serialPort(portName, { baudRate: 38400 }, (err, result) => {
                if (err) {
                    callback(err);
                }
                else {
                    parser = port.pipe(new byteLength({ length: 1 }));

                    parser.on('data', function (data) {
                        byte = parseInt(data[0]);
                        buffer[bufferIndex] = byte;
                        bufferIndex++;
                        if (bufferIndex == BUFFER_SIZE) {
                            bufferIndex = 0;
						}
						if((buffer[bufferIndex - 1] == 0x9E) && (buffer[bufferIndex - 2] == 0xEF) && (buffer[bufferIndex - 3] == 0x04) && (buffer[bufferIndex - 4] == 0xAB) && (deviceDetected == false)){
							deviceDetected = true;
							clearTimeout(initialTimeout);
							callback(null, "packet Detected");
						}

					});
					initialTimeout = setTimeout(() => {
						callback(null, "Nothing detected");
					}, 200);

                    
                }
            });
        } catch (e) {
            callback("Port Error", null);
        }
    },

    start: function (portName) {
        buffer = [];
        bufferIndex = 0;
        port = new serialPort(portName, { baudRate: 57600 });
        parser = port.pipe(new byteLength({ length: 1 }));

        parser.on('data', function (data) {
            byte = parseInt(data[0]);
            buffer[bufferIndex] = byte;
            bufferIndex++;
            if (bufferIndex == BUFFER_SIZE) {
                bufferIndex = 0;
            }
        });
	},
	
	checkResponse : function(){
		var command = 0;
		raw[0] = 0;
		var tempIndex = bufferIndex;
		var i = 0;
		var j = 0;
		var start = false;
		var escape = false;
		var end = false;
		
		while(circularIndex(rxPtr + i) != tempIndex && end == false){
			if(buffer[circularIndex(rxPtr + i)] == ESCAPE_BYTE || buffer[circularIndex(rxPtr + i)] == EOT_BYTE || buffer[circularIndex(rxPtr + i)] == START_BYTE){
				if(escape == true){
					raw[j] = buffer[circularIndex(rxPtr + i)];
					if(start == true){
						j++;
					}
					escape = false;
				}
				else {
					if(buffer[circularIndex(rxPtr + i)] == ESCAPE_BYTE){
						escape = true;
					}
					else if(buffer[circularIndex(rxPtr + i)] == START_BYTE){ 
						start = true;
					}
					else if(buffer[circularIndex(rxPtr + i)] == EOT_BYTE){ 
						end = true;
					}
				}
			}
			else{
				raw[j] = buffer[circularIndex(rxPtr + i)];
				if(start == true){
					j++;
				}
			}
			i++;
		}
		if(end == true){
			rxPtr = circularIndex(rxPtr + i);
			if(start == true){
				rawLength = j;
			}
			else{
				raw[0] = 0;
			}
		}
		else{
			raw[0] = 0;
		}
		return raw[0]; 
	},

	getAddress : function(){
		var address = raw[1] << 24;
		address += raw[2] << 16;
		address += raw[3] << 8;
		address += raw[4];
		return address;
	},
	
	getData : function(){
		var data = [];
		for(var i = 5; i < rawLength - 4; i++){
			data.push(raw[i]);
		}
		return data;
	},
	
	getCrc : function(){
		var crc = raw[rawLength - 4] << 24;
		crc += raw[rawLength - 3] << 16;
		crc += raw[rawLength - 2] << 8;
		crc += raw[rawLength - 1];
		if(crc < 0){
			crc += 0x100000000;
		}
		return crc;
	},
	
	write : function(object, callback){
		port.write(object, function(err){
			if(err)
				callback(err, null);
			else
				callback(null, "Write to Port: " + object);
		});
	}
}

function circularIndex(index){
	if(index >= BUFFER_SIZE){
		index -= BUFFER_SIZE;
	}
	return index;
}

function buildResetPacket(){
    var packet = [];
    /*55 01 80 02 01 01 B4 54 AA*/ 
    packet.push(0xAA);
    packet.push(0x01);
    packet.push(0x80);
    packet.push(0x02);
    packet.push(0x01);
    packet.push(0x01);
    packet.push(0xB4);
    packet.push(0x54);
    packet.push(0x55);

    return packet;
}