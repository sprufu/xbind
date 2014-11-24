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

/**
 * 所有订阅
 * 只订阅离自己最近的model
 * 通知时, 下级model也是订阅之一, 所以通知完自己域内的订阅, 再通知下级model, 从而实现整个结点树都得更新.
 * 取数据时, 从自己可父级取, 这样递归就可以获得整个树全部数据
 */
var SUBSCRIBES = {
	/**
	* 以model的id做键, 再按监听的字段细分
	* some_model_id: {
	* 	some_field_name: [subscribe array]
	* }
	*/
};

var MODELS = {
	/**
	* someid: {
	* 	model: somemode,
	* 	element: somedom,
	* 	parent: somemodeid or null,
	* 	childs: [somemodeid array]
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
	}
});



/**********************************/
/*       系统补丁修复区           */
/**********************************/
if (!''.startsWith) {
	String.prototype.startsWith = function(str) {
		return this.indexOf(str) === 0;
	}
}

if (!''.trim) {
	String.prototype.trim = function(str) {
		// TODO
	}
}

if (!Array.prototype.forEach) {
	Array.prototype.forEach = function(cb) {
		for (var i=0; i<this.length; i++) {
			cb(this[i], i);
		}
	};
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
			v = v[key];
			if (i == keys.length - 1) {
				oldValue = v;
				v[key] = value;
			} else if (!v) {
				v[key] = {};
			}
		}
	} else {
		oldValue = model[field];
		model[field] = value;
	}

	return oldValue;
}

/**
 * 注册model到dom结点上的工厂函数
 * 此函数会修改vm数据
 * 一个结点只绑定一个model, 如果再次绑定会报错, 除非强行绑定, 强行绑定时会清除之前绑定
 *
 * @param {Object} model 绑定的数据, 是一个普通的javascript对象
 *
 * @returns {model} 返回绑定后的数据, 这是一个全新的数据, 已经不是传入的model啦, 在原有的数据上添加一些属性
 */
function factory(model) {
	if (!exports.isPlainObject(model)) {
		throw new TypeError('model必须是普通的javascript对象.');
	}

	if (!model.$id) {
		model.$id = '$' + Math.random().toString(36).substr(2);
	} else if (MODELS[model.$id]) {
		throw new Error('不能使用一个已经存在的model id.');
	}

	// 赋予model一些特殊属性
	model.$set = function(field, value) {
		var oldValue = setFieldValue(model, field, value);
		notifySubscribes(model, field, value, oldValue);
	}

	model.$get = function(field) {
		// TODO
		return model[field];
	}

	MODELS[model.$id] = {
		model: model,
		element: null,
		parent: null
	};

	return model;
}

/**
 * 注册监听
 */
function register(observer, model, field) {
	if (!SUBSCRIBES[model.$id]) {
		SUBSCRIBES[model.$id] = {};
	}

	if (!SUBSCRIBES[model.$id][field]) {
		SUBSCRIBES[model.$id][field] = [];
	}

	SUBSCRIBES[model.$id][field].push(observer);
}

/**
 * 获取一个数据的所有订阅
 */
function subscribes (model, field) {
	try {
		return SUBSCRIBES[model.$id][field];
	} catch (err) {
		return [];
	}
}

/**
 * 获取监听的字段列表
 */
function subscribeFields(model) {
	return SUBSCRIBES[model.$id] || {};
}


/**
 * 通知订阅者
 */
function notifySubscribes(model, field, value, oldValue) {
	var subs = subscribes(model, field), i, sub;
	for (i=0; i<subs.length; i++) {
		sub = subs[i];
		sub.update.call(model, value, oldValue);
	}
}

/**
 * 手动触发更新视图
 * @param {String|Null} 当不提供field时, 更新所有字段
 */
function fireUpdate(model, field) {
	if (field) {
		var value = model.$get(field);
		notifySubscribes(model, field, value, value);
	} else {
		var fields = subscribeFields(model);
		for(var f in fields) {
			fireUpdate(model, f);
		}
	}
}


/**********************************/
/*          系统扫描区            */
/**********************************/

/**
 * 扫描结点, 添加绑定
 */
function scan(element, model) {
	element = element || document.getElementsByTagName('html')[0];
	model = model || null;

	switch(element.nodeType) {
	// 普通结点
	case 1:
		model = scanAttrs(element, model) || model;
		scanChildNodes(element, model);
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
		el = el.nextSibling;
	}
}

/**
 * 扫描某个结点的属性
 * 一个结点只能生成一次model
 * TODO 某个属性扫描后, 移出其同名的className
 * @param {Element} element 结点对象
 * @param {Model} parentModel 父级model
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
				model: element.$modelId ? MODELS[element.$modeId] : null,
				element: element,
				type: item.type,
				value: attr.value
			}, attr) || model;
		}
	}

	return model;
}

function scanText(element, parentModel) {
	var fields = {},
	expr = parseString(element.nodeValue, fields),
	fun, observer;

	// 没有绑定不处理
	if (exports.isEmptyObject(fields)) {
		return;
	}

	fun = new Function('$model', 'return '+expr);
	observer = {
		update: function(value, old) {
			// TODO 没有充分的使用 value, 而去计算 model.$get
			// TODO 是否应该异步更新视图
			element.data = fun(this);
		}
	}
	for(var field in fields) {
		if (parentModel) {
			register(observer, parentModel, field);
		}
	}
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

	var i = attrs.length, attr, params, endpos, type;
	while (i--) {
		attr = attrs[i];

		// 过滤ie67的element.attributes得到一大堆属性
		if (!attr.specified) {
			continue;
		}

		if (attr.name.startsWith('x-')) {
			endpos = attr.name.indexOf('-', 2);
			if (~endpos) {
				type = attr.name.substr(0, endpos);
			}
		} else if (!optScanHandlers[attr.name]) {
			continue;
		}

		if (!type) {
			type = attr.name;
		}

		res.push({
			index: i,
			type: type,
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

/**
 * 获取某个结点的model
 * 如果这结点没有定义model, 则返回null
 */
exports.getModel = function(el) {
	try {
		return MODELS[el.$modelId].model;
	} catch (err) {
		return null;
	}
}

exports.getParentModel = function(el) {
	// TODO
	return null;
}
