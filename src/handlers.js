/**
 * 属性扫描定义的回调
 */

// 忽略的标签
var optIgonreTag = {
	script: true,
	noscript: true,
	iframe: true
};

// 扫描优先级, 没有定义的都在1000
var optPriority = {
	'x-skip': 0,
	'x-controller': 10,
	'x-each': 20,
	'x-with': 30,
	'x-if': 50,
	'href': 3000
};

var optScanHandlers = {
	/**
	 * 以属性名为键, 回调为值
	* attrname: function(data[, priority]) {
	*    data.type // 属性名, 如 href, x-href
	*    data.element // 定义的dom结点对象
	*    data.param // 参数, 跟avalon学的, 如果为 x-repeat-item的话, 这返回 item
	*    data.value // 属性值, 如 x-repeat="testvalue" 的话, 这返回 testvalue字符串
	*    data.model // 结点绑定的model, 没有绑定的话返回null
	*    priority // 优先级顺序, 省略时默认1000
	* }
	*/
};

function booleanHandler (data, attr) {
	var value = data.value.toLowerCase(),
	type = data.type;

	// 如果是类似: disabled="disabled"或disabled="true", 不处理
	if (value == type || value == "true") {
		return;
	}

	var fields = {},
	expr = parseExpress(data.value, fields);
	if (!exports.isEmptyObject(fields)) {
		var fun, observer, model = data.model;
		fun = new Function('$model', 'return '+expr);
		observer = {
			update: function(value, old) {
				var res = fun(this);
				if (res) {
					data.element.setAttribute(data.type, data.type);
				} else {
					data.element.removeAttribute(data.type);
				}
			}
		}
		for(var field in fields) {
			if (model) {
				observer.update.call(model);
				register(observer, model, field);
			}
		}
	}
}

function stringBindHandler (data, attr) {
	var fields = {},
	expr = parseString(data.value, fields);
	if (!exports.isEmptyObject(fields)) {
		var fun, observer, model = data.model;
		fun = new Function('$model', 'return '+expr);
		observer = {
			update: function(value, old) {
				attr.value = fun(this);
			}
		}
		for(var field in fields) {
			if (model) {
				observer.update.call(model);
				register(observer, model, field);
			}
		}
	}
}

function stringXBindHandler(data, attr) {
	var fields = {},
	expr = parseString(data.value, fields);
	if (!exports.isEmptyObject(fields)) {
		var fun, observer,
		attrName = data.type.substr(2),
		model = data.model;
		fun = new Function('$model', 'return '+expr);
		observer = {
			update: function(value, old) {
				data.element.setAttribute(attrName, fun(this));
			}
		}
		for(var field in fields) {
			if (model) {
				observer.update.call(model);
				register(observer, model, field);
			}
		}
	}
}

'disabled checked selected'.split(' ').forEach(function(type) {
	optScanHandlers[type] = booleanHandler;
});

'src href target'.split(' ').forEach(function(type) {
	optScanHandlers[type] = stringBindHandler;
});

'x-src x-href'.split(' ').forEach(function(type) {
	optScanHandlers[type] = stringXBindHandler;
})

exports.extend(optScanHandlers, {
	'x-skip': function(data) {
		return false;
	},
	'x-controller': function(data) {
		var id = data.value,
		vmodel = MODELS[id];
		if (vmodel && !vmodel.element) {
			vmodel.element = data.element;
			vmodel.parent = exports.getParentModel(data.element);
			vmodel.element.$modelId = vmodel.model.$id;
		} else {
			// throw new Error('未定义vmodel');
			return;
		}
		return vmodel.model;
	},
	'x-repeat': function(data) {
		// TODO
	},
	'x-if': function(data) {
		// TODO
	},
	'x-class': function(data) {
		// TODO
	},
	'x-ajax': function(data) {
		// TODO
	},
	'x-grid': function(data) {
		// TODO
	},
	'x-style': function(data) {
		// TODO
	}
});

