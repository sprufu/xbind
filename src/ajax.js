/* jshint -W097 */
"use strict";

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

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
