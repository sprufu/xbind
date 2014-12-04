/**
 * @file 数据模型
 * 所有通过工厂函数加工过的数据, 都是以这个为原型
 * @author jcode
 */

/**
 * 存储所有的数据
 * 以数据的id为键索引
 */
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
	// 拷贝所有的数据到自己的属性上
	extend(this, vm);

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
	/**
	 * 获取某个字段的值
	 * @param {string} field 字段, 可以是深层的, 如: user.name
	 * @returns {object} 从当前数据查找, 如果不存在指定的键, 则向上查找, 除非明确指定noExtend
	 */
	$get: function(field, noExtend) {
		if (~field.indexOf('.')) {
			// 深层处理, 如: user.name
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

	/**
	 * 设置一个字段的值
	 * 这与this.field = value有几点不同:
	 *    1. 可以直接设置深层数据, 如: $set("user.name", "jcode")
	 *    2. 当user为空$set("user.name", "jcode")也会成功
	 *    3. 这会触发视图更新
	 */
	$set: function(field, value) {
		var oldValue = setFieldValue(this, field, value);
		this.$notifySubscribes(field, value);
	},

	/**
	 * 订阅数据更新
	 * 相当于angular的$watch
	 * @see $notifySubscribes
	 * @see $unsubscribe
	 */
	$subscribe: function(field, observer) {
		if (!this.$subscribes[field]) {
			this.$subscribes[field] = [];
		}
		this.$subscribes[field].push(observer);
	},

	/**
	 * 取消订阅
	 * @see $subscribe
	 * @see $notifySubscribes
	 */
	$unsubscribe: function(field, observer) {
		if (this.$subscribes[field]) {
			this.$subscribes[field].remove(observer);
		}
	},

	/**
	 * 通知订阅者更新自己
	 * @see $subscribe
	 * @see $unsubscribe
	 */
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

	/**
	 * 绑定数据到结点上去
	 * 一个结点只能绑定一个数据
	 */
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
