/**
 * @file 解析url地址参数
 * @author jcode
 */

/* jshint -W097 */
"use strict";
var URL_PARAMS = null;

/**
 * 解析url参数
 */
function parseUrlParam(name, object, def) {
    if (URL_PARAMS === null) {
        URL_PARAMS = {};
        if (location.search) {
            decodeURIComponent(location.search).substr(1).split('&').map(function(it) {
                var val = it.split('=');
                URL_PARAMS[val[0]] = val[1];
            });
        }
    }

    if (object) {
        object[name] = URL_PARAMS[name] || def;
    } else {
        return URL_PARAMS[name];
    }
}

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
