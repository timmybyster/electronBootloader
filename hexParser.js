/* hexParser.js
created by : Tim Buckley
2018/06/03 */

const BLOCK_SIZE = 0x800;
const START_ADDRESS = 0x10000;

var fs = require('fs');
var crc = require('./crc');

module.exports = {
	parse : function(file, callback){
		console.log(file);
		var addressSegment = 0;
		var code = [];
		var i = 0;
		var j = 0;
		var blockAddress;
		var block;
		
		fs.readFile(file, 'utf8', function(err, data) {  
            if (err) {
                callback(err, null)
            }
            else {

                var crcs = [];

                var lines = data.split(":");

                var blocks = ((lines.length) >> 7) + 1;

                var fs = require('fs');

                for (var k = 0; k < blocks; k++) {
                    var codeBlock = [];
                    code.push(codeBlock);
                }

                console.log("Parsing " + blocks + " blocks");

                lines.forEach(lin => {
                    var line = lin.split('');
                    var parsed = [];
                    for (j = 0; j < line.length; j += 2) {
                        parsed.push(parseInt(line[j] + line[j + 1], 16));
                    }

                    var parsedLine = createParsedLine(parsed);

                    switch (parsedLine.type) {
                        case 0:
                            for (var i = 0; i < parsedLine.data.length; i++) {
                                blockAddress = (addressSegment + parsedLine.address + i) % BLOCK_SIZE;
                                block = (addressSegment + parsedLine.address + i) >> 11;
                                code[block][blockAddress] = parsedLine.data[i];
                            }
                            break;

                        case 1:
                            break;

                        case 2:
                            addressSegment = (parsedLine.data[0] * 256 * 16) - START_ADDRESS;
                            break;

                        case 3:
                            break;
                    }
                });

                for (var i = 0; i < code.length; i++) {
                    var fileName = "blocks/block" + i.toString() + ".json";

                    var blockObject = createBlockObject(code[i], i);
                    crcs.push((blockObject.crc >> 24) & 0xFF);
                    crcs.push((blockObject.crc >> 16) & 0xFF);
                    crcs.push((blockObject.crc >> 8) & 0xFF);
                    crcs.push(blockObject.crc & 0xFF);

                    fs.writeFile(fileName, JSON.stringify(blockObject), function (err) {
                        if (err)
                            callback(err, null);
                    });
                };

                var info = {
                    blockCount: blocks,
                    crc: crc.calculate(crcs, crcs.length)
                }

                fs.writeFile("blocks/blocks.json", JSON.stringify(info), function (err) {
                    if (err) {
                        callback(err, null);
                    }
                    else {
                        callback(null, blocks);
                    }
                });

            }
		});
	},
	
	getBlock : function(block, callback){
		var fileName = "blocks/block" + block.toString() + ".json";
		var block = null;
		fs.readFile(fileName, 'utf8', function(err, blockData){
			if(err){
				callback(err, null);
			}
			else{
				block = JSON.parse(blockData);
				callback(null, JSON.parse(blockData)); 
			}
		});
	},
	
	getTotalBlocks : function(callback){
		fs.readFile("blocks/blocks.json", 'utf8', function(err, data){
			if(err){
				callback(err, null);
			}
            else {
                var parsed = JSON.parse(data);
                callback(null, parsed.blockCount);
			}
		});
    },

    getTotalCrc: function (callback) {
        fs.readFile("blocks/blocks.json", 'utf8', function (err, data) {
            if (err) {
                callback(err, null);
            }
            else {
                var parsed = JSON.parse(data);
                callback(null, parsed.crc);
            }
        });
    }
}

function createParsedLine(raw){
	var parsed = {
		length : raw[0],
		type : raw[3],
		address : raw[1]*256 + raw[2],
		data : raw.splice(4, raw[0])
	}

	return parsed;
}

function createBlockObject(data, block){
	
	for (var i = data.length; i < 2048; i++){
		data.push(0xFF);
	}
	
	var blockObject = {
		address : START_ADDRESS + (block * 2048),
		data : data,
		crc : crc.calculate(data, 2048)
	}
	
	return blockObject;
}
	