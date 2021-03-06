/**
 * @file 过滤器
 * @author jcode
 */
/* jshint -W097 */
"use strict";

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
	 * 字符串替换
	 */
	replace: function(str, patten, dist) {
		var reg = new RegExp(patten, 'g');
		return str.replace(reg, dist);
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

// ie及firefox不兼容这种日期格式
var notCompatDateParse = isNaN(Date.parse('2015-01-22 14:32:04'));

/**
 * 解析日期字符串
 * 字符串就应该符合如下格式:
 *      yyyy/mm/dd[ hh:MM:ss] yyyy-mm-dd[ hh:MM:ss]
 *      mm/dd/yyyy[ hh:MM:ss] mm-dd-yyyy[ hh:MM:ss]
 *      2014-12-09T03:24:08.539Z
 */
function parseDateString(str) {
	if (notCompatDateParse) {
		str = str.replace(/-/g, '/');
	}

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

    if (diff < 2) {
        return '昨天';
    }

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

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
