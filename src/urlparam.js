/**
 * @file 解析url地址参数
 * @author jcode
 */

/* jshint -W097 */
"use strict";
var URLPARAMS       = null,

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

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
