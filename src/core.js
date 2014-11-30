/**
 * @file 核心
 * @author jcode
 */

/**********************************/
/*         全局变量定义区         */
/**********************************/

var exports = {};

/**
 * 配置参数, 通过exports.config供用户修改
 */
var options = {
	interpolate: ['{{', '}}']
};

var MODELS = {
	/**
	* someid: {
	* 	model: somemode,
	* 	element: somedom,
	* 	parent: somemodel or null,
	* 	childs: [somemodel array]
	* }
	*/
};

// 判断ie67很简单吧
var ie67 = !"1"[0];

// 判断ie678也很简单, 因为它有个神奇的特性
var ie678 = window == document && document != window;

/**********************************/
/*       底层函数区               */
/**********************************/
exports.extend = function () {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		i = 2;
	}

	if ( typeof target !== "object" && !exports.isFunction(target) ) {
		target = {};
	}

	if ( length === i ) {
		target = this;
		--i;
	}

	for ( ; i < length; i++ ) {
		if ( (options = arguments[ i ]) != null ) {
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				if ( target === copy ) {
					continue;
				}

				if ( deep && copy && ( exports.isPlainObject(copy) || (copyIsArray = exports.isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && exports.isArray(src) ? src : [];

					} else {
						clone = src && exports.isPlainObject(src) ? src : {};
					}

					target[ name ] = extend( deep, clone, copy );

				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	return target;
}

exports.extend(exports, {
	isFunction: function(fn) {
		return 'function' == typeof fn;
	},
	isArray: function(arr) {
		return exports.type(arr) == 'array';
	},
	isPlainObject: function(obj) {
		return exports.type(obj) == 'object';
	},
	isEmptyObject: function(obj) {
		var name;
		for ( name in obj ) {
			return false;
		}
		return true;
	},
	type: function( obj ) {
		var c = {}, s = c.toString.call(obj);
		return s.substring(8, s.length-1).toLowerCase();
	},
	ready: function(fn) {
		if (document.addEventListener) {
			// 标准浏览器用DOMContentLoaded事件实现
			document.addEventListener('DOMContentLoaded', function(e) {
				fn();
			}, false);
		} else {
			// TODO ie678
			setTimeout(fn);
		}
	}
});


function noop(){}


/**********************************/
/*       系统补丁修复区           */
/**********************************/
if (!''.startsWith) {
	String.prototype.startsWith = function(str) {
		return this.indexOf(str) === 0;
	}
}

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

Array.prototype.remove = function(item) {
	var i = this.length;
	while (i--) {
		if (item == this[i]) {
			this.splice(i,1);
		}
	}
}

/**********************************/
/*       数据定义区               */
/**********************************/

/**
 * 更新某个字段的值, 并返回之前的值
 * 是model.$set的底层实现
 */
function setFieldValue(model, field, value) {
	var oldValue, i, v, sub, subs, key, keys;
	if (~field.indexOf('.')) {
		// 深层的数据, 如: user.name, user.job.type
		keys = field.split('.');
		v = model;
		for (i=0; i<keys.length; i++) {
			key = keys[i];
			if (i == keys.length - 1) {
				oldValue = v[key];
				v[key] = value;
			} else if (!v[key]) {
				v[key] = {};
			} else {
				v = v[key];
			}
		}
	} else {
		oldValue = model[field];
		model[field] = value;
	}

	return oldValue;
}

/**
 * model数据对象, 其是一个可观察的对象
 */
function Model(vm) {
	exports.extend(this, vm);

	// 属性不能放到prototype里去定义, 那是公用的地方法.
	this.$parent = null,
	this.$childs = [],
	this.$element = null,
	this.$freeze = false,
	this.$subscribes = {
		/**
		 * 以字段为键
		 * 如: name, user.name, user.name.firstName
		 * 特殊字段名"*"表示所有字段有效
		 * 如: *, user.*
		 *
		 * field: [ subscribe array ]
		 */
	};

	if (!this.$id) {
		this.$id = '$' + Math.random().toString(36).substr(2);
	} else if (MODELS[this.$id]) {
		throw new Error('The model id is exists.');
	}

	MODELS[this.$id] = this;
}

Model.prototype = {
	$get: function(field, noExtend) {
		if (~field.indexOf('.')) {
			var v = this,
			key,
			keys = field.split('.'),
			i = 0;
			for (; i<keys.length; i++) {
				key = keys[i];
				if (v && v.hasOwnProperty(key)) {
					if (i == keys.length - 1) {
						return v[key] || '';
					} else {
						v = v[key];
					}
				} else {
					if (i || noExtend) {
						return '';
					} else {
						return this.$parent ? this.$parent.$get(field) : '';
					}
				}
			}
		} else {
			if (this.hasOwnProperty(field)) {
				return this[field] || '';
			} else {
				return this.$parent ? this.$parent.$get(field) : '';
			}
		}
	},
	$set: function(field, value) {
		var oldValue = setFieldValue(this, field, value);
		this.$notifySubscribes(field, value);
	},
	$subscribe: function(field, observer) {
		if (!this.$subscribes[field]) {
			this.$subscribes[field] = [];
		}
		this.$subscribes[field].push(observer);
	},
	$unsubscribe: function(field, observer) {
		if (this.$subscribes[field]) {
			this.$subscribes[field].remove(observer);
		}
	},
	$notifySubscribes: function(field, value) {
		if (this.$freeze) {
			return;
		}

		var subscribes = getSubscribes(this, field),
		i = 0,
		subscribe;

		for(; i<subscribes.length; i++) {
			subscribes[i].update(this, value, field);
		}
	},
	$bindElement: function(element) {
		if (element.$modelId) {
			throw new Error('不能重复绑定model.');
		}

		var model = this;

		model.$parent = exports.getParentModel(element);
		if (model.$parent) {
			model.$parent.$childs.push(model);
			var observer = {
				update: function(parentModel, value, field) {
					if (!model.hasOwnProperty(field)) {
						model.$notifySubscribes(field, value);
					}
				}
			}
			model.$parent.$subscribe('*', observer);
		}

		element.$modelId = model.$id;
	}
}

/**
 * Observer = {
 *    update: function(model, value, field)
 * }
 */

/**
 * 获取一个数据的所有订阅
 */
function getSubscribes (model, field) {
	var ret = []
	try {
		for (var key in model.$subscribes) {
			if (key == '*' || key.startsWith(field)) {
				ret = ret.concat(model.$subscribes[key]);
			}
		}
	} finally {
		return ret;
	}
}


/**********************************/
/*          系统扫描区            */
/**********************************/

/**
 * 扫描结点, 添加绑定
 */
function scan(element, model) {
	element = element || document.documentElement;
	model = model || null;

	switch(element.nodeType) {
	// 普通结点
	case 1:
		model = scanAttrs(element, model) || model;
		if (element.childNodes.length) {
			scanChildNodes(element, model);
		}
	break;
	// 文本结点
	case 3:
		scanText(element, model);
	break;
	case 9:
		scanChildNodes(element, model);
	break;
	}
}

exports.scan = scan;

function scanChildNodes(element, parentModel) {
	var el = element.firstChild;
	while (el) {
		scan(el, parentModel);
		el = el.$nextSibling || el.nextSibling;
	}
}

/**
 * 扫描某个结点的属性
 * 一个结点只能生成一次model
 * TODO 某个属性扫描后, 移出其同名的className
 * @param {Element} element 结点对象
 * @param {Model} model model
 * @returns {Model} 如果生成model, 则返回model, 否则返回父级model
 */
function scanAttrs(element, model) {
	var attrs = element.attributes,
	list = getScanAttrList(attrs),
	i = list.length,
	item, fn, attr;

	while (i--) {
		item = list[i];
		attr = attrs[item.index];
		fn = optScanHandlers[item.type];
		if (fn) {
			model = fn({
				model: model,
				element: element,
				type: item.type,
				param: item.param,
				value: attr.value
			}, attr) || model;
		}
	}

	return model;
}

function scanText(element, parentModel) {
	bindModel(parentModel, element.data, parseString, function(res, value, oldValue) {
		element.data = res;
	});
}

/**
 * 获取所要扫描的属性列表
 * 这个是一个有序的列表
 * @param {NamedNodeMap} attrs 属性列表, 只读
 * @returns {Array} [{
 *    index: 属性索引,
 *    priority: 优先级, 小的排在前
 * }]
 */
function getScanAttrList(attrs) {
	var res = [];

	if (attrs.length === 0) {
		return res;
	}

	var i = attrs.length, attr, param, endpos, type;
	while (i--) {
		attr = attrs[i];

		// 过滤ie67的element.attributes得到一大堆属性
		if (!attr.specified) {
			continue;
		}

		param = undefined;

		if (attr.name.startsWith('x-')) {
			endpos = attr.name.indexOf('-', 2);
			if (~endpos) {
				type = attr.name.substr(0, endpos);
				param = attr.name.substr(endpos+1);
			} else {
				type = attr.name;
			}
		} else if (!optScanHandlers[attr.name]) {
			continue;
		} else {
			type = attr.name;
		}

		res.push({
			index: attr.name,
			type: type,
			param: param,
			priority: optPriority[type] || 1000
		});
	}

	if (res.length === 0) {
		return res;
	}

	res.sort(function(a,b) {
		return a.priority > b.priority;
	});

	return res;
}

function bindModel(model, str, parsefn, updatefn) {
	var fields = {},
	expr = parsefn(str, fields);
	if (exports.isEmptyObject(fields)) {
		return;
	}

	var fn = new Function('$model', 'return ' + expr),
	observer = {
		update: function(model, value, oldValue) {
			updatefn(fn(model, value, oldValue));
		}
	};

	for (var field in fields) {
		if (model) {
			model.$subscribe(field, observer);
			observer.update(model);
		}
	}
}

/**
 * 获取某个结点的model
 * 如果这结点没有定义model, 则返回null
 */
exports.getModel = function(el) {
	try {
		return MODELS[el.$modelId];
	} catch (err) {
		return null;
	}
}

exports.getParentModel = function(el) {
	var id = el.$modelId;
	if (id) {
		return MODELS[id];
	}

	while (el = el.parentNode) {
		if (el.$modelId) {
			return MODELS[el.$modelId];
		}
	}

	return null;
}

exports.getExtModel = function(el) {
	return exports.getModel(el) || exports.getParentModel(el);
}

exports.extend(exports, {
	addClass: function(el, cls) {
		if (el.classList) {
			el.classList.add(cls);
		} else if (el.className) {
			if (!~el.className.split(' ').indexOf(cls)) {
				el.className = el.className + ' ' + cls;
			}
		} else {
			el.className = cls;
		}
	},
	removeClass: function(el, cls) {
		if (el.classList) {
			el.classList.remove(cls);
		} else if (el.className) {
			var classes = el.className.split(' '),
			i = classes.length;
			while (i--) {
				if (classes[i] == cls) {
					classes.splice(i, 1);
				}
			}
			el.className = classes.join(' ');
		}
	},

	/**
	 * 添加事件监听
	 * @param {Element} el 监听对象
	 * @param {String} type 事件类型, 如click
	 * @param {Function} handler 事件句柄
	 */
	on: function(el, type, handler) {
		if (el.addEventListener) {
			el.addEventListener(type, handler, false);
		} else if (el.attachEvent){
			el.attachEvent('on' + type, handler);
		}
	}
})
