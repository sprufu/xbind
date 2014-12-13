/**
 * @file 一些底层函数
 * @author jcode
 */
"use strict";

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

        return s.slice(8, -1).toLowerCase();
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
