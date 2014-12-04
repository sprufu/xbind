

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
