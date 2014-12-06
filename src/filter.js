/**
 * @file 过滤器
 * @author jcode
 */

var FILTERS = {
	/**
	 * name: function(obj, arg...),
	 */
	date: function(obj, format) {
		// TODO
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
	}
};

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
