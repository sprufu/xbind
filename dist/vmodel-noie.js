!function(window, document, location, history) {
/**
 * @file 一些底层函数
 * @author jcode
 */


/**********************************/
/*         全局变量定义区         */
/**********************************/

function exports(vm) {
    return new Model(vm);
}

/**
 * 配置参数, 通过exports.config供用户修改
 */
var options = {
    interpolate: ['{{', '}}']
};

// 忽略的标签
options.igonreTags = {
    SCRIPT: true,
    NOSCRIPT: true,
    IFRAME: true
};

// 过滤属性不扫描
options.igonreAttrs = {
    'x-ajax-if': true
};

// 扫描优先级, 没有定义的都在1000
options.priorities = {
    'x-skip': 0,
    'x-controller': 10,
    'x-repeat': 20,
    'x-if': 50,
    'href': 200,
    'x-href': 210
};



var REGEXPS = {
    url: /^https?\:\/\/[-a-z0-9\.]+(\/.*)?$/,
    email: /^[\w\.\-]+\@[-a-z0-9]+\.\w+$/,
    number: /^\-?\d*\.?\d+$/,
    phone: /^1\d{10}$/,
    telphone: /^0\d{10,11}/,
    idcard: /^\d{6}(19\d{2}|20\d{2})(0\d|1[012])([012]\d|3[01])\d{3}[\dx]$/
};

var URLPARAMS = null;

/**********************************/
/*       底层函数区               */
/**********************************/
function extend () {
    var options, name, src, copy, copyIsArray, clone,
        target = arguments[0] || {},
        i = 1,
        length = arguments.length,
        deep = false;

    if ( typeof target == "boolean" ) {
        deep = target;
        target = arguments[1] || {};
        i = 2;
    }

    if ( typeof target != "object" && typeof target != 'function' ) {
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

                if ( deep && copy && ( exports.type(copy, 'object') || (copyIsArray = exports.type(copy, 'array')) ) ) {
                    if ( copyIsArray ) {
                        copyIsArray = false;
                        clone = src && exports.type(src, 'object') ? src : [];

                    } else {
                        clone = src && exports.type(src, 'object') ? src : {};
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

extend(exports, {
    extend: extend,
    isEmptyObject: function(obj) {
        var name;
        if (!exports.type(obj, 'object')) {
            return false;
        }

        for ( name in obj ) {
            return false;
        }
        return true;
    },

    /**
     * 判断一个对角的类型
     * 类型以小写字符串返回
     *
     * @param {string} matchType 如果给出这个值, 则用于判断obj是否是这个类型.
     */
    type: function( obj, matchType ) {
        if (matchType) {
            return exports.type(obj) == matchType;
        }

        var c = {}, s = c.toString.call(obj);

        

        return s.slice(8, -1).toLowerCase();
    },

    /**
     * DOMReady
     */
    ready: function(fn) {
        
            // 标准浏览器用DOMContentLoaded事件实现
            document.addEventListener('DOMContentLoaded', function(e) {
                fn();
            }, false);
            
    },

    /**
     * 在元素上添加class
     * 只能一个个添加
     */
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

    /**
     * 删除元素上的class
     * 只能一个一个删除, 不能同时删除几个, 如: exports.removeClass(el, 'cls1 cls2')是不正确的
     */
    removeClass: function(el, cls) {
        if (el.classList) {
            el.classList.remove(cls);
        } else if (el.className) {
            var classes = el.className.split(' ');
            classes.remove(cls);
            el.className = classes.join(' ');
        }
    },

    /**
     * css操作
     */
    css: function(el, name, value) {
        if (arguments.length == 2) {
            // jquery式的getter
            var styles = window.getComputedStyle ? window.getComputedStyle(el) : el.currentStyle,
            style = styles[name];
            return style;
        } else {
            el.style[name] = value;
        }
    },

    /**
     * 添加事件监听
     * @param {Element} el 监听对象
     * @param {String} type 事件类型, 如click
     * @param {Function} handler 事件句柄
     */
    on: function(el, type, handler) {
        if (exports.type(type, 'object')) {
            // 批量添加事件
            // 如:
            //  vmodel.on(el, {
            //      mouseover: fn,
            //      mouseout: fun2
            //  });
            for (var key in type) {
                exports.on(el, key, type[key]);
            }
        } else {
            
                el.addEventListener(type, function(event) {
                    var res = handler.call(el, event);
                    if (res === false) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }, false);
                
        }
    },

    /**
     * 触发事件
     * 类似于jQuery的trigger
     */
    emit: function(el, type) {
        
            var event = new Event(type);
            el.dispatchEvent(event);
        
    },

    /**
     * 配置参数
     *
     * 设置单个参数
     * vmodel.config('interpolate', ['<%', '%>'])
     *
     * 设置多个参数
     * vmodel.config({
     *      ajax: {
     *          type: 'POST',
     *          dataType: 'json',
     *          cache: false
     *      }
     * });
     */
    config: function(key, val) {
        if (options.hasOwnProperty(key)) {
            options[key] = val;
        } else if (exports.isPlainObject(key)) {
            extend(options, key);
        }
    }
});

// 修复浏览器字符串没有 startsWith方法
if (!''.startsWith) {
    String.prototype.startsWith = function(str) {
        return this.indexOf(str) === 0;
    }
}

Array.prototype.remove = function(item) {
    var i = this.length;
    while (i--) {
        if (item == this[i]) {
            this.splice(i,1);
        }
    }
};

var camelizeRegExp = /-[^-]/g;

/**
 * 转换为驼峰风格
 */
function camelize(target) {
    if (target.indexOf("-") == -1) {
        return target;
    }
    return target.replace(camelizeRegExp, function(match) {
        return match.charAt(1).toUpperCase();
    });
}


function ajax(opt) {
    opt = exports.extend({}, options.ajax, opt);
    // var xhr = new (window.XMLHttpRequest || ActiveXObject)('Microsoft.XMLHTTP')
    var xhr = new  window.XMLHttpRequest  ( ),
    data = null;

    if (opt.data) {
        data = exports.param(opt.data);
        if (opt.type.toLowerCase() == 'get') {
            if (~opt.url.indexOf('?')) {
                opt.url += '&' + data;
            } else {
                opt.url += '?' + data;
            }
            data = null;
        }
    }

    xhr.open(opt.type, opt.url, opt.async);
    if (opt.headers) {
        var key, header;
        for (key in opt.headers) {
            xhr.setRequestHeader(key, opt.headers[key]);
        }
    }
    //xhr.overrideMimeType(opt.dataType); // 低版本IE不支持overrideMimeType
    // post必须设置Content-Type, 否则服务器端无法解析参数.
    xhr.setRequestHeader("Content-Type", opt.contentType);
    xhr.onreadystatechange = function(e) {
        if (this.readyState == 4) {
            if (this.status >= 200 && this.status < 300) {
                var obj = this.responseText;
                switch(opt.dataType) {
                    case 'json':
                        try {
                            obj = parseJSON(obj);
                        } catch (err) {
                            obj = null;
                        }
                    break;
                    case 'html':
                        try {
                            var el = document.createElement('div');
                            el.innerHTML = obj;
                            obj = el.firstChild;
                            el.removeChild(obj);
                            el = null;
                        } catch(err) {
                            obj = null;
                        }
                    break;
                    case 'script':
                    break;
                    case 'jsonp':
                    break;
                }
                if (opt.success) {
                    opt.success.call(opt, obj, this);
                }
            } else {
                if (opt.error) {
                    opt.error.call(opt, this, decodeURIComponent(this.statusText));
                }
            }
        }
    }
    xhr.send(data);
}

options.ajax = {
    async: true,
    type: 'GET',
    dataType: 'text',
    contentType: 'application/x-www-form-urlencoded'
};

/**
 * 把对象转换成url参数
 * 如:
 *    {name: 'jcode', uid:215}                  ===> name=jcode&uid=215
 *    null                                      ===> 
 *    serach-string                             ===> serach-string
 */
exports.param = function(object, prefix) {
    if ('string' == typeof object) {
        return window.encodeURIComponent(object);
    }

    if ('number' == typeof object) {
        return object.toString();
    }

    if (!object) {
        return '';
    }

    var key, subpre, ret = [];
    prefix = prefix || '';
    for (key in object) {
        if (!object.hasOwnProperty(key) || exports.type(object[key], 'function')) {
            continue;
        }

        subpre = prefix ? prefix + '[' + key + ']' : key;
        if ('object' == typeof object[key]) {
            ret.push(exports.param(object[key], subpre));
        } else {
            ret.push(subpre + '=' + window.encodeURIComponent(object[key] || ''));
        }
    }

    return ret.join('&');
}

exports.ajax = ajax;

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
    extend(this, vm);

    // 属性不能放到prototype里去定义, 那是公用的地方法.
    this.$parent = null;
    this.$childs = [];
    this.$element = null;
    this.$freeze = false;

    // 存放临时字段结果
    this.$cache = {};
    this.$watchs = {
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
                        return this.$parent ? this.$parent.$get(field, noExtend, isDisplayResult) : isDisplayResult ? '' : undefined;
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
            } if (this[field]) {
                return this[field];
            } if (this.hasOwnProperty(field)) {
                return isDisplayResult ? '' : this[field];
            } else if (noExtend) {
                return isDisplayResult ? '' : undefined;
            } else {
                return this.$parent ? this.$parent.$get(field, noExtend, isDisplayResult) : isDisplayResult ? '' : undefined;
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
                this.$fire(prefix + k);
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
        if (!this.$watchs[field]) {
            this.$watchs[field] = [];
        }
        this.$watchs[field].push(observer);
    },

    /**
     * 取消订阅
     * @see $watch
     * @see $fire
     */
    $unwatch: function(field, observer) {
        if (this.$watchs[field]) {
            this.$watchs[field].remove(observer);
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
    $bindElement: function(element, noExtend) {
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
        for (var key in model.$watchs) {
            if (key == '*' || key.startsWith(field)) {
                ret = ret.concat(model.$watchs[key]);
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

/**
 * 获取model数据的方法
 * @param {string|Element} id 当为字符串时, 表示id, 否则表示结点
 * @returns {Model|null}
 */
exports.model = function(id) {
    if ('string' == typeof id) {
        return MODELS[id] || null;
    } else {
        return getExtModel(id) || null;
    }
};



/**
 * 扫描结点, 添加绑定
 */
function scan(element, model) {
    element = element || document.documentElement;

    if (!model) {
        model = new Model();
        model.$bindElement(element);
    }

    switch(element.nodeType) {
    // 普通结点
    case 1:
        if (!options.igonreTags[element.tagName]) {
            model = scanAttrs(element, model) || model;
            if (!element.$noScanChild && element.childNodes.length) {
                scanChildNodes(element, model);
            }
        }
    break;
    // 文本结点
    case 3:
        scanText(element, model);
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
        fn = exports.scanners[item.type];
        if (fn) {
            model = fn(model, element, attr.value, attr, item.param) || model;
        }
    }

    return model;
}

function scanText(element, parentModel) {
    bindModel(parentModel, element.data, parseString, function(res) {
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

        

        // 在过滤属性列表中的属性, 忽略不处理
        if (options.igonreAttrs[attr.name]) {
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
        } else if (!exports.scanners[attr.name]) {
            continue;
        } else {
            type = attr.name;
        }

        res.push({
            index: attr.name,
            type: type,
            param: param,
            priority: options.priorities[type] || 1000
        });
    }

    if (res.length === 0) {
        return res;
    }

    res.sort(function(a,b) {
        return a.priority < b.priority;
    });

    return res;
}

/**
 * @file 浏览器补丁, 主要用来兼容ie678
 * 如果不考虑ie678, 可以去掉这个文件
 * @author jcode
 */




/**
 * 属性扫描定义的回调
 */


exports.scanners = {
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

function booleanHandler (model, element, value, attr) {
    // 如果是类似: disabled="disabled"或disabled="", 不处理
    var type = attr.name
    if (value == type || value === "") {
        return;
    }

    bindModel(model, value, parseExpress, function(res) {
        if (res) {
            element.setAttribute(type, type);
        } else {
            element.removeAttribute(type);
        }
    });
}

function stringBindHandler (model, element, value, attr) {
    bindModel(model, value, parseString, function(res) {
        attr.value = res;
    });
}

function stringXBindHandler(model, element, value, attr) {
    var attrName = attr.name.substr(2);
    element.removeAttribute(attr.name);
    bindModel(model, value, parseString, function(res) {
        element.setAttribute(attrName, res);
    });
}

function eventBindHandler(model, element, value, attr) {
    var eventType = attr.name.substr(2),
    expr = parseExecute(value),
    fn = new Function('$model', expr);

    element.removeAttribute(attr.name);
    exports.on(element, eventType, function(event) {
        return fn(model);
    });
}

/**
 * 布尔插值扫描属性名
 * 如:
 *      disabled="user.sex == 'F'"
 */
[
    "disabled",
    "checked",
    "selected",
    "readonly",
    "contenteditable",
    "draggable",
    "dropzone"
].forEach(function(type) {
    exports.scanners[type] = booleanHandler;
});


/**
 * 事件绑定属性
 * 如:
 *      x-click="click()"
 *
 * 所有的属性都会自动加上前辍"x-"
 */
[
    'blur',
    'focus',
    'focusin',
    'focusout',
    'load',
    'resize',
    'scroll',
    'unload',
    'click',
    'dblclick',
    'mousedown',
    'mouseup',
    'mousemove',
    'mouseover',
    'mouseout',
    'mouseenter',
    'mouseleave',
    'change',
    'select',
    'submit',
    'keydown',
    'keypress',
    'keyup',
    'error',
    'contextmenu'
].forEach(function(type) {
    exports.scanners['x-' + type] = eventBindHandler;
});

['x-src', 'x-href'].forEach(function(type) {
    exports.scanners[type] = stringXBindHandler;
});

/**
 * 字符串插值扫描的属性名
 * 如:
 *      title="删除{{ rs.title }}记录."
 *
 * 提示: 不要把style和class属性用于字符串插值, 这两个属性经常被javascript改变
 * 插值会直接设置多个属性会导致某些不想要的设置
 * 应该使用相应的x-style及x-class
 *
 * src属性在没有扫描时就会加载, 从而加载一个不存在地地址, 应该使用x-src
 * href比src好一些, 但没扫描时点击也会跳到一个不存在的连接, 这是不想要的结果, 请使用x-href
 *
 * 对于value能用x-bind的就不要用value字符串插值, 保留这个是为了其它标签, 如option
 */
[
    // 'src',
    // 'href',
    'target',
    'title',
    'width',
    'height',
    'name',
    'alt',
    'align',
    'valign',
    'clos',
    'rows',
    'clospan',
    'rowspan',
    'cellpadding',
    'cellspacing',
    'method',
    'color',
    'border',
    'size',
    'face',
    'color',
    'value',
    'label',
    'wrap'
].forEach(function(type) {
    exports.scanners[type] = stringBindHandler;
});

exports.extend(exports.scanners, {
    'x-skip': function(model, element, value, attr) {
        element.removeAttribute(attr.name);
        element.$noScanChild = true;
    },

    /**
     * 当a[href=""]时, 阻止默认点击行为和事件冒泡
     */
    'href': function(model, element, value) {
        if (element.tagName == 'A' && value === '') {
            exports.on(element, 'click', function() {
                return false;
            });
        }
    },

    'x-controller': function(model, element, value, attr, param) {
        model = MODELS[value];
        element.removeAttribute(attr.name);
        if (model && !model.element) {
            model.$bindElement(element, param != 'top');
        } else {
            return;
        }
        return model;
    },

    /**
     * 初始化数据
     */
    'x-init': function(model, element, value, attr) {
        if (!model) {
            return;
        }

        element.removeAttribute(attr.name);
        var expr = parseExecute(value),
        fn = new Function('$model', expr);
        fn(model);
    },

    /**
     * 用来定义一个模板
     * <div x-template="tplId"> ... </div>
     *
     * 模板包括最外层的Element,
     * 扫描后会移出这个结点, 并移出这个属性及x-template的class
     * 可以设置.x-template{display:none}避免没有扫描到时显示错乱
     */
    'x-template': function(model, element, value, attr) {
        element.$nextSibling = element.nextSibling;
        element.$noScanChild = true;
        element.removeAttribute(attr.name);

        new Template(value, element);
        element.parentNode.removeChild(element);
    },

    /**
     * 加载一个模板到子结点
     * <div x-include="tplId or urlString"></div>
     *
     * 所有在页面上定义的模板, 在首次扫描时就收集到TEMPLATES中,
     * 从url加载的模板加载一次后也会收集到TEMPLATES中
     * 优先从TEMPLATES中查找, 如果没有就从url中加载.
     */
    'x-include': function(model, element, value, attr) {
        element.$noScanChild = true;
        element.removeAttribute(attr.name);
        bindModel(model, value, parseExpress, function(res) {

            if (TEMPLATES[res]) {
                var copyEl = TEMPLATES[res].element.cloneNode(true);

                

                element.innerHTML = '';
                element.appendChild(copyEl);
                scan(copyEl, model);
            } else {
                ajax({
                    url: res,
                    cache: true,
                    dataType: 'html',
                    success: function(html) {
                        var tpl = new Template(res, html),
                        copyEl = tpl.element.cloneNode(true);
                        element.innerHTML = '';
                        element.appendChild(copyEl);
                        scan(copyEl, model);
                    },
                    error: function() {
                        throw new Error('Cannot find template: ' + res);
                    }
                });
            }
        });
    },

    'x-repeat': function(model, element, value, attr, param) {
        var parent = element.parentNode,
        startElement = document.createComment('x-repeat-start:' + param),
        endElement = document.createComment('x-repeat-end:' + param);

        // 插入定界注释结点
        parent.insertBefore(startElement, element);
        parent.insertBefore(endElement, element.nextSibling);

        // 设定下一个扫描结点
        element.$nextSibling = element.nextSibling;
        element.$noScanChild = true;
        element.removeAttribute(attr.name);
        element.parentNode.removeChild(element);

        bindModel(model, value, parseExpress, function(res) {
            if (!exports.type(res, 'array')) {
                return;
            }

            var el = startElement.nextSibling, model;

            // 循环删除已经有的结点
            while (el && el != endElement) {
                model = getModel(el);
                destroyModel(model, true);
                el = startElement.nextSibling;
            }

            // 循环添加
            res.forEach(function(item, i) {
                var el = element.cloneNode(true);
                

                var model = new Model({
                    $index: i,
                    $remove: function() {
                        destroyModel(model, true);
                    },
                    $first: !i,
                    $last: i == res.length,
                    $middle: i > 0 && i < res.length
                });
                model[param] = item;

                parent.insertBefore(el, endElement);
                model.$bindElement(el);
                scan(el, model);
            });
        });
    },

    'x-if': function(model, element, value, attr) {
        var parent = element.parentElement,
        parentModel = getParentModel(element),
        replaceElement = document.createComment('x-if:' + model.$id);

        element.$nextSibling = element.nextSibling;
        element.removeAttribute(attr.name);

        model = getModel(element) || new Model();
        if (!element.$modelId) {
            model.$bindElement(element);
        }

        bindModel(parentModel, value, parseExpress, function(res) {
            if (res) {
                element.parentElement || parent.replaceChild(element, replaceElement);
                model.$freeze = false;
                for (var field in model.$watchs) {
                    model.$fire(field);
                }
            } else {
                element.parentElement && parent.replaceChild(replaceElement, element);
                model.$freeze = true;
            }
        });
        return model;
    },

    'x-show': function(model, element, value, attr) {
        element.removeAttribute(attr.name);
        bindModel(model, value, parseExpress, function(res) {
            element.style.display = res ? "" : "none";
        });
    },

    'x-bind': function(model, element, value, attr) {
        element.removeAttribute(attr.name);
        bindModel(model, value, parseExpress, function(res) {
            if (element.tagName == 'INPUT') {
                if (element.type == 'radio') {
                    if (res == element.value) {
                        element.checked = true;
                    } else {
                        element.checked = false;
                    }
                } else if (element.type == 'checkbox') {
                    if (!res || ~res.indexOf(element.value)) {
                        element.checked = true;
                    } else {
                        element.checked = false;
                    }
                } else {
                    element.value = res || '';
                }
            } else {
                element.value = res || '';
            }
        });


        function addListen(type) {
            exports.on(element, type, function(e) {
                model.$set(value, element.value);
            });
        }
        switch(element.tagName) {
            case 'INPUT':
                switch(element.type) {
                    case 'checkbox':
                        var v = model.$get(value);
                        if (v && !exports.type(v, 'array')) {
                            throw new TypeError('Checkbox bind must be array.');
                        }

                        if (!v) {
                            model.$set(value, []);
                        }

                        exports.on(element, 'click', function(e) {
                            var $value = model.$get(value),
                            item = element.value;

                            if (element.checked) {
                                $value.push(item);
                            } else {
                                // 删除掉元素
                                $value.remove(item);
                            }

                            model.$set(value, $value);
                        });
                    break;
                    case 'radio':
                        addListen('click');
                    break;
                    default:
                        addListen('keyup');
                        addListen('change');
                    break;
                }
            break;
            case 'SELECT':
                addListen('change');
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
    'x-class': function(model, element, value, attr, param) {
        element.removeAttribute(attr.name);
        bindModel(model, value, parseExpress, function(res) {
            if (res) {
                exports.addClass(element, param);
            } else {
                exports.removeClass(element, param);
            }
        });
    },
    'x-ajax': function(model, element, value, attr, param) {
        element.removeAttribute(attr.name);

        if (!element.$modelId) {
            model = new Model();
            model.$bindElement(element);
        }

        var

        // 请求的地址, 这个参数可能在变, 因为可能会与数据绑定
        url,

        // 请求条件
        // 根据 x-ajax-if 结果求得
        // 用于条件加载
        $if = true,
        ifBindExpr = element.getAttribute('x-ajax-if'),

        // 请求的方法
        read = function() {
            ajax({
                type: 'GET',
                dataType: 'json',
                cache: false,
                url: url,
                success: function(res) {
                    model.$set(res, param + '.');
                },
                error: function(xhr, err) {
                    model.$set(param + '.$error', err);
                }
            });
        };

        // 暴露加载函数, 供外部需要时加载数据
        model[param] = {
            $read: read
        };

        // 绑定加载条件
        if (ifBindExpr) {
            element.removeAttribute('x-ajax-if');
            bindModel(model, ifBindExpr, parseExpress, function(res) {
                $if = res;
            });
        }

        // 绑定url变化
        // 当url发生改变时重新加载数据
        // 调用这个时务必要给绑定赋初值, 否则加加载如: /ajax?id=undefined
        // TODO 基于这个不正确加载, 后期考虑条件加载机制.
        var bind = bindModel(model, value, parseString, function(res) {
            url = res;
            $if && read();
        });

        // 如果没有字符串插值
        // 也就是url一层不变, 那么加载一次数据
        if (bind === false) {
            url = value;
            $if && read();
        }

        return model;
    },

    'x-style': function(model, element, value, attr, param) {
        var cssName = camelize(param);
        element.removeAttribute(attr.name);
        bindModel(model, value, parseExpress, function(res) {
            element.style[cssName] = res;
        });
    }
});

function bindModel(model, str, parsefn, updatefn) {
    var fields = {},
    expr = parsefn(str, fields);
    if (exports.isEmptyObject(fields)) {
        return false;
    }

    var fn = new Function('$model,filter', 'return ' + expr),
    observer = {
        update: function(model) {
            updatefn(fn(model, exports.filter));
        }
    };

    for (var field in fields) {
        if (model) {
            model.$watch(field, observer);
            observer.update(model);
        }
    }
}


/**
 * 注册的模板列表
 */
var TEMPLATES = {
    /**
     * 以模板id为键, 模板为值
     * some_tpl_id : template
     */
};

function Template(id, element) {
    this.id = id;
    this.element = element;
    TEMPLATES[id] = this;
}

/**
 * @file 表达式字符串解析
 * @author jcode
 */


/**
 * 解析插值字符串
 */
function parseString(str, fields) {
    var txt = '""',
    interpolate1 = options.interpolate[0],
    interpolate2 = options.interpolate[1],
    len1 = interpolate1.length,
    len2 = interpolate2.length,
    flag = false,
    pos = 0,
    pos1 = 0,
    pos2 = 0;
    while (true) {
        pos1 = str.indexOf(interpolate1, pos1);
        if (~pos1) {
            pos2 = str.indexOf(interpolate2, pos1 + len1);
            if (~pos2) {
                flag = true;
                txt += '+"' + replaceWrapLineString(str.substring(pos, pos1)) + '"+' + parseExpress(str.substring(pos1 + len1, pos2), fields, true);
                pos = pos1 = pos2 = pos2 + len2;
            } else {
                txt += '+"' + replaceWrapLineString(str.substr(pos)) + '"';
                break;
            }
        } else {
            txt += '+"' + replaceWrapLineString(str.substr(pos)) + '"';
            break;
        }
    }
    return flag ? txt : false;
}

function replaceWrapLineString(str) {
    return str.replace(/\r/g, '\\r').replace(/\n/g, '\\n');
}

/**
 * 解析表达式, 收集依赖
 *
 * 常见的表达式如下:
 * {{ name }}
 * {{ user.name }}
 * {{ test.method() + 2 }}
 * {{ test.method() + 2 | number(2) }}
 * {{ user.addDate || new Date() | date('yyyy-mm-dd') }}
 *
 * 实现步骤:
 *    1. 取得过滤表达式, 过虑器只能是常量, 不能用变量做参数
 *    2. 取得其对应的源表达式
 *    3. 取得源表达式变量并收集依赖
 *    任何步骤出错将返回空串
 *
 * @param {boolean} isDisplayResult 标识这个取值结果是否用于显示, 如果为真, null及undefined将替换为空字符串, 避免在页面上显示这些字符串.
 */
function parseExpress(str, fields, isDisplayResult) {
    try {
        var filters = [],
        str = divExpress(str, filters),
        expr = parseExecuteItem(str.trim(), fields, isDisplayResult);

        if (filters.length) {
            var filter, ifn = '(function(expr){';
            for (var i=0; i<filters.length; i++) {
                filter = filters[i];
                ifn += 'expr=filter("' + filter.name + '",expr' + (filter.args.trim() ? ',' + filter.args : '') + ');'
            }
            expr = ifn + 'return expr;}(' + expr + '))'
        }

        return expr;
    } catch (err) {
        return '';
    }
}

/**
 * 把表达式分离成表达式和过滤器两部门
 * 过滤器参数不能为变量
 * @param {String} str 表达式, 也就是双花括号的中间部分
 * @param {Array} filters 传值的过滤器引用, 用于收集过滤器, 过滤器要分解出其参数, 所以是一个对象的数组, 如: [{
 *     name: 'date', // 过滤器名字
 *     args: 'yyyy-mm-dd', // 参数列表
 * }]
 * @returns {String} 没有带过滤器的表达式
 */
function divExpress(str, filters) {
    var pos = 0, expr;
    while (true) {
        pos = str.indexOf('|', pos);
        if (~pos) {
            if (str.charAt(pos + 1) == '|') {
                pos += 2;
            } else {
                str.substr(pos + 1).split('|').forEach(function(str) {
                    var filter = parseFilter(str);
                    filters.push(filter);
                });
                expr = str.substr(0, pos - 1);
                break;
            }
        } else {
            expr = str;
            filters = [];
            break;
        }
    }
    return expr;
}

/**
 * 解析过滤器, 把过滤器分解成名字和参数两部分
 * 名字与参数部分用空格分开
 * 多个参数用逗号分隔
 * @param {String} str 过滤器表达式
 * @returns {Object} 分解后的对象, 如 date 'yyyy-mm-dd' 应该返回: {
 *    name: 'date',
 *    args: 'yyyy-mm-dd'
 * }
 */
var filterRegExp = /(\w+)(.*)/;
function parseFilter(str) {
    var p = filterRegExp.exec(str);
    return {
        name: p[1],
        args: p[2]
    };
}

/**
 * 解析些待执行的表达式
 * 如:
 *    user.name = 'jcode'         ===>   $model.$set("user.name", "jcode")                    // 赋值表达式要转换成model的$set
 *    user.age = user.age + 1     ===>   $model.$set("user.age", $model.$get("user.age") + 1) // 赋值也可能与调用方法混用
 *    clickHandler                ===>   $model.$get("clickHandler")()                        // 方法要转换成model方法
 *    clickHandler(item)          ===>   $model.$get("clickHandler")($model.$get("item"))     // 变量要转换成model变量
 *    clickHandler(4, null, true) ===> $model.$get("clickHandler")(4, null, true)             // 常量(数字, null, undefined, boolean)不转换
 *
 * 从上面情况来看, 虽然复杂, 但就只有两种情况: 赋值和执行函数操作
 * 表达式由各个操作元素(变量或常量)和操作符(+, -, *, /, '%', 等)组合在一起
 * TODO fields是否应该收集
 */
function parseExecute(str) {
    var fields = {},
    ret = '';

    if (~str.indexOf(';')) {
        // 含有";", 如: user.name = 'jcode'; user.age = 31
        // 表示由多个表达式组成
        var strs = str.split(';'),
        i = 0;

        // 循环解析每个表达式, 把结果累加在一起
        for (; i<strs.length; i++) {
            if (i) {
                ret += ';';
            }
            ret += parseExecute(strs[i].trim());
        }
    } else {
        if (~str.indexOf('=')) {
            // 含有"=", 是赋值操作
            var part = str.split('=');
            ret = '$model.$set("' + part[0].trim() + '",' + parseExecuteItem(part[1].trim(), fields) + ')';
        } else {
            ret = parseExecuteItem(str, fields) + ';';
        }
    }
    return ret;
}

/**
 * 表达式操作符
 */
var exprActionReg = /[^\w\$\.\"\']+/g;

/**
 * parseExecute的辅助函数, 用来解析单个表达式, str两边已经去掉无用的空白符
 * 如:
 *    clickHandler
 *    user.age + 1
 *    user.getName()
 *
 * 这与javascript表达式有所不同, "."两边不能有空格, 如: user.  age
 */
function parseExecuteItem(str, fields, isDisplayResult) {
    var c = str.charAt(0);
    if (c == '"' || c == "'") {
        return str;
    }

    var actions = str.match(exprActionReg);
    if (actions) {
        var ret = '',
        field,
        pos0 = 0,
        pos,
        i = 0;

        // 循环解析操作符分隔的每个表达式
        // 并把他们加在一起
        for (; i<actions.length; i++) {
            pos = str.indexOf(actions[i], pos0);
            field = str.substring(pos0, pos);
            ret += parseStatic(field, isDisplayResult) + actions[i];
            pos0 = pos + actions[i].length;

            // 不是方法, 而是属性的话, 要加到监听列表里
            if (actions[i].indexOf('(') == -1) {
                fields[field] = true;
            }
        }

        // 处理最后结尾部分
        if (str.length > pos0) {
            field = str.substr(pos0);
            var res = parseStatic(field, isDisplayResult);
            if (res != field) {
                fields[field] = true;
            }
            ret += res;
        }

        return ret;
    } else {
        ret = parseStatic(str, isDisplayResult);
        if (ret != str) {
            fields[str] = true;
        }
        return ret;
    }
}

/**
 * 编译用到的关键字
 * 这些关键不编译, 其它转换成model变量
 */
options.keywords = {};
'$model return if else true false null undefined NaN do while typeof instanceof function void with var this try throw catch new in for break continue switch default delete'.split(' ').forEach(function(item) {
    options.keywords[item] = true;
});

var numberReg = /^\-?\d?\.?\d+$/;
function parseStatic(str, isDisplayResult) {
    if (!str) {
        return '';
    }

    // 普通常量, 常量有很多, 这里只处理几个常用的
    if (options.keywords[str]) {
        return str;
    }

    // 数字
    if (numberReg.test(str)) {
        return str;
    }

    var c=str.charAt(0);
    if (c == '"' || c == "'") {
        return str;
    }

    return '$model.$get("' + str + '"' + (isDisplayResult ? ',0,1':'') +')';
}

/**
 * 解析url参数
 */
function parseUrlParam(name, object, def) {
    if (URLPARAMS === null) {
        URLPARAMS = {};
        if (location.search) {
            decodeURIComponent(location.search).substr(1).split('&').map(function(it) {
                var val = it.split('=');
                URLPARAMS[val[0]] = val[1];
            });
        }
    }

    if (object) {
        object[name] = URLPARAMS[name] || def;
    } else {
        return URLPARAMS[name];
    }
}

var parseJSON = window.JSON ? window.JSON.parse : function(str) {
    return (new Function('', 'return ' + str.trim())());
}

exports.ready(scan);
window.vmodel = exports;
/**
 * @file 过滤器
 * @author jcode
 */


exports.filters = {
    /**
     * name: function(obj, arg...),
     */
    date: function(obj, format) {
        var date = parseDate(obj);
        return formatDate(date, format);
    },

    /**
     * 输入长度限制
     */
    limit: function(str, num, suffix) {
        if (str.length <= num) {
            return str;
        }

        suffix = suffix || '...';
        return str.substring(0, num) + suffix;
    },

    "number": function(it, num) {
        it = +it;
        return it.toFixed(num);
    },

    /**
     * 过滤html标签
     */
    text: function(html, removeTag) {
        if (!html) {
            return '';
        }

        var dom = document.createElement('div'), res;
        if (removeTag) {
            dom.innerHTML = html;
            res = dom.innerText;
        } else {
            dom.innerText = html;
            res = dom.innerHTML;
        }
        dom = null;
        return res;
    }
};

/**
 * 把时间字符串解析成Date对象
 * 时间对象直接返回
 * 数字当成时间戳解析, 但10位和13位是不同的, 10位表示秒, 13位表示毫秒
 * 其它返回null
 */
function parseDate(obj) {
    if (!obj) {
        return null;
    }

    if (/^\d{10}$|^\d{13}$/.test(obj)) {
        obj = +obj;
    }

    switch(exports.type(obj)) {
        case 'string': return parseDateString(obj);
        case 'date': return obj;
        case 'number': return parseDateNumber(obj);
        default: return null;
    }
}

/**
 * 解析日期字符串
 * 字符串就应该符合如下格式:
 *      yyyy/mm/dd[ hh:MM:ss] yyyy-mm-dd[ hh:MM:ss]
 *      mm/dd/yyyy[ hh:MM:ss] mm-dd-yyyy[ hh:MM:ss]
 *      2014-12-09T03:24:08.539Z
 */
function parseDateString(str) {
    var time = Date.parse(str);
    if (!isNaN(time)) {
        return parseDateNumber(time);
    }

    // 不可解析的字符串处理

    

    return null;
}

/**
 * 把时间戳转化为日期对象
 * 小于1e11的x1000再转换
 */
function parseDateNumber(num) {
    if (num < 1e11) {
        num *= 1000;
    }
    return new Date(num);
}

/**
 * 日期格式化函数
 */
function formatDate(date, format) {
    return format.replace(/[a-zA-Z]+/g, function(str) {
        switch (str) {
            case 'yyyy' : return date.getFullYear();
            case 'mm'   : return fix0Number(date.getMonth() + 1);
            case 'm'    : return date.getMonth() + 1;
            case 'dd'   : return fix0Number(date.getDate());
            case 'd'    : return date.getDate();
            case 'hh'   : return fix0Number(date.getHours());
            case 'h'    : return date.getHours();
            case 'MM'   : return fix0Number(date.getMinutes());
            case 'M'    : return date.getMinutes();
            case 'ss'   : return fix0Number(date.getSeconds());
            case 's'    : return date.getSeconds();
            case 'ww'   : return '星期' + '日一二三四五六'.split('')[date.getDay()];
            case 'w'    : return '周' + '日一二三四五六'.split('')[date.getDay()];
            case 'l'    : return ''; // TODO
            default     : return str;
        }
    });
}

function fix0Number(num) {
    return num > 9 ? num : ('0' + num);
}

exports.filters.date.format = function(match, handler) {
    dateFormatter[match] = handler;
}

/**
    * 执行过滤器
    * @param {string} filterName 过滤器名字
    * @param {Object} obj 用于过滤器的对象
    * @param {object...} args 过滤器参数
    */
exports.filter = function(filterName, obj, args) {
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
};

/**
 * @file 表单处理
 * @author jcode
 */


extend(exports.scanners, {
    /**
     * 表单操作
     * <form x-form-frmname="action" action="actionUrl" method="post">
     *      <input name="name" x-bind="name" />
     * </form>
     */
    'x-form': function(model, element, value, attr, param) {
        element.removeAttribute(attr.name);
        extend(model, {
            $xform: param,
            $dirty: false, // 是否更改过
            $valid: true // 是不验证通过
        });
        return model;
    },

    /**
     * 最小值限制验证
     */
    min: function(model, element, value) {
        var minValue = +value;
        bindValidModel(element, function() {
            updateFormItem(element, 'min', +element.value >= minValue);
        });
    },

    /**
     * 最大值限制验证
     */
    max: function(model, element, value) {
        var maxValue = +value;
        bindValidModel(element, function() {
            updateFormItem(element, 'max', +element.value <= maxValue);
        });
    },

    /**
     * 最小长度验证
     */
    minlength: function(model, element, value) {
        var minValue = +value;
        bindValidModel(element, function() {
            updateFormItem(element, 'minlength', element.value.length >= minValue);
        })
    },

    /**
     * 最大长度验证
     */
    maxlength: function(model, element, value) {
        var maxValue = +value;
        bindValidModel(element, function() {
            updateFormItem(element, 'maxlength', element.value.length <= maxValue);
        })
    },

    /**
     * 正则验证
     */
    pattern: function(model, element, value) {
        var regexp = new RegExp(value);
        bindValidModel(element, function() {
            updateFormItem(element, 'pattern', element.value.test(regexp));
        })
    },

    /**
     * 必填验证
     */
    required: function(model, element) {
        bindValidModel(element, function() {
            updateFormItem(element, 'required', !!element.value);
        });
    },

    /**
     * 类型判断
     */
    type: function(model, element, value) {
        value = value.toLowerCase();

        if (!REGEXPS[value]) {
            return;
        }

        bindValidModel(element, function() {
            updateFormItem(element, 'type', element.value.test(REGEXPS[value]));
        });
    }
});

function bindValidModel(element, fn) {
    if (!element.form) {
        return;
    }
    exports.on(element, 'keyup', fn);
    exports.on(element, 'change', fn);
}

/**
 * 更新表单验证信息
 * @param {Element} element 表单项, 如: <input name="name" />
 * @param {String} type 验证类型
 * @param {boolean} res 验证结果
 */
function updateFormItem(element, type, res) {
    var frm = element.form,
    model = getExtModel(frm),
    name, prefix;

    if (!model) {
        return;
    }

    name = element.name;
    prefix = model.$xform + '.' + element.name;
    model.$set(prefix + '.$valid', res);
    model.$set(prefix + '.$error.' + type, !res);
}

}(window, document, location, history);
