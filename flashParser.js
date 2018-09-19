var fs = require('fs');

module.exports = {
    createFlashObject: function (raw, callback) {

        var rawWords = [];
        for (var i = 0; i < raw.length; i += 4) {
            rawWords[i / 4] = (raw[i + 3] << 24) + (raw[i + 2] << 16) + (raw[i + 1] << 8) + (raw[i]);
        }

        var wordIndex = 512;
        var located = false;
        while (located == false) {
            if (wordIndex < 60) {
                located = true;
            }
            else if (rawWords[wordIndex] != 0xFFFFFFFF) {
                var xsum = calculateXSum(rawWords.slice(wordIndex - 59, wordIndex), 59);
                if (xsum == rawWords[wordIndex]){
                    located = true;
                }
                else {
                    wordIndex--;
                }
            }
            else {
                wordIndex--;
            }
        }

        var words = rawWords.slice(wordIndex - 59, wordIndex + 1);
        
        fs.readFile("struct.c", 'utf8', function (err, data) {
            if (err) {
                callback(err, null)
            }
            else {
                var parsedLines = [];
                var lines = data.split("uint32_t");
                lines.forEach(line => {
                    line = line.replace(/(\r\n|\n|\r|\t)/gm, "");
                    line = line.replace(';', '');
                    line = line.split('//');
                    line = line[0].split(':');

                    var variable = {
                        name: line[0],
                        value: line[1]
                    }
                    if (variable.value == undefined) {
                        variable.value = '0';
                    }
                    variable.value = variable.value.replace(' ', '');
                    variable.name = variable.name.replace(/ /g, '')
                    variable.value = parseInt(variable.value);

                    if (variable.name != '') {
                        if (variable.value == 0) {
                            variable.value = 32;
                        }
                    }
                    if (variable.name.indexOf('[') > -1) {

                        let array = variable.name.split('[');
                        array[1] = array[1].replace(']', '');
                        if (array[1] == 'USER_DATA_LEN') {
                            variable.value = 32 * 5;
                        }
                        if (array[1] == 'NON_LINEAR_DATA_LEN') {
                            variable.value = 32 * 10;
                        }
                        variable.name = array[0];
                    }
                    parsedLines.push(variable);
                });

                var bitIndex = 0;
                var obj = [];
                parsedLines.forEach(parsed => {
                    if (parsed.name != '') {
                        var objVar = {
                            name: parsed.name,
                            index: Math.floor(bitIndex / 32),
                            shift: 32 - (bitIndex % 32) - parsed.value,
                            length: parsed.value
                        };
                        obj.push(objVar);
                    }
                    bitIndex += parsed.value;
                });

                var flashObject = {};

                obj.forEach(object => {
                    if (object.length > 32) {
                        flashObject[object.name] = [];
                        for (var i = 0; i < object.length; i += 32) {
                            var thisObject = words[object.index + i / 32]
                            if (thisObject < 0) {
                                thisObject += 0x100000000;
                            }
                            flashObject[object.name].push(thisObject);
                        }
                    }
                    else if (object.length == 32) {
                        flashObject[object.name] = words[object.index];
                        if (flashObject[object.name] < 0) {
                            flashObject[object.name] += 0x100000000;
                        }
                    }
                    else {
                        var andValue = ((0x01 << object.length) - 1) << (32 - (object.length + object.shift));
                        if (andValue < 0) {
                            andValue += 0x100000000;
                        }
                        var shiftValue = (32 - (object.length + object.shift));
                        flashObject[object.name] = (words[object.index] & andValue) >> shiftValue;
                        if (flashObject[object.name] < 0) {
                            flashObject[object.name] += 0x100000000;
                        }
                    }
                });
                callback(null, flashObject);
            }
        });
    }
}

function calculateXSum(wordArray, length) {
    var xsum = 0x00000000;

    for (var i = 0; i < length; i++){
        xsum += wordArray[i];
        if (xsum >= 0x100000000) {
            xsum -= 0x100000000;
        }
        if (xsum < 0) {
            xsum += 0x100000000;
        }
    }
    return xsum;
}