/* crc.js
created by : Tim Buckley
2018/06/03 */

var table = [];
var have_table = 0;

module.exports = {
	calculate : function(buf, len){
		var rem;
		var octet;
		var i; var j;
		var p; var q;
		var crc = 0;
		
		if (have_table == 0) {
			
			for (i = 0; i < 256; i++) {
				rem = i;
				for (j = 0; j < 8; j++) {
					if (rem & 1) {
						rem >>>= 1;
						rem ^= 0xedb88320;
					} else
						rem >>>= 1;
				}
				table[i] = rem;
				if(table[i] < 0)
				{
					table[i] += 0x100000000;
				}
			}
			have_table = 1;
		}

		crc = ~crc;
		
		for(i = 0; i < len; i++){
			 octet = buf[i];
			 crc = (crc >>> 8) ^ table[(crc & 0xff) ^ octet] & 0xFFFFFFFF;
		}
		
		if(crc < 0){
			crc += 0x100000000;
		}
		return crc;
	}
}
	