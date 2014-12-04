/**
 * @file 浏览器补丁, 主要用来兼容ie678
 * 如果不考虑ie678, 可以去掉这个文件
 * @author jcode
 */
if (!''.trim) {
	var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g
	String.prototype.trim = function(str) {
		return this.replace(rtrim, '');
	}
}

if (!Array.prototype.forEach) {
	Array.prototype.forEach = function(cb) {
		for (var i=0; i<this.length; i++) {
			cb(this[i], i);
		}
	};
}

if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(el) {
		for (var i=0; i<this.length; i++) {
			if (el == this[i]) {
				return i;
			}
		}
		return -1;
	}
}

if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(el) {
		for(var i=0; i<this.length; i++) {
			if (this[i] == el) {
				return i;
			}
		}
		return -1;
	}
}
