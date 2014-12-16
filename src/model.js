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
    this.$parent = null;
    this.$childs = [];
    this.$element = null;
    this.$freeze = false;

    // 存放临时字段结果
    this.$cache = {};
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
    $get: function(field, noExtend, isDisplayResult) {
        if (this.$cache.hasOwnProperty(field)) {
            return this.$cache[field];
        } else if (~field.indexOf('.')) {
            // 深层处理, 如: user.name
            var v = this,
            key,
            keys = field.split('.'),
            i = 0;
            for (; i<keys.length; i++) {
                key = keys[i];
                if (!v[key]) {
                    if (v.hasOwnProperty(key)) {
                        return isDisplayResult ? '' : v[key];
                    } else if (noExtend) {
                        return isDisplayResult ? '' : undefined;
                    } else {
                        return this.$parent ? this.$parent.$get(field) : isDisplayResult ? '' : undefined;
                    }
                } else if ('function' == typeof v[key]) {
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
                    return v[key].bind(v);
                } else {
                    if (i == keys.length - 1) {
                        return v[key];
                    } else {
                        v = v[key];
                    }
                }
            }
        } else {
            if ('function' == typeof this[field]) {
                return this[field].bind(this);
            } if (this.hasOwnProperty(field) || this[field]) {
                return this[field];
            } else {
                return this.$parent ? this.$parent.$get(field) : isDisplayResult ? '' : undefined;
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
        if (exports.type(field, 'object')) {
            // 批量模式, 如:
            // model.$set({
            //      name: 'jcode',
            //      age: 30,
            //      job: 'IT'
            // });
            //
            // 批量模式不是单个模式的循环, 内部存在优化
            // 能用批量模式的尽量不要单个模式.
            var k,

            // 批量更新时, 第二个参数为每个key的前辍
            // 如:
            // model.$set({
            //      name: 'jcode',
            //      age: 30
            // }, 'user.');
            // 相当于:
            // model.$set('user.name', 'jcode');
            // model.$set('user.age', 30);
            //
            // key中如果存在"."则有特殊的意义, 如:
            // model.$set({
            //      "user.name": 'jcode'
            // });
            // 与
            // model.$set({
            //      user: {
            //          name: 'jcode'
            //      }
            // });
            // 不同, 前者如果user下有其它属性, 不会丢失(只更新属性),
            // 后者是直接替换掉user, 所以user值是一个全新的值.
            prefix = value || '';

            // 批量设置值
            this.$freeze = true;
            for(k in field) {
                this.$cache[prefix + k] = field[k];
                setFieldValue(this, k, field[k]);
            }

            // 依次更新视图
            this.$freeze = false;
            for(k in field) {
                this.$notifySubscribes(prefix + k);
            }

            // 清空缓存
            for(k in field) {
                delete this.$cache[prefix + k];
            }
        } else {
            // 单个更新模式, 如:
            // model.$set('name', 'jcode');
            setFieldValue(this, field, value);
            this.$cache[field] = value;
            this.$notifySubscribes(field);
            delete this.$cache[field];
        }
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
    $notifySubscribes: function(field) {
        if (this.$freeze) {
            return;
        }

        var subscribes = getSubscribes(this, field),
        i = 0,
        subscribe;

        for(; i<subscribes.length; i++) {
            subscribes[i].update(this, field);
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

        model.$parent = getParentModel(element);
        if (model.$parent) {
            model.$parent.$childs.push(model);
            var observer = {
                update: function(parentModel, field) {
                    if (!model.hasOwnProperty(field)) {
                        model.$notifySubscribes(field);
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

/**
* 获取某个结点的model
* 如果这结点没有定义model, 则返回null
*/
function getModel(el) {
    try {
        return MODELS[el.$modelId];
    } catch (err) {
        return null;
    }
}

/**
 * 从父级元素中获取数据
 * 如果没有, 一直往上找.
 */
function getParentModel(el) {
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

/**
 * 从元素中查看数据
 * 如果没有, 一直往上查找
 */
function getExtModel(el) {
    return getModel(el) || getParentModel(el);
}

/**
 * 销毁数据
 */
function destroyModel(model, removeBindElement) {
    if (model.$childs.length) {
        model.$childs.forEach(function(m) {
            destroyModel(m, removeBindElement);
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

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
