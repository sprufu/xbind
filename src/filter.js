/**
 * @file 过滤器
 * @author jcode
 */

var FILTERS = {
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

function formatDate(date, format) {
    // TODO
}

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
