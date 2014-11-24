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
	'x-if': 50
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

function booleanHandler (data) {
	var value = data.value.toLowerCase(),
	type = data.type;

	// 如果是类似: disabled="disabled"或disabled="true", 不处理
	if (value == type || value == "true") {
		return;
	}

	// TODO 绑定结果
}

function stringBindHandler (data) {
	// TODO 
}

function stringXBindHandler(data) {
	// TODO
}

'disabled checked selected'.split(' ').forEach(function(type) {
	optScanHandlers[type] = booleanHandler;
});

'src href target'.split('.').forEach(function(type) {
	optScanHandlers[type] = stringBindHandler;
});

'x-src x-href'.split('.').forEach(function(type) {
	optScanHandlers[type] = stringXBindHandler;
})

exports.extend(optScanHandlers, {
	'x-skip': function(data) {
		return false;
	},
	'x-controller': function(data) {
		var model = exports.define(data.element, {
			$id: data.value
		});
		setInterval(function() {
			model.$set('test', new Date);
		}, 1000);
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

