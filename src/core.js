/**
 * @file 一些底层函数
 * @author jcode
 */
/* jshint -W097 */
"use strict";

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
    scanOnReady: true,

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
        'x-ajax-if': true
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

// ie678 DOMContentLoaded支持方案
// script[defer=defer]dom对象
if (ie678) {
    var id = '__ie_onload';
    // 要有src属性, 否则不能保证其它js已经被加载
    // <script id=__ie_onload defer src=javascript:></script>
    /* jshint -W060 */
    document.write('<script id='+ id + ' defer src=javascript:></script>');
    document.getElementById(id).onreadystatechange = function() {
        if (this.readyState == 'complete') {
            DOMLoadedListeners.forEach(function(fn) {
                fn();
            });
            this.onreadystatechange = null;
            addDOMLoadedListener = null;
            DOMLoadedListeners = null;
            this.parentNode.removeChild(this);
        }
    };
}

var DOMLoadedListeners = [];
function addDOMLoadedListener(fn) {
    DOMLoadedListeners.push(fn);
}

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
            //setTimeout(fn);
            DOMLoadedListeners === null ? fn() : addDOMLoadedListener(fn);
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
            classes.remove(cls);
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

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
