!function(window, document, location, history) {
/**
 * @file 一些底层函数
 * @author jcode
 */

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

/* ie678( */

// 判断ie67很简单吧
var ie67 = !"1"[0];

// 判断ie678也很简单, 因为它有个神奇的特性
var ie678 = window == document && document != window;

/* ie678) */

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

extend(exports, {
    extend: extend,
    noop: noop,
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
        if (exports.type(obj) != 'object') {
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
     */
    type: function( obj ) {
        var c = {}, s = c.toString.call(obj);

        /* ie678( */
        // ie678下null及undefined返回object修正
        if (obj === null) {
            return 'null';
        } else if(obj === undefined) {
            return 'undefined';
        }
        /* ie678) */

        return s.substring(8, s.length-1).toLowerCase();
    },

    /**
     * DOMReady
     */
    ready: function(fn) {
        /* ie678( */
        if (document.addEventListener) {
            /* ie678) */
            // 标准浏览器用DOMContentLoaded事件实现
            document.addEventListener('DOMContentLoaded', function(e) {
                fn();
            }, false);
            /* ie678( */
        } else {
            // TODO ie678
            setTimeout(fn);
        }
        /* ie678) */
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
        if (el.addEventListener) {
            el.addEventListener(type, handler, false);
        } else if (el.attachEvent){
            el.attachEvent('on' + type, handler);
        }
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

function noop(){}

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

/**
 * 转换为驼峰风格
 */
function camelize(target) {
    if (target.indexOf("-") == -1) {
        return target;
    }
    return target.replace(/-[^-]/g, function(match) {
        return match.charAt(1).toUpperCase();
    });
}

function bindModel(model, str, parsefn, updatefn) {
    var fields = {},
    expr = parsefn(str, fields);
    if (exports.isEmptyObject(fields)) {
        return;
    }

    var fn = new Function('$model', 'return ' + expr),
    observer = {
        update: function(model, value, oldValue) {
            updatefn(fn(model, value, oldValue));
        }
    };

    for (var field in fields) {
        if (model) {
            model.$subscribe(field, observer);
            observer.update(model);
        }
    }
}

function ajax(opt) {
    opt = exports.extend({}, options.ajax, opt);
    // var xhr = new (window.XMLHttpRequest || ActiveXObject)('Microsoft.XMLHTTP')
    var xhr = new /* ie678( */ ( /* ie678) */ window.XMLHttpRequest /* ie678( */ || ActiveXObject) /* ie678) */ ( /* ie678( */ 'Microsoft.XMLHTTP' /* ie678) */),
    data = null;

    if (opt.data) {
        data = object2UrlSearch(opt.data);
        if (opt.type.toLowerCase() == 'get') {
            if (~opt.url.indexOf('?')) {
                opt.url += '&' + data;
            } else {
                opt.url += '?' + data;
            }
            data = null;
        }
    }

    xhr.open(opt.type, opt.url, true);
    if (opt.headers) {
        var key, header;
        for (key in opt.headers) {
            xhr.setRequestHeader(key, opt.headers[key]);
        }
    }
    //xhr.overrideMimeType(opt.dataType); // 低版本IE不支持overrideMimeType
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
                    opt.error.call(opt, this, this.responseText);
                }
            }
        }
    }
    xhr.send(data);
}

options.ajax = {
    type: 'GET',
    dataType: 'text'
};

/**
 * 把对象转换成url参数
 * 如:
 *    {name: 'jcode', uid:215}                  ===> name=jcode&uid=215
 *    null                                      ===> 
 *    serach-string                             ===> serach-string
 */
function object2UrlSearch(object) {
    if ('string' == typeof object) {
        return object;
    }

    if ('number' == typeof object) {
        return object.toString();
    }

    if (!object) {
        return '';
    }

    var key, ret = [];
    for (key in object) {
        ret.push(key + '=' + window.encodeURIComponent(object[key] || ''));
    }
    return ret.join('&');
}

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
                        return returnValue(v[key]);
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
                return returnValue(this[field]);
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

function returnValue(val) {
    if (val === null || val === undefined) {
        return val;
    }
    return val;
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
/**
 * 扫描信息存储
 * <div attr-name="data" scan-guid="scanGuid"> ... </div>
 * 扫描后可以生成很多信息, 这些信息与结点相关, 每个信息是一个回调函数, 连接时只需要执行这个回调函数就行
 */
var SCANS_INFO = {
    /*
    * someScanGuid: [ callback array ],
    * ...
    * callback(element, model);
    */
};

/**
 * 扫描结点, 添加绑定
 */
function scan(element, model) {
    element = element || document.documentElement;
    model = model || null;

    switch(element.nodeType) {
    // 普通结点
    case 1:
        model = scanAttrs(element, model) || model;
        if (!element.$noScanChild && element.childNodes.length) {
            scanChildNodes(element, model);
        }
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
            model = fn({
                model: model,
                element: element,
                type: item.type,
                param: item.param,
                value: attr.value
            }, attr) || model;
        }
    }

    return model;
}

function scanText(element, parentModel) {
    bindModel(parentModel, element.data, parseString, function(res, value, oldValue) {
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

        /* ie678( */
        // 过滤ie67的element.attributes得到一大堆属性
        if (!attr.specified) {
            continue;
        }
        /* ie678) */

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
 * @file 浏览器补丁, 主要用来兼容ie678
 * 如果不考虑ie678, 可以去掉这个文件
 * @author jcode
 */
/* ie678( */
if (!''.trim) {
    var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g
    String.prototype.trim = function(str) {
        return this.replace(rtrim, '');
    }
}

if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(cb) {
        for (var i=0; i<this.length; i++) {
            cb(this[i], i);
        }
    };
}

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(el) {
        for (var i=0; i<this.length; i++) {
            if (el == this[i]) {
                return i;
            }
        }
        return -1;
    }
}

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(el) {
        for(var i=0; i<this.length; i++) {
            if (this[i] == el) {
                return i;
            }
        }
        return -1;
    }
}

if (!Function.prototype.bind) {
    Function.prototype.bind = function(scope) {
        var fn = this;
        return function() {
            return fn.apply(scope);
        };
    };
}

/* ie678) */

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
    data.element.removeAttribute(attr.name);
    bindModel(data.model, data.value, parseString, function(res, value, oldValue) {
        data.element.setAttribute(attrName, res);
    });
}

function eventBindHandler(data, attr) {
    var model = exports.getExtModel(data.element),
    eventType = data.type.substr(2),
    expr = parseExecute(data.value),
    fn = new Function('$model', expr);
    data.element.removeAttribute(attr.name);
    exports.on(data.element, eventType, function() {
        fn(model);
    });
}

/**
 * 布尔插值扫描属性名
 * 如:
 *      disabled="user.sex == 'F'"
 */
options.booleanBindAttrs = [
    "disabled",
    "checked",
    "selected",
    "contenteditable",
    "draggable",
    "dropzone"
];

options.booleanBindAttrs.forEach(function(type) {
    exports.scanners[type] = booleanHandler;
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
options.stringBindAttrs = [
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
    'type',
    'border',
    'size',
    'face',
    'color',
    'value',
    'label',
    'wrap'
];

/**
 * 事件绑定属性
 * 如:
 *      x-click="click()"
 *
 * 所有的属性都会自动加上前辍"x-"
 */
options.eventBindAttrs = [
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
];

options.stringBindAttrs.forEach(function(type) {
    exports.scanners[type] = stringBindHandler;
});

'x-src x-href'.split(' ').forEach(function(type) {
    exports.scanners[type] = stringXBindHandler;
});

options.eventBindAttrs.forEach(function(type) {
    exports.scanners['x-' + type] = eventBindHandler;
});

exports.extend(exports.scanners, {
    'x-skip': function(data, attr) {
        data.element.removeAttribute(attr.name);
        data.element.$noScanChild = true;
    },
    'x-controller': function(data, attr) {
        var id = data.value,
        vmodel = MODELS[id];
        data.element.removeAttribute(attr.name);
        if (vmodel && !vmodel.element) {
            vmodel.$element = data.element;
            vmodel.$parent = exports.getParentModel(data.element);
            data.element.$modelId = id;
        } else {
            // throw new Error('未定义vmodel');
            return;
        }
        return vmodel;
    },

    /**
     * 用来定义一个模板
     * <div x-template="tplId"> ... </div>
     *
     * 模板包括最外层的Element,
     * 扫描后会移出这个结点, 并移出这个属性及x-template的class
     * 可以设置.x-template{display:none}避免没有扫描到时显示错乱
     */
    'x-template': function(data, attr) {
        var element = data.element,
        tplId = data.value,
        parentModel = exports.getParentModel(element),
        tpl = new Template(tplId, element, parentModel);

        element.$nextSibling = element.nextSibling;
        element.$noScanChild = true;
        element.removeAttribute(attr.name);
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
    'x-include': function(data, attr) {
        var element = data.element,
        model = exports.getExtModel(element);
        element.$noScanChild = true;
        element.removeAttribute(attr.name);
        bindModel(model, data.value, parseExpress, function(res) {
            element.innerHTML = '';
            var copyEl = TEMPLATES[res].element.cloneNode(true);

            /* ie678( */
            // ie678的cloneNode会连同自定义属性一起拷贝
            // 且ie67还不能delete
            if (ie678) {
                copyEl.$noScanChild = false;
            }
            /* ie678) */

            element.appendChild(copyEl);
            scan(copyEl, model);
        });
    },

    'x-repeat': function(data, attr) {
        var id = data.value,
        param = data.param,
        element = data.element,
        parent = element.parentNode,
        model = exports.getExtModel(element),
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

        bindModel(model, data.value, parseExpress, function(res) {
            if (!exports.isArray(res)) {
                return;
            }

            var el = startElement.nextSibling, model;

            // 循环删除已经有的结点
            while (el && el != endElement) {
                model = exports.getModel(el);
                exports.destroyModel(model, true);
                el = startElement.nextSibling;
            }

            // 循环添加
            res.forEach(function(item, i) {
                var el = element.cloneNode(true);
                /* ie678( */
                if (ie678) {
                    el.$noScanChild = false;
                }
                /* ie678) */

                var model = new Model({
                    $index: i,
                    $remove: function() {
                        exports.destroyModel(model, true);
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

    'x-if': function(data, attr) {
        var element = data.element,
        parent = element.parentElement,
        model = exports.getModel(element) || new Model(),
        parentModel = exports.getParentModel(element),
        replaceElement = document.createComment('x-if:' + model.$id);

        element.$nextSibling = element.nextSibling;
        element.removeAttribute(attr.name);

        if (!element.$modelId) {
            model.$bindElement(element);
        }

        bindModel(parentModel, data.value, parseExpress, function(res, value, oldValue) {
            if (res) {
                element.parentElement || parent.replaceChild(element, replaceElement);
                model.$freeze = false;
                for (var field in model.$subscribes) {
                    model.$notifySubscribes(field);
                }
            } else {
                element.parentElement && parent.replaceChild(replaceElement, element);
                model.$freeze = true;
            }
        });
        return model;
    },

    'x-show': function(data, attr) {
        var model = exports.getExtModel(data.element);
        data.element.removeAttribute(attr.name);
        bindModel(model, data.value, parseExpress, function(res, value, oldValue) {
            data.element.style.display = res ? "" : "none";
        });
    },

    'x-bind': function(data, attr) {
        var model = exports.getExtModel(data.element);
        data.element.removeAttribute(attr.name);
        bindModel(model, data.value, parseExpress, function(res, value, field) {
            var el = data.element,
            flag = true;
            if (el.tagName == 'INPUT') {
                if (el.type == 'radio') {
                    flag = false;
                    if (res == el.value) {
                        el.checked = true;
                    } else {
                        el.checked = false;
                    }
                } else if (el.type == 'checkbox') {
                    flag = false;
                    if (~res.indexOf(el.value)) {
                        el.checked = true;
                    } else {
                        el.checked = false;
                    }
                }
            }

            if (flag) {
                el.value = res;
            }

            if (el.name && el.form && el.form.$xform) {
                validItem(el);
            }
        });


        var model = exports.getExtModel(data.element);
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
                            // var el = ie678 ? e.srcElement : this
                            var el = /* ie678( */ ie678 ? e.srcElement : /* ie678) */ this,
                            value = model.$get(data.value),
                            item = el.value;

                            if (el.checked) {
                                value.push(item);
                            } else {
                                // 删除掉元素
                                value.remove(item);
                            }

                            model.$set(data.value, value);
                        });
                    break;
                    case 'radio':
                        exports.on(data.element, 'click', function(e) {
                            // model.$set(data.value, ie678 ? e.srcElement.value : this.value);
                            model.$set(data.value, /* ie678( */ ie678 ? e.srcElement.value : /* ie678) */ this.value);
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
                    /* ie678( */
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
                        /* ie678) */
                        value = this.value;
                        /* ie678( */
                    }
                    /* ie678) */
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
    'x-class': function(data, attr) {
        var element = data.element;
        element.removeAttribute(attr.name);
        bindModel(data.model, data.value, parseExpress, function(res, value, oldValue) {
            if (res) {
                exports.addClass(data.element, data.param);
            } else {
                exports.removeClass(data.element, data.param);
            }
        });
    },
    'x-ajax': function(data, attr) {
        var element = data.element,
        model = exports.getModel(element) || new Model();
        element.removeAttribute(attr.name);

        if (!element.$modelId) {
            model.$bindElement(element);
        }

        var read = function() {
            ajax({
                type: 'GET',
                dataType: 'json',
                cache: false,
                url: data.value,
                success: function(res) {
                    for (var key in res) {
                        model.$set(data.param + '.' + key, res[key]);
                    }
                },
                error: function(xhr, err) {
                    model.$set(data.param + '.$error', err);
                }
            });
        }
        read();

        model[data.param] = {
            $read: read
        };

        return model;
    },
    'x-grid': function(data, attr) {
        var el= data.element,
        model = exports.getModel(el) || new Model();
        el.removeAttribute(attr.name);

        if (!el.$modelId) {
            model.$bindElement(el);
        }

        var name = data.param,
        opt = {
            name: name,
            url: attr.value,
            page: el.getAttribute('page'),
            pageSize: el.getAttribute('page-size')
        };

        model[name] = new DataGrid(opt);
        model[name].$$model = model;

        return model;
    },

    'x-style': function(data, attr) {
        var cssName = camelize(data.param);
        data.element.removeAttribute(attr.name);
        bindModel(data.model, data.value, parseExpress, function(res, value, oldValue) {
            data.element.style[cssName] = res;
        });
    },

    /**
     * 表单操作
     * <form x-form-frmname="action" action="actionUrl" method="post">
     *      <input name="name" x-bind="name" />
     * </form>
     */
    'x-form': function(data, attr) {
        var model = exports.getExtModel(data.element);
        data.element.removeAttribute(attr.name);
        if (!model) {
            model = new Model();
            model.$bindElement(data.element);
        }
        extend(model, {
            $dirty: false, // 是否更改过
            $valid: true // 是不验证通过
        });
        data.element.$xform = data.param;
        return model;
    }
});

var VALIDATTRIBUTES = {
    /**
     * 最小长度验证
     */
    min: function(num, value) {
        return value.length >= +num;
    },

    /**
     * 最大长度验证
     */
    max: function(num, value) {
        return value.length <= +num;
    },

    /**
     * 正则验证
     */
    pattern: function(regexp, value) {
        return new RegExp(regexp).test(value);
    },

    /**
     * 类型验证, 如type="url", type="email", type="number"
     */
    type: function(type, value) {
        var reg = REGEXPS[type.toLowerCase()];
        if (reg) {
            return ret.test(value);
        }
        return true;
    },

    /**
     * 必填验证
     */
    required: function(_, value) {
        return !!value;
    }
}

/**
 * 验证输入表单数据
 * @param {Element} input 输入结点, 如input, textarea, select
 */
function validItem(input) {
    var name, fn, attr, field,
    valid = true, error,
    frm = input.form,   // 表单
    fname = frm.$xform, // 表单绑定名
    fmodel = exports.getExtModel(frm); // 表单数据
    for (name in VALIDATTRIBUTES) {
        attr = input.attributes[name];

        // 没有的属性, 不做处理
        if (!attr || !attr.specified) {
            continue;
        }

        // 计算验证结果
        fn = VALIDATTRIBUTES[name];
        if (fn.call(input, attr.value, input.value)) {
            error = false;
        } else {
            error = true;
            valid = false;
        }

        // 更新验证出错信息
        // 验证出错信息是区分开的
        field = fname + '.' + input.name + '.$error.' + name;
        if (fmodel.$get(field) != error) {
            fmodel.$set(field, error);
        }
    }

    // 更新验证结果
    field = fname + '.' + input.name + '.valid';
    if (fmodel.$get(field) != valid) {
        fmodel.$set(field, valid);
    }

    // 更新class
    if (valid) {
        exports.addClass(input, 'x-valid');
        exports.removeClass(input, 'x-invalid');
    } else {
        exports.addClass(input, 'x-invalid');
        exports.removeClass(input, 'x-valid');
    }

    exports.addClass(input, 'x-dirty');
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

function Template(id, element, parentModel) {
    this.id = id;
    this.element = element;
    this.parentModel = parentModel;
    TEMPLATES[id] = this;
}

function DataGrid(opt) {
    if (opt.page) {
        if (REGEXPS.number.test(opt.page)) {
            this.$$page = +opt.page;
        } else {
            this.$$page = +parseUrlParam(opt.page) || 1;
        }
    } else {
        this.$$page = 1;
    }

    if (opt.pageSize) {
        if (REGEXPS.number.test(opt.pageSize)) {
            this.$$pageSize = +opt.pageSize;
        } else {
            this.$$pageSize = +parseUrlParam(opt.pageSize) || 20;
        }
    } else {
        this.$$pageSize = 20;
    }

    this.$$sort = '';
    this.$$order = '';
    this.$$params = {
        page: this.$$page,
        pageSize: this.$$pageSize
    };
    this.$$url = opt.url;
    this.$$name = opt.name;

    this.$read();
}

DataGrid.prototype = {
    /**
     * 读取数据
     */
    $read: function(search) {
        if (arguments.length) {
            this.$$params = search;
            this.$$page = 1;
        }

        var self = this,
        data = this.$$params;
        extend(data, {
            page: this.$$page,
            pageSize: this.$$pageSize
        });
        if (this.$$sort) {
            data.sort = this.$$sort;
        }

        if (this.$$order) {
            data.order = this.$$order;
        }

        ajax({
            type: 'GET',
            dataType: 'json',
            cache: false,
            url: this.$$url,
            data: data,
            success: function(res) {
                for (var key in res) {
                    self.$$model.$set(self.$$name + '.' + key, res[key]);
                }
            },
            error: function(xhr, err) {
                self.$$model.$set(self.$$name + '.$error', err);
            }
        });
    },

    /**
     * 获取当前页码或跳到指定页码
     */
    $page: function(page) {
        if (page) {
            this.$$page = page;
            this.$read();
        } else {
            return this.$$page;
        }
    },

    /**
     * 设置或更改每页显示记录数
     * 更改时重新加载页面并跳到第一页
     */
    $pageSize: function(pageSize) {
        if (pageSize) {
            this.$$pageSize = pageSize;
            this.$$page = 1;
            this.$read();
        } else {
            return this.$$pageSize;
        }
    },

    /**
     * 重新排序
     */
    $sort: function(field, order) {
        this.$$sort = field;
        this.$$order = order || '';
        this.$read();
    }
};

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
                txt += '+"' + str.substring(pos, pos1) + '" +' + parseExpress(str.substring(pos1 + len1, pos2), fields);
                pos = pos1 = pos2 = pos2 + len2;
            } else {
                txt += '+"' + str.substr(pos) + '"';
                break;
            }
        } else {
            txt += '+"' + str.substr(pos) + '"';
            break;
        }
    }
    return flag ? txt : false;
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
 */
function parseExpress(str, fields) {
    try {
        var filters = [],
        str = divExpress(str, filters),
        expr = parseExecuteItem(str.trim(), fields);

        if (filters.length) {
            var filter, ifn = '(function(expr){';
            for (var i=0; i<filters.length; i++) {
                filter = filters[i];
                ifn += 'expr = $model.$filter("' + filter.name + '", expr, ' + filter.args + ');'
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
 */
function parseExecute(str, fields) {
    fields = fields || {};
    var ret = '';

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
            ret += parseExecute(strs[i], fields);
        }
    } else {
        if (~str.indexOf('=')) {
            // 含有"=", 是赋值操作
            var part = str.split('=');
            ret = '$model.$set("' + part[0].trim() + '", ' + parseExecuteItem(part[1].trim(), fields) + ')';
        } else {
            ret = parseExecuteItem(str, fields) + ';';
        }
    }
    return ret;
}

/**
 * 表达式操作符
 */
var exprActionReg = /[^\w\$\.]+/g;

/**
 * parseExecute的辅助函数, 用来解析单个表达式, str两边已经去掉无用的空白符
 * 如:
 *    clickHandler
 *    user.age + 1
 *    user.getName()
 *
 * 这与javascript表达式有所不同, "."两边不能有空格, 如: user.  age
 */
function parseExecuteItem(str, fields) {
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
            ret += parseStatic(field) + actions[i];
            pos0 = pos + actions[i].length;

            // 不是方法, 而是属性的话, 要加到监听列表里
            if (actions[i].indexOf('(') == -1) {
                fields[field] = true;
            }
        }

        // 处理最后结尾部分
        if (str.length > pos0) {
            field = str.substr(pos0);
            var res = parseStatic(field);
            if (res != field) {
                fields[field] = true;
            }
            ret += res;
        }

        return ret;
    } else {
        ret = parseStatic(str);
        if (ret != str) {
            fields[str] = true;
        }
        return ret;
    }
}

var numberReg = /^\-?\d?\.?\d+$/;
function parseStatic(str) {
    // 普通常量, 常量有很多, 这里只处理几个常用的
    if (str == 'true' || str == 'false' || str == 'null' || str == 'undefined' || str == 'NaN') {
        return str;
    }

    // 数字
    if (numberReg.test(str)) {
        return str;
    }

    return '$model.$get("' + str + '")';
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

    /* ie678( */
    // ie678中, 把"-"转化为"/"
    time = Date.parse(str.replace(/-/g, '/'));
    if (!isNaN(time)) {
        return parseDateNumber(time);
    }

    // JSON解析
    var jsonDateRegexp = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}\:\d{2}:\d{2})\.(\d{3})Z$/,
    match = str.match(jsonDateRegexp);
    if (match) {
        return parseDateNumber(Date.parse(match[1] + '/' + match[2] + '/' + match[3] + ' ' + match[4]) + (+match[5]));
    }
    /* ie678) */

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
        var fn = dateFormatter[str];
        return fn ? fn(date) : fn;
    })
}

/**
 * 时间格式化函数
 */
var dateFormatter = {
    yyyy: function(d) {
        return d.getFullYear();
    },
    mm: function(date) {
        return fix0Number(date.getMonth() + 1);
    },
    m: function(date) {
        return date.getMonth() + 1;
    },
    dd: function(date) {
        return fix0Number(date.getDate());
    },
    d: function(date) {
        return date.getDate();
    },
    hh: function(date) {
        return fix0Number(date.getHours());
    },
    h: function(date) {
        return date.getHours();
    },
    MM: function(date) {
        return fix0Number(date.getMinutes());
    },
    M: function(date) {
        return date.getMinutes();
    },
    ss: function(date) {
        return fix0Number(date.getSeconds());
    },
    s: function(date) {
        return date.getSeconds();
    },
    l: function(date) {
        // TODO 多少时间前
        return '';
    },
    ww: function(date) {
        var arr = '日一二三四五六'.split('');
        return '星期' + arr[date.getDay()];
    },
    w: function(date) {
        var arr = '日一二三四五六'.split('');
        return '周' + arr[date.getDay()];
    }
}

function fix0Number(num) {
    return num > 9 ? num : ('0' + num);
}

exports.filters.date.format = function(match, handler) {
    dateFormatter[match] = handler;
}

exports.ready(scan);
window.vmodel = exports;
}(window, window.document, window.location, window.history);
