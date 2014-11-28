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

	bindModel(data.model, data.value, parseExpress, function(res, value, oldValue) {
		if (res) {
			data.element.setAttribute(data.type, data.type);
		} else {
			data.element.removeAttribute(data.type);
		}
	});
}

function stringBindHandler (data, attr) {
	bindModel(data.model, data.value, parseString, function(res, value, oldValue) {
		attr.value = res;
	});
}

function stringXBindHandler(data, attr) {
	var attrName = data.type.substr(2);
	bindModel(data.model, data.value, parseString, function(res, value, oldValue) {
		data.element.setAttribute(attrName, res);
	});
}

'disabled checked selected'.split(' ').forEach(function(type) {
	optScanHandlers[type] = booleanHandler;
});

'src href target'.split(' ').forEach(function(type) {
	optScanHandlers[type] = stringBindHandler;
});

'x-src x-href'.split(' ').forEach(function(type) {
	optScanHandlers[type] = stringXBindHandler;
});

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

	'x-show': function(data, attr) {
		bindModel(data.model, data.value, parseExpress, function(res, value, oldValue) {
			data.element.style.display = res ? "" : "none";
		});
	},

	'x-value': function(data, attr) {
		// TODO
		var model = exports.getModel(data.element) || exports.getParentModel(data.element);
		function addListen(type) {
			exports.on(data.element, type, function(e) {
				model.$set(data.value, data.element.value);
			});
		}
		switch(data.element.tagName) {
			case 'INPUT':
				switch(data.element.type) {
					case 'checkbox':
						var v = model.$get(data.value);
						if (v && !exports.isArray(v)) {
							throw new TypeError('Checkbox bind must be array.');
						}

						if (!v) {
							model.$set(data.value, []);
						}

						exports.on(data.element, 'click', function(e) {
							var el = ie678 ? e.srcElement : this,
							value = model.$get(data.value),
							item = el.value;

							if (el.checked) {
								value.push(item);
							} else {
								// 删除掉元素
								var i = value.length;
								while (i--) {
									if (item == value[i]) {
										value.splice(i, 1);
									}
								}
							}

							model.$set(data.value, value);
						});
					break;
					case 'radio':
						exports.on(data.element, 'click', function(e) {
							model.$set(data.value, ie678 ? e.srcElement.value : this.value);
						});
					break;
					default:
						addListen('keyup');
						addListen('change');
					break;
				}
			break;
			case 'SELECT':
				exports.on(data.element, 'change', function(e) {
					var value, el;
					if (ie67) {
						el = data.element.options[data.element.selectedIndex];
						if (el.attributes.value.specified) {
							value = el.value;
						} else {
							value = el.text;
						}
					} else if (ie678) {
						value = data.element.options[data.element.selectedIndex].value;
					} else {
						value = this.value;
					}
					model.$set(data.value, value);
				});
			break;
			case 'TEXTAREA':
				addListen('keyup');
				addListen('change');
			break;
		}
	},

	/**
	 * class类操作
	 * avalon用 ms-class="className: expr",
	 * 但我觉得x-class-className="expr" 更直观些,
	 * 且当操作多个class时不需要像avalon那样添加杂质.
	 * 但这样有个问题, 就是类名只能用小写, 因为属性名都会转化为小写的
	 * 当expr结果为真时添加class, 否则移出
	 */
	'x-class': function(data) {
		bindModel(data.model, data.value, parseExpress, function(res, value, oldValue) {
			if (res) {
				exports.addClass(data.element, data.param);
			} else {
				exports.removeClass(data.element, data.param);
			}
		});
	},
	'x-ajax': function(data) {
		var model = exports.getModel(data.element) || factory();

		if (!data.element.$modelId) {
			data.element.$modelId = model;
		}

		ajax({
			type: 'GET',
			dataType: 'json',
			cache: false,
			url: data.value,
			success: function(res) {
				model.$set(data.param, res);
			},
			error: function(xhr, err) {
				model.$set(data.param + '.$error', err);
			}
		});

		return model;
	},
	'x-grid': function(data) {
		// TODO
	},
	'x-style': function(data) {
		// TODO
	}
});

