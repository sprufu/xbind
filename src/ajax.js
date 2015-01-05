"use strict";

var AJAX_CONTENT_TYPE_URLENCODED    = 'application/x-www-form-urlencoded';
// var AJAX_CONTENT_TYPE_FROMDATA      = 'multipart/form-data';


function ajax(opt) {
    opt = mix({}, options.ajax, opt);
    // var xhr = new (window.XMLHttpRequest || ActiveXObject)('Microsoft.XMLHTTP')
    var xhr = new /* ie678( */ ( /* ie678) */ window.XMLHttpRequest /* ie678( */ || ActiveXObject) /* ie678) */ ( /* ie678( */ 'Microsoft.XMLHTTP' /* ie678) */),
    data = null;

    if (opt.data) {
        // urlencoded方式的, 转换数据
        // 这里不另外提供jQuery方式另外参数控制
        if (opt.contentType == AJAX_CONTENT_TYPE_URLENCODED) {
            data = exports.param(opt.data);
        }

        if (opt.type.toLowerCase() == 'get') {
            if (~opt.url.indexOf('?')) {
                opt.url += '&' + data;
            } else {
                opt.url += '?' + data;
            }
            data = null;
        }
    }

    if (!opt.cache) {
        opt.url += (~opt.url.indexOf('?') ? '&' : '?') + new Date().getTime().toString();
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
                            el.innerHTML = obj.trim();
                            obj = el.firstChild;
                            el.removeChild(obj);
                            el = null;
                        } catch(err) {
                            obj = null;
                        }
                    break;
                    case 'script':
                        var el = document.createElement('script');
                        document.body.appendChild(el);
                        el.innerHTML = obj;
                        document.body.removeChild(el);
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
    async       : true,
    type        : 'get',
    dataType    : 'text',
    contentType : AJAX_CONTENT_TYPE_URLENCODED
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

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
