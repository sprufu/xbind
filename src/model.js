/**
 * @file 数据模型
 * 所有通过工厂函数加工过的数据, 都是以这个为原型
 * @author jcode
 */
"use strict";

/**
 * 存储所有的数据
 * 以数据的id为键索引
 */
var MODELS = {
    /**
    * someid: {
    *     model: somemode,
    *     element: somedom,
    *     parent: somemodel or null,
    *     childs: [somemodel array]
    * }
    */
};

/**
 * 更新某个字段的值, 并返回之前的值
 * 是model.$set的底层实现
 */
function setFieldValue(model, field, value) {
    var i, v, sub, subs, key, keys;
    if (~field.indexOf('.')) {
        // 深层的数据, 如: user.name, user.job.type
        keys = field.split('.');
        v = model;
        for (i=0; i<keys.length; i++) {
            key = keys[i];
            if (i == keys.length - 1) {
                v[key] = value;
            } else if (!v[key]) {
                v[key] = {};
            } else {
                v = v[key];
            }
        }
    } else {
        model[field] = value;
    }
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
                        return v[key];
                    } else {
                        v = v[key];
                    }
                } else if (v[key]) {
                    // 当
                    // function User() {}
                    // User.prototype = {
                    //      setName: function(){},
                    //      getName: function(name){
                    //          console.log(this);
                    //      }
                    // };
                    // var model = new Model({
                    //      user: new User()
                    // });
                    //
                    // 上面代码中, model.$get("user.getName")时, 这里的实现使其调用者不变
                    // 灵感来自于Function.prototype.bind
                    return function() {
                        return v[key].apply(v, arguments);
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
                return this[field];
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
        setFieldValue(this, field, value);
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
        this.$element = element;
    },

    /**
     * 执行过滤器
     * @param {string} filterName 过滤器名字
     * @param {Object} obj 用于过滤器的对象
     * @param {object...} args 过滤器参数
     */
    $filter: function(filterName, obj, args) {
        var fn = exports.filters[filterName];
        if (!fn) {
            return obj;
        }

        if (arguments.length > 2) {
            args = Array.prototype.slice.call(arguments);
            args.shift();
        } else {
            args = [obj];
        }

        return fn.apply(null, args);
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

extend(exports, {
    /**
     * 暴露Model
     */
    define: function(vm) {
        return new Model(vm);
    },

    /**
    * 获取某个结点的model
    * 如果这结点没有定义model, 则返回null
    */
    getModel: function(el) {
        try {
            return MODELS[el.$modelId];
        } catch (err) {
            return null;
        }
    },

    /**
     * 从父级元素中获取数据
     * 如果没有, 一直往上找.
     */
    getParentModel: function(el) {
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
    },

    /**
     * 从元素中查看数据
     * 如果没有, 一直往上查找
     */
    getExtModel: function(el) {
        return exports.getModel(el) || exports.getParentModel(el);
    },

    /**
     * 销毁数据
     */
    destroyModel: function(model, removeBindElement) {
        if (model.$childs.length) {
            model.$childs.forEach(function(m) {
                exports.destroyModel(m, removeBindElement);
            });
        }

        // 从MODELS中删除
        delete MODELS[model.$id];

        // 解除绑定
        if (model.$element) {
            if (removeBindElement) {
                model.$element.parentNode.removeChild(model.$element);
            } else {
                model.$element.$modelId = undefined;
            }
        }

        model = null;
    }
});
// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
