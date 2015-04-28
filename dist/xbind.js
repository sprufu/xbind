(function(window, document, location, history) {
/**
 * @file 一些底层函数
 * @author jcode
 */
/* jshint -W097 */


/**********************************/
/*         全局变量定义区         */
/**********************************/

/**
 * @namespace exports
 */
function exports(vm) {
    if ('string' == typeof vm) {
        vm = {$id: vm};
    }
    return new Model(vm);
}

/**
 * 配置参数, 通过exports.config供用户修改
 * @namespace
 */
var options = {
    /**
     * 字符串插值边界
     */
    interpolate: ['{{', '}}'],

    /**
     * 是否在dom准备好时扫描一次
     * 这个设置必须在dom准备好之前设置方有效
     */
    scanOnReady: false,

    /**
     * 忽略扫描的标签
     */
    igonreTags: {
        SCRIPT      : true,
        NOSCRIPT    : true,
        IFRAME      : true
    },

    /**
     * 忽略扫描的属性
     */
    igonreAttrs: {
        'x-ajax-if'         : true,
        'x-ajax-callback'   : true
    },

    /**
     * 扫描优先级定义, 没有设置优先级的都在1000, 越小越先扫描
     */
    priorities: {
        'x-skip'        : 0,
        'x-repeat'      : 10,
        'x-controller'  : 20,
        'x-if'          : 50
    }
};

/* ie678( */

// 判断ie67很简单吧
var ie67 = !"1"[0],

// 判断ie678也很简单, 因为它有个神奇的特性
ie678 = window == document && document != window;

/* ie678) */

/**
 * 常用的正则
 * @namespace exports.regexps
 */
var REGEXPS = exports.regexps = {
    /**
     * url 正则
     */
    url: /^https?\:\/\/[-a-z0-9\.]+(\/.*)?$/,

    /**
     * email地址正则
     */
    email: /^[\w\.\-]+\@[-a-z0-9]+\.\w+$/,

    /**
     * 纯数字正则
     */
    "number": /^\-?\d*\.?\d+$/,

    /**
     * 手机号码正则
     */
    phone: /^1\d{10}$/,

    /**
     * 电话号码正则
     */
    telphone: /^0\d{10,11}/,

    /**
     * 身份证正则
     */
    idcard: /^\d{6}(19\d{2}|20\d{2})(0\d|1[012])([012]\d|3[01])\d{3}[\dx]$/
};

/**********************************/
/*       底层函数区               */
/**********************************/

/**
 * 混合函数, 也就是非构造函数继承
 * 构造函数请参见extend
 * @see extend
 */
function mix () {
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
        /* jshint -W040 */
        target = this;
        --i;
    }

    for ( ; i < length; i++ ) {
        /* jshint -W041 */
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

                    target[ name ] = mix( deep, clone, copy );

                } else if ( copy !== undefined ) {
                    target[ name ] = copy;
                }
            }
        }
    }

    return target;
}

mix(exports, {
    /**
     * 暴露的混合函数
     * @memberOf exports
     * @see mix
     */
    mix: mix,

    /**
     * 判断是否是一个空的对象:{}
     * @memberof exports
     * @param {Object} obj 待检测的对象
     * @returns {boolean}
     */
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
     * 循环函数
     * 这与jQuery.each差不多, 但cb的参数顺序与jQuery.each的不同, 与Array.forEach一致
     * @memberof exports
     * @param {Array|Object} obj 是一个数组或一个PlainObject
     * @param {Function} cb 对每个元素执行的函数, 参数顺序为cb(item, index), 调用者为obj
     */
    each: function(obj, cb) {
        if (obj.forEach) {
            obj.forEach(cb);
        } else {
            var key;
            for (key in obj) {
                cb.call(obj, obj[key], key);
            }
        }
    },

    /**
     * 判断一个对角的类型
     * 类型以小写字符串返回
     * @memberof exports
     * @param {Unkown} obj 待检测对象
     * @param {string} matchType 如果给出这个值, 则用于判断obj是否是这个类型.
     */
    type: function( obj, matchType ) {
        if (matchType) {
            return exports.type(obj) == matchType;
        }

        var c = {}, s = c.toString.call(obj);

        /* ie678( */
        // ie678下null及undefined返回object修正
        if (obj === null) {
            return 'null';
        } else if(obj === undefined) {
            return 'undefined';
        }
        /* ie678) */

        return s.slice(8, -1).toLowerCase();
    },

    /**
     * DOMReady dom结点准备好时执行事件.
     * @memberOf exports
     * @param {Function} fn 待执行函数.
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
        } else if(ie678) {
            // ie678 用script的defer特性实现
            setTimeout(fn);
        }
        /* ie678) */
    },

    /**
     * 在元素上添加class
     * @memberOf exports
     * @param {Element} el 要操作的结点
     * @param {String} cls 要添加的className, 每次只能添加一个
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
     * @memberOf exports
     * @param {Element} el 要操作的结点
     * @param {String} cls 要删除的className, 每次只能删除一个
     */
    removeClass: function(el, cls) {
        if (el.classList) {
            el.classList.remove(cls);
        } else if (el.className) {
            var classes = el.className.split(' ');
            removeArrayItem(classes, cls);
            el.className = classes.join(' ');
        }
    },

    /**
     * css操作
     * @memberOf exports
     * @param {Element} el 要操作的结点
     * @param {String} name 要操作的属性
     * @param {String} value 属性值, 当省略时返回属性值, 当给予时设值属性值
     * @returns {String|undefined}
     */
    css: function(el, name, value) {
        if (arguments.length == 2) {
            // jquery式的getter
            var styles = window.getComputedStyle ? window.getComputedStyle(el) : el.currentStyle,
            style = styles[name];
            return style;
        } else {
            // ie8以下设置样式为undefined会出错.
            if ('undefined' == typeof value) {
                value = '';
            }

            el.style[name] = value;
        }
    },

    /**
     * 添加事件监听
     * @memberOf exports
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
            /* ie678( */
            if (el.addEventListener) {
                /* ie678) */
                el.addEventListener(type, function(event) {
                    var res = handler.call(el, event);
                    if (res === false) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }, false);
                /* ie678( */
            } else if (el.attachEvent){
                el.attachEvent('on' + type, function(event) {
                    var res = handler.call(el, event);
                    if (res === false) {
                        event.returnValue = false;
                        event.cancelBubble = true;
                    }
                });
            }
            /* ie678) */
        }
    },

    /**
     * 触发事件
     * 类似于jQuery的trigger
     * @memberOf exports
     * @param {Element} el 触发的元素结点
     * @param {String} type 触发的事件类型, 如: "click"
     */
    emit: function(el, type) {
        /* ie678( */
        if (ie678) {
            el.fireEvent('on'+type);
        } else {
            /* ie678) */
            var event = new window.Event(type);
            el.dispatchEvent(event);
        /* ie678( */
        }
        /* ie678) */
    },

    /**
     * 配置参数
     * @memberOf exports
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
        } else if (exports.type(key, 'object')) {
            mix(true, options, key);
        }
    }
});

// 修复浏览器字符串没有 startsWith方法
if (!''.startsWith) {
    String.prototype.startsWith = function(str) {
        return this.indexOf(str) === 0;
    };
}

/**
 * 删除数组中指定的元素
 */
function removeArrayItem(arr, it) {
    var i = arr.length;
    while (i--) {
        if (it === arr[i]) {
            arr.splice(i, 1);
        }
    }
}

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

/* jshint -W097 */


// var AJAX_CONTENT_TYPE_FROMDATA      = 'multipart/form-data';
var AJAX_CONTENT_TYPE_URLENCODED    = 'application/x-www-form-urlencoded',
ajax = exports.ajax = function (opt) {
    opt = mix({}, options.ajax, opt);
    var XMLHttpRequest = window.XMLHttpRequest || window.ActiveXObject,
    xhr = new XMLHttpRequest('Microsoft.XMLHTTP'),
    jsonpcallback,
    data = null;

    if (opt.data) {
        // urlencoded方式的, 转换数据
        // 这里不另外提供jQuery方式另外参数控制
        if (opt.contentType == AJAX_CONTENT_TYPE_URLENCODED) {
            data = exports.param(opt.data);
        }

        if (opt.type.toLowerCase() == 'get') {
            opt.url += (~opt.url.indexOf('?') ? '&' : '?') + data;
            data = null;
        }
    }

    if (!opt.cache) {
        opt.url += (~opt.url.indexOf('?') ? '&' : '?') + new Date().getTime().toString();
    }

    opt.dataType = opt.dataType.toLowerCase();
    if (opt.dataType == 'jsonp') {
        jsonpcallback = 'callback' + Math.random().toString(36).substr(2);
        opt.url += (~opt.url.indexOf('?') ? '&' : '?') + 'callback=' + jsonpcallback;
        window[jsonpcallback] = function(data) {
            opt.success.call(opt, data, xhr);
        };
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
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xhr.setRequestHeader("Accept", opt.typeAccept[opt.dataType]);
    xhr.onreadystatechange = function(e) {
        if (this.readyState == 4) {
            // 执行statusCode
            var fn = opt.statusCode[this.status];
            if (fn && fn.call(xhr) === false) {
                return;
            }

            // 执行headerCode
            var res;
            exports.each(opt.headerCode, function(fn, key) {
                var headerValue = xhr.getResponseHeader(key);
                if (headerValue && fn.call(xhr, headerValue) === false) {
                    res = false;
                }
            });
            if (res === false) {
                return;
            }

            if (this.status >= 200 && this.status < 300) {
                var el,obj = this.responseText;
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
                            el = document.createElement('div');
                            el.innerHTML = obj.trim();
                            obj = el.firstChild;
                            el.removeChild(obj);
                            el = null;
                        } catch(err) {
                            obj = null;
                        }
                    break;
                    case 'xml':
                        obj = this.responseXML;
                    break;
                    case 'jsonp':
                    case 'script':
                        el = document.createElement('script');
                        document.body.appendChild(el);
                        el.innerHTML = obj;
                        document.body.removeChild(el);
                        if (opt.dataType == 'jsonp') {
                            delete window[jsonpcallback];
                            return;
                        }
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
    };
    xhr.send(data);
};

options.ajax = {
    async       : true,
    type        : 'get',
    dataType    : 'text',
    contentType : AJAX_CONTENT_TYPE_URLENCODED,
    typeAccept  : {
        text    : "text/plain",
        html    : "text/html",
        json    : "application/json,text/json",
        script  : "application/x-javascript",
        jsonp   : "application/x-javascript"
    },
    statusCode  : {
        // 跟jQuery.ajax的statusCode差不多, 只是返回false有特殊意义, 且这个在success及error前执行.
        // 404  : function() {
        //    alert('page not found.');
        //    return false; // 返回false阻止后面success或error.
        // }
    },
    headerCode  : {
        // 响应某具体的响应头时执行
        // 这在success及error前执行, 可以返回false来阻止后面这些函数执行
        // headerCode代码比statusCode后执行
        // 参数value是响应头的值
        // 键值是响应头名
        // 默认如果响应 "location:value" 则执行跳转操作
        "location": function(value) {
             location.href = value;
             return false;
        }
    }
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
};

/**
 * @file 数据模型
 * 所有通过工厂函数加工过的数据, 都是以这个为原型
 * @author jcode
 */
/* jshint -W097 */


/**
 * 存储所有的数据
 * 以数据的id为键索引
 * @private
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
 * @private
 */
function setFieldValue(model, field, value) {
    var i, v, key, keys;
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
 * @class Model
 * @param {Object|String|undefined} vm 是一个对象是, 用来包装一个数据, 是一个字符串时, 表示对象的id, 没有参数时, 与一个空对象是一样.
 */
function Model(vm) {
    // 拷贝所有的数据到自己的属性上
    mix(this, vm, {
        /**
         * @memberOf Model
         * @property {Model} $parent 父级数据
         */
        $parent     : null,

        /**
         * @memberOf Model
         * @property {Model} $childs 子级数据列表
         */
        $childs     : [],

        /**
         * @memberOf Model
         * @property {Element} $element 所绑定的结点(作用域), 没有绑定的为null
         */
        $element    : null,

        /**
         * @memberOf Model
         * @property {boolean} $freeze 数据是否被冻结, 被冻结的数据不触发视图更新
         */
        $freeze     : false,

        /**
         * @memberOf Model
         * @private
         * @property {Object} $cache 字段值缓存
         * @see Model#$get
         */
        $cache      : {},

        /**
         * @memberOf Model
         * @property {Object} $subscribes 订阅者列表
         */
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
        /**
         * @memberOf Model
         * @property {String} id 数据id标识
         */
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
     * @see Model#$set
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
     * @see Model#$get
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
            namespace = value ? value + '.' : '',

            namespaces,

            // 更新的对象
            obj = this;

            if (value) {
                k = 0;
                namespaces = value.split('.');
                while (k < namespaces.length) {
                    if (!obj[namespaces[k]]) {
                        obj[namespaces[k]] = {};
                    }
                    obj = obj[namespaces[k]];
                    k++;
                }
            }

            // 批量设置值
            mix(true, obj, field);

            // 设置缓存
            for(k in field) {
                this.$cache[namespace + k] = field[k];
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
     * @see Model#$fire
     * @see Model#$unwatch
     */
    $watch: function(field, observer) {
        if (!this.$subscribes[field]) {
            this.$subscribes[field] = [];
        }
        this.$subscribes[field].push(observer);
    },

    /**
     * 取消订阅
     * @see Model#$watch
     * @see Model#$fire
     */
    $unwatch: function(field, observer) {
        if (this.$subscribes[field]) {
            removeArrayItem(this.$subscribes[field], observer);
        }
    },

    /**
     * 通知订阅者更新自己
     * @see Model#$watch
     * @see Model#$unwatch
     */
    $fire: function(field) {
        if (this.$freeze) {
            return;
        }

        var subscribes = getSubscribes(this, field),
        i = 0;

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
                    owner: this,
                    update: function(parentModel, field) {
                        if (!model.hasOwnProperty(field)) {
                            model.$fire(field);
                        }
                    }
                };
                model.$parent.$watch('*', observer);
            }
        }

        element.$modelId = model.$id;
        this.$element = element;
    }

};

/**
 * Observer = {
 *    update: function(model, value, field)
 * }
 */

/**
 * 获取一个数据的所有订阅
 */
function getSubscribes (model, field) {
    var ret = [];
    try {
        for (var key in model.$subscribes) {
            if (key == '*' || key == field || key.startsWith(field + '.')) {
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
    el = el.parentNode;
    while (el) {
        if (el.$modelId) {
            return MODELS[el.$modelId];
        }
        el = el.parentNode;
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
        removeArrayItem(parent.$childs, model);
        var subscribes = parent.$subscribes['*'],
        i = subscribes.length;
        while (i--) {
            if (subscribes[i].owner == model) {
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
 * @memberOf exports
 * @param {string|Element} id 当为字符串时, 表示id, 否则表示结点
 * @returns {Model|null}
 */
exports.model = function(id) {
    return 'string' == typeof id ? MODELS[id] || null : getExtModel(id);
};

/* jshint -W097 */


/**
 * 扫描结点, 添加绑定
 * @param {Element} element 从哪个结点开始扫描(扫描它及它的子结点), 如果省略, 从页面顶级开始扫描.
 * @param {Model} model 这结点拥有的数据对象, 可以从上级取得
 * @param {boolean} cache 是否缓存扫描结果
 */
function scan(element, model, cache) {
    element = element || document.documentElement;
    cacheParse = cache;

    if (!model) {
        model = new Model();
        model.$scope(element);
    }

    switch(element.nodeType) {
    // 普通结点
    case 1:
        if (!options.igonreTags[element.tagName]) {
            model = scanAttrs(element, model) || model;
            if (!element.$noScanChild && element.childNodes.length) {
                scanChildNodes(element, model, cache);
            }
        }
    break;
    // 文本结点
    case 3:
        scanText(element, model);
    break;
    }

    return model;
}

exports.scan = scan;

function scanChildNodes(element, parentModel, cache) {
    var el = element.firstChild;
    while (el) {
        scan(el, parentModel, cache);
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

        // 跳过扫描其它属性机制
        if (element.$skipOtherAttr) {
            // ie67不能delete
            //delete element.$skipOtherAttr;
            /* ie678( */
            if (ie67) {
                element.$skipOtherAttr = null;
            } else {
                /* ie678) */
                delete element.$skipOtherAttr;
                /* ie678( */
            }
            /* ie678) */
            break;
        }
    }

    return model;
}

function scanText(element, parentModel) {
    bindModel(parentModel, element.data, parseString, function(res) {
        element.data = res;
    });
}

/*
 * 低版本安卓(android2)及IE的比较函数必须返回-1, 0或1
 * 而chrome, firefox则需要返回true或false
 */
var orderFn, testOrderArray = [{k:2},{k:3}];
testOrderArray.sort(function(a,b) {
    return a.k < b.k;
});
orderFn = testOrderArray[0].k == 2 ? function(a,b) {
    return a.priority > b.priority ? -1 : a.priority < a.priority ? 1 : 0;
} : function(a, b) {
    return a.priority < b.priority;
};

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
    var res = [],
    i = attrs.length, attr, param, endpos, type;
    while (i--) {
        attr = attrs[i];

        /* ie678( */
        // 过滤ie67的element.attributes得到一大堆属性
        if (!attr.specified) {
            continue;
        }
        /* ie678) */

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

    return res.sort(orderFn);
}

/**
 * @file 浏览器补丁, 主要用来兼容ie678
 * 如果不考虑ie678, 可以去掉这个文件
 * @author jcode
 */
/* jshint -W097 */


/* ie678( */
if (!''.trim) {
    var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
    String.prototype.trim = function(str) {
        return this.replace(rtrim, '');
    };
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
    };
}

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(el) {
        for(var i=0; i<this.length; i++) {
            if (this[i] == el) {
                return i;
            }
        }
        return -1;
    };
}

if (!Function.prototype.bind) {
    Function.prototype.bind = function(scope) {
        var fn = this;
        return function() {
            return fn.apply(scope, arguments);
        };
    };
}

/* ie678) */

/**
 * 属性扫描定义的回调
 */
/* jshint -W097 */


function compileElement(element, removeAttrbuteName, removeClassName, noScanChild, skipNextSibling, skipScanOtherAttrs) {
    removeAttrbuteName  && element.removeAttribute(removeAttrbuteName);
    removeClassName     && exports.removeClass(removeClassName);
    noScanChild         && (element.$noScanChild = true);
    skipNextSibling     && (element.$nextSibling = element.nextSibling);
    skipScanOtherAttrs  && (element.$skipOtherAttr = true);
}

/**
 * 扫描器列表
 * @namespace
 */
exports.scanners = {
    /**
     * 忽略扫描这结点及其子结点
     */
    'x-skip': function(model, element, value, attr) {
        compileElement(element, attr.name, 0, 1, 0, 1);
    },

    /**
     * 单击绑定
     * 这个绑定在将来版本中去掉, 请使用x-on事件绑定代替
     */
    'x-click': function(model, element, value, attr) {
        exports.scanners['x-on'](model, element, value, attr, 'click');
    },

    /**
     * 事件绑定
     */
    'x-on': function(model, element, value, attr, param) {
        var fn = getFn(parseExecute(value));
        compileElement(element, attr.name);
        exports.on(element, param, function(event) {
            return fn(model);
        });
    },

    /**
     * 当a[href=""]时, 阻止默认点击行为和事件冒泡
     */
    'href': function(model, element, value) {
        // ie下使用getAttribute第二个参数, 避免属性进行了转换
        // https://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
        if (element.tagName == 'A' && element.getAttribute("href", 2) === '') {
            exports.on(element, 'click', function() {
                return false;
            });
        }
    },

    'x-controller': function(model, element, value, attr, param) {
        model = MODELS[value];
        compileElement(element, attr.name, 'x-controller');
        if (model && !model.element) {
            model.$scope(element, param != 'top');
            return model;
        }
    },

    /**
     * 初始化数据
     */
    'x-init': function(model, element, value, attr) {
        if (!model) {
            return;
        }

        compileElement(element, attr.name);
        var expr = parseExecute(value),
        /* jshint -W054 */
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
        compileElement(element, attr.name, 'x-template', 1, 1);
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
        compileElement(element, attr.name, 'x-include', 1);
        bindModel(model, value, parseExpress, function(res) {
            // 回收垃圾数据
            // 是不是做个条件回收?
            gcElement(element, true);

            if (TEMPLATES[res]) {
                var copyEl = TEMPLATES[res].element.cloneNode(true);

                /* ie678( */
                // ie678的cloneNode会连同自定义属性一起拷贝
                // 且ie67还不能delete
                if (ie678) {
                    copyEl.$noScanChild = false;
                }
                /* ie678) */

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
        compileElement(element, attr.name, 'x-repeat', 1, 1, 1);
        element.parentNode.removeChild(element);

        bindModel(model, value, parseExpress, function(res) {
            if (!res) {
                return;
            }

            var el = startElement.nextSibling;

            // 循环删除已经有的结点
            while (el && el != endElement) {
                gcElement(el);
                el.parentNode.removeChild(el);
                el = startElement.nextSibling;
            }

            // 循环添加
            exports.each(res, function(item, i) {
                var el = element.cloneNode(true);
                /* ie678( */
                if (ie678) {
                    el.$noScanChild = false;
                }
                /* ie678) */

                var model = new Model({
                    $index: i,
                    $key: i,
                    $remove: function() {
                        el.parentNode.removeChild(el);
                        gc(model);
                    },
                    $first: !i,
                    $last: i == res.length,
                    $middle: i > 0 && i < res.length
                });
                model[param] = item;

                parent.insertBefore(el, endElement);
                model.$scope(el);
                scan(el, model, true);

                // 置空el, 打破循环引用导致无法回收clone出来的结点.
                el = null;
            });
        });
    },

    'x-if': function(model, element, value, attr) {
        var parent = element.parentElement,
        parentModel = getParentModel(element),
        replaceElement = document.createComment('x-if:' + model.$id);

        compileElement(element, attr.name, 'x-if', 0, 1);

        model = getModel(element) || new Model();
        if (!element.$modelId) {
            model.$scope(element);
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
        compileElement(element, attr.name, 'x-show');
        bindModel(model, value, parseExpress, function(res) {
            element.style.display = res ? "" : "none";
        });
    },

    'x-bind': function(model, element, value, attr) {
        compileElement(element, attr.name);
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
                                removeArrayItem($value, item);
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
        compileElement(element, attr.name, 'x-class');
        bindModel(model, value, parseExpress, function(res) {
            if (res) {
                exports.addClass(element, param);
            } else {
                exports.removeClass(element, param);
            }
        });
    },

    /**
     * 属性绑定
     * 把结果设置属性值,
     * 如果计算结果为空的字符串, 则删除属性
     */
    'x-attr': function(model, element, value, attr, param) {
        compileElement(element, attr.name);
        bindModel(model, value, parseString, function(res) {
            if (res) {
                element.setAttribute(param, res);
            } else {
                element.removeAttribute(param);
            }
        });
    },

    /**
     * ajax数据绑定
     */
    'x-ajax': function(model, element, value, attr, param) {
        compileElement(element, attr.name, 'x-ajax');

        var

        // 请求的地址, 这个参数可能在变, 因为可能会与数据绑定
        url,

        // 请求条件
        // 根据 x-ajax-if 结果求得
        // 用于条件加载
        $if = true,
        ifBindExpr = element.getAttribute('x-ajax-if'),
        callback,
        callbackExpr = element.getAttribute('x-ajax-callback'),

        // 请求的方法
        read = function() {
            ajax({
                type: 'GET',
                dataType: 'json',
                cache: false,
                url: url,
                success: function(res) {
                    model.$set(param + '.$error', null);
                    model.$set(res, param);
                    callback && callback(model);
                },
                error: function(xhr, err) {
                    model.$set(param + '.$error', err);
                }
            });
        };

        if (callbackExpr) {
            callbackExpr = parseExecute(callbackExpr, {});
            callback = new Function('$model', callbackExpr);
        }

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
        compileElement(element, attr.name, 'x-style');
        bindModel(model, value, parseExpress, function(res) {
            exports.css(element, cssName, res);
        });
    }
};

function bindModel(model, str, parsefn, updatefn) {
    var fields = {},
    expr = parsefn(str, fields);
    if (exports.isEmptyObject(fields)) {
        return false;
    }

    var fn = getFn(expr),
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

var fnCache = {};
function getFn(str) {
    if (fnCache[str]) {
        return fnCache[str];
    }

    /* jshint -W054 */
    var fn = new Function('$model,filter', 'return ' + str);
    fnCache[str] = fn;
    return fn;
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

/**
 * @class
 */
function Template(id, element) {
    /**
     * @property {String} id 唯一的属性id
     */
    this.id = id;

    /**
     * @property {Element} element 模板对应的结点
     */
    this.element = element;
    TEMPLATES[id] = this;
}

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
/**
 * @file 表达式字符串解析
 * @author jcode
 */
/* jshint -W097 */


var
filterRegExp    = /(\w+)(.*)/,
URLPARAMS       = null,
exprActionReg   = /[-\+\*\/\=\(\)\%\&\|\^\!\~\,\?\s\>\<\:]+/g,    // 表达式操作符
whithReg        = /^[\s\uFEFF\xA0]$/,
cacheParse      = false,
cacheParses     = {
    string : {},
    express: {}
},
parseJSON       = window.JSON ? window.JSON.parse : function(str) {
    /* jshint -W054 */
    return (new Function('', 'return ' + str.trim())());
};

/**
 * 解析插值字符串
 */
function parseString(str, fields) {
    var cache;
    // get from cache
    if (cacheParse && (cache = cacheParses.string[str])) {
        mix(fields, cache.fields);
        return cache.expr;
    }

    // parse string
    var txt = '""',
    tmp,
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
                tmp = replaceWrapLineString(str.substring(pos, pos1));
                if (tmp) {
                    txt += '+"' + tmp + '"';
                }
                txt += '+(' + parseExpress(str.substring(pos1 + len1, pos2), fields, true) + ')';
                pos = pos1 = pos2 = pos2 + len2;
            } else {
                tmp = replaceWrapLineString(str.substr(pos));
                if (tmp) {
                    txt += '+"' + tmp + '"';
                }
                break;
            }
        } else {
            tmp = replaceWrapLineString(str.substr(pos));
            if (tmp) {
                txt += '+"' + tmp + '"';
            }
            break;
        }
    }

    // cache the result.
    if (cacheParse) {
        cacheParses.string[str] = {
            fields: fields,
            expr: txt
        };
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
    var cache;
    // get from cache
    if (cacheParse && (cache = cacheParses.express[str])) {
        mix(fields, cache.fields);
        return cache.expr;
    }

    try {
        var expr, filters = [];

        str = divExpress(str, filters, fields);
        expr = parseExecuteItem(str.trim(), fields, isDisplayResult);

        if (filters.length) {
            var filter, ifn = '(function(expr){';
            for (var i=0; i<filters.length; i++) {
                filter = filters[i];
                ifn += 'expr=filter("' + filter.name + '",expr' + (filter.args.trim() ? ',' + filter.args : '') + ');';
            }
            expr = ifn + 'return expr;}(' + expr + ', $model))';
        }

        // cache the result.
        if (cacheParse) {
            cacheParses.express[str] = {
                fields: fields,
                expr: expr
            };
        }

        return expr;
    } catch (err) {
        return '';
    }
}

/**
 * 把表达式分离成表达式和过滤器两部门
 * @param {String} str 表达式, 也就是双花括号的中间部分
 * @param {Array} filters 传值的过滤器引用, 用于收集过滤器, 过滤器要分解出其参数, 所以是一个对象的数组, 如: [{
 *     name: 'date', // 过滤器名字
 *     args: 'yyyy-mm-dd', // 参数列表
 * }]
 * @returns {String} 没有带过滤器的表达式
 */
function divExpress(str, filters, fields) {
    var pos = 0, expr;
    while (true) {
        pos = str.indexOf('|', pos);
        if (~pos) {
            if (str.charAt(pos + 1) == '|') {
                pos += 2;
            } else {
                /* jshint -W083 */
                str.substr(pos + 1).split('|').forEach(function(str) {
                    var filter = parseFilter(str, fields);
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
function parseFilter(str, fields) {
    var p = filterRegExp.exec(str);
    return {
        name: p[1],
        args: parseExecuteItem(p[2].trim(), fields)
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
 * parseExecute的辅助函数, 用来解析单个表达式, str两边已经去掉无用的空白符
 * 如:
 *    clickHandler
 *    user.age + 1
 *    user.getName()
 *
 * 这与javascript表达式有所不同, "."两边不能有空格, 如: user.  age
 */
function parseExecuteItem(str, fields, isDisplayResult) {
    var ret, actions, c = str.charAt(0),
    model = {
        isField: false
    };

    if (c == '"' || c == "'") {
        return str;
    }

    actions = str.match(exprActionReg);
    if (actions) {
        ret = '';
        var field,
        pos0 = 0,
        pos,
        i = 0;

        // 循环解析操作符分隔的每个表达式
        // 并把他们加在一起
        for (; i<actions.length; i++) {
            if (whithReg.test(actions[i])) {
                // 是纯空白的不处理
                continue;
            }

            model.isField = false;

            pos = str.indexOf(actions[i], pos0);
            field = str.substring(pos0, pos);
            ret += parseStatic(field, isDisplayResult, model) + actions[i];
            pos0 = pos + actions[i].length;

            // 不是方法, 而是属性的话, 要加到监听列表里
            // 不是关键字及数字.
            if (model.isField && actions[i].indexOf('(') == -1) {
                fields[field] = true;
            }
        }

        // 处理最后结尾部分
        if (str.length > pos0) {
            field = str.substr(pos0);
            model.isField = false;
            var res = parseStatic(field, isDisplayResult, model);
            if (res != field) {
                fields[field] = true;
            }
            ret += res;
        }

        return ret;
    } else {
        ret = parseStatic(str, isDisplayResult, model);
        if (model.isField) {
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
'$model return if else true false null undefined this'.split(' ').forEach(function(item) {
    options.keywords[item] = true;
});

function parseStatic(str, isDisplayResult, model) {
    if (!str) {
        return '';
    }

    // 普通常量, 常量有很多, 这里只处理几个常用的
    if (options.keywords[str]) {
        return str;
    }

    // 数字
    if (REGEXPS.number.test(str)) {
        return str;
    }

    var c=str.charAt(0);
    if (c == '"' || c == "'") {
        return str;
    }

    model.isField = true;

    return '$model.$get("' + str + '"' + (isDisplayResult ? ',0,1':'') +')';
}

if (options.scanOnReady) {
    exports.ready(scan);
}

if (window.define && window.define.amd) {
    window.define(function() {
        return exports;
    });
} else {
    window.xbind = exports;
}
/**
 * @file 过滤器
 * @author jcode
 */
/* jshint -W097 */


/**
 * 过滤器列表
 * @namespace
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

        if (suffix === undefined) {
            suffix = '...';
        }

        return str.substring(0, num) + suffix;
    },

    "number": function(it, num) {
        it = +it;
        return it.toFixed(num);
    },

    /**
     * 默认值过滤器
     * 当给定的对象不可用时, 采用默认值做结果
     * @param {boolean} strict 采用严格模式, 在严格模式下, 只有obj严格为undefined时才用默认值
     */
    "default": function(obj, def, strict) {
        return (strict && obj === undefined) || !obj ? def : obj;
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
    },

    /**
     * 变换数据格式成目标格式
     * 注意, 不要去监听目标字段
     */
    convert: function(obj, from, to) {
        if (obj && obj.forEach) {
            obj.forEach(function(item) {
                item[to] = item[from];
            });
        } else if(obj) {
            obj[to] = obj[from];
        }
        return obj;
    },

    /**
     * 排序过滤器, 按某字段排序
     * @memberOf filters
     * @param {Array} obj 待排序的数组
     * @param {String|Function} field 按什么字段排序, 数组中的元素不是对象是, 省略这参数, 如果为函数, 用来做为排序函数, 当然此时第三个参数无效
     * @param {boolean} desc 是否按降序
     * @returns {Array} 返回排序好后数组
     */
    sort: function(obj, field, desc) {
        if (typeof field == 'boolean') {
            desc = field;
            field = null;
        }

        return obj && obj.sort ? obj.sort('function' == typeof field ? field : function(a, b) {
            if (!field) {
                return desc ? a > b : a < b;
            }
            return desc ? (a[field] > b[field]) : (a[field] < b[field]);
        }) : obj;
    },

    /**
     * 外键过滤器
     */
    foreign: function(key, obj) {
        return obj && obj[key];
    },

    /**
     * url参数格式化
     */
    param: exports.param
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
    if (!date) {
        return '';
    }

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
            case 'l'    : return formatLastDisplay(date); // 刚刚，5分钟前，2小时前，3天前，5个月前。。。
            default     : return dateFormatter[str] ? dateFormatter[str].call(date) : str;
        }
    });
}

function fix0Number(num) {
    return num > 9 ? num : ('0' + num);
}

function formatLastDisplay(date) {
    // 与当前时间差
    var diff = (new Date() - date) / 1000;
    if (diff < 60) {
        return '刚刚';
    }

    diff /= 60;
    if (diff < 60) {
        return Math.floor(diff) + '分钟前';
    }

    diff /= 60;
    if (diff < 24) {
        return Math.floor(diff) + '小时前';
    }

    diff /= 24;
    if (diff < 30) {
        return Math.floor(diff) + '天前';
    }

    diff /= 30;
    if (diff < 12) {
        return Math.floor(diff) + '月前';
    }

    return Math.floor(diff / 12) + '年前';
}

var dateFormatter = {};
exports.filters.date.format = function(match, handler) {
    dateFormatter[match] = handler;
};

/**
 * 执行过滤器
 * @param {string} filterName 过滤器名字
 * @param {Object} obj 用于过滤器的对象
 * @param {Object} args 过滤器参数, 可以有多个或省略
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
/* jshint -W097 */


mix(exports.scanners, {
    /**
     * 表单操作
     * @memberOf scanners
     */
    'x-form': function(model, element, value, attr, param) {
        element.removeAttribute(attr.name);
        mix(model, {
            $xform: param,
            $dirty: false, // 是否更改过
            $valid: true // 是不验证通过
        });
        return model;
    },

    /**
     * 最小值限制验证
     * @memberOf scanners
     */
    min: function(model, element, value) {
        var minValue = +value;
        bindValidModel(element, function() {
            updateFormItem(element, 'min', +element.value >= minValue);
        });
    },

    /**
     * 最大值限制验证
     * @memberOf scanners
     */
    max: function(model, element, value) {
        var maxValue = +value;
        bindValidModel(element, function() {
            updateFormItem(element, 'max', +element.value <= maxValue);
        });
    },

    /**
     * 最小长度验证
     * @memberOf scanners
     */
    minlength: function(model, element, value) {
        var minValue = +value;
        bindValidModel(element, function() {
            updateFormItem(element, 'minlength', element.value.length >= minValue);
        });
    },

    /**
     * 最大长度验证
     * @memberOf scanners
     */
    maxlength: function(model, element, value) {
        var maxValue = +value;
        bindValidModel(element, function() {
            updateFormItem(element, 'maxlength', element.value.length <= maxValue);
        });
    },

    /**
     * 正则验证
     * @memberOf scanners
     */
    pattern: function(model, element, value) {
        var regexp = new RegExp(value);
        bindValidModel(element, function() {
            updateFormItem(element, 'pattern', element.value.test(regexp));
        });
    },

    /**
     * 必填验证
     * @memberOf scanners
     */
    required: function(model, element) {
        bindValidModel(element, function() {
            updateFormItem(element, 'required', !!element.value);
        });
    },

    /**
     * 类型判断
     * @memberOf scanners
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

}(window, document, location, history));
