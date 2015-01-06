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
            }
            v = v[key];
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
    mix(this, vm, {
        $parent     : null,
        $childs     : [],
        $element    : null,
        $freeze     : false,
        $cache      : {},
        $subscribes : {
            /**
            * 监听列表
            * 以字段为键
            * 如: name, user.name, user.name.firstName
            * 特殊字段名"*"表示所有字段有效
            * 如: *, user.*
            *
            * field: [ subscribe array ]
            */
        }
    });

    if (!this.$id) {
        this.$id = '$' + Math.random().toString(36).substr(2);
    } else if (MODELS[this.$id]) {
        throw new Error('The model id is exists.');
    }

    MODELS[this.$id] = this;
}

/**
 * 根据字段名获取对象数据
 */
function getObjectValueByFieldName(obj, field) {
    var fields = field.split('.'),
    o = obj,
    i = 0;
    for (; i < fields.length; i++) {
        o = o[fields[i]];
    }
    return o;
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
        } else {
            var model = this, value;
            while (model) {
                try {
                    value = getObjectValueByFieldName(model, field);
                    if (value === undefined) {
                        model = model.$parent;
                    } else {
                        break;
                    }
                } catch (err) {
                    if (noExtend) {
                        break;
                    }
                    model = model.$parent;
                }
            }

            // 是函数的, 绑定调用者
            // 绑定model适合还是this适合?
            if ('function' == typeof value) {
                value = value.bind(this);
            }

            return value ? value : isDisplayResult ? '' : undefined;
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
            namespace = value ? value + '.' : '';

            // 批量设置值
            for(k in field) {
                this.$cache[namespace + k] = field[k];
                setFieldValue(this, namespace + k, field[k]);
            }

            // 依次更新视图
            for(k in field) {
                this.$fire(namespace + k);
            }

            // 清空缓存
            for(k in field) {
                delete this.$cache[namespace + k];
            }
        } else {
            // 单个更新模式, 如:
            // model.$set('name', 'jcode');
            setFieldValue(this, field, value);
            this.$cache[field] = value;
            this.$fire(field);
            delete this.$cache[field];
        }
    },

    /**
     * 订阅数据更新
     * 相当于angular的$watch
     * @see $fire
     * @see $unwatch
     */
    $watch: function(field, observer) {
        if (!this.$subscribes[field]) {
            this.$subscribes[field] = [];
        }
        this.$subscribes[field].push(observer);
    },

    /**
     * 取消订阅
     * @see $watch
     * @see $fire
     */
    $unwatch: function(field, observer) {
        if (this.$subscribes[field]) {
            this.$subscribes[field].remove(observer);
        }
    },

    /**
     * 通知订阅者更新自己
     * @see $watch
     * @see $unwatch
     */
    $fire: function(field) {
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
     * @param {Element} element 待绑定的结点
     * @param {boolean} noExtend 是否不从上级继承数据, 一般情况下要继承
     */
    $scope: function(element, noExtend) {
        if (element.$modelId) {
            throw new Error('不能重复绑定model.');
        }

        var model = this;

        // 如果没有指定是否继承上级数据, 表示默认继承
        // 查找并设置当前数据的上级数据, 并监听上级数据的变化(当上级数据变化时, 可能会影响到自己)
        // 如果不继承上级数据, 只简单的与结点绑定.
        if (!noExtend) {
            model.$parent = getParentModel(element);
            if (model.$parent) {
                model.$parent.$childs.push(model);
                var observer = {
                    isChildSubscribe: true,
                    update: function(parentModel, field) {
                        if (!model.hasOwnProperty(field)) {
                            model.$fire(field);
                        }
                    }
                }
                model.$parent.$watch('*', observer);
            }
        }

        element.$modelId = model.$id;
        this.$element = element;
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
    return MODELS[el.$modelId] || null;
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
 * 垃圾回收
 * @param {Model} model 只检查指定的数据及其以下子数据, 省略这参数时检查全部
 */
function gc(model) {
    // 先删除子数据
    model.$childs.forEach(function(it) {
        it.$parent = null;
        gc(it);
    });

    delete MODELS[model.$id];

    // 回收clone生成的Element
    // $element, $subscribes两个属性必须置为null, clone出的element才能回收
    model.$element = null;
    model.$subscribes = null;

    // 回收不用的Model
    // 从其父级中删除, 并删除监听父级变化
    var parent = model.$parent;
    if (parent) {
        parent.$childs.remove(model);
        var subscribes = parent.$subscribes['*'],
        i = subscribes.length;
        while (i--) {
            if (subscribes[i].isChildSubscribe) {
                subscribes.splice(i, 1);
            }
        }
        parent = null;
    }
}

/**
 * 回收某结点的数据
 * @param {boolean} skipTop 只回收其子结点的数据, 本结点不回收
 */
function gcElement(element, skipTop) {
    if (!skipTop && element.$modelId) {
        gc(MODELS[element.$modelId]);
    } else {
        var el = element.firstChild;
        while (el) {
            if (el.nodeType == 1) {
                gcElement(el);
            }
            el = el.nextSibling;
        }
    }
}

/**
 * 获取model数据的方法
 * @param {string|Element} id 当为字符串时, 表示id, 否则表示结点
 * @returns {Model|null}
 */
exports.model = function(id) {
    if ('string' == typeof id) {
        return MODELS[id] || null;
    } else {
        return getExtModel(id);
    }
};

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
