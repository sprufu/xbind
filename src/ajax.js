"use strict";
function ajax(opt) {
    opt = exports.extend({}, options.ajax, opt);
    // var xhr = new (window.XMLHttpRequest || ActiveXObject)('Microsoft.XMLHTTP')
    var xhr = new /* ie678( */ ( /* ie678) */ window.XMLHttpRequest /* ie678( */ || ActiveXObject) /* ie678) */ ( /* ie678( */ 'Microsoft.XMLHTTP' /* ie678) */),
    data = null;

    if (opt.data) {
        data = exports.param(opt.data);
        if (opt.type.toLowerCase() == 'get') {
            if (~opt.url.indexOf('?')) {
                opt.url += '&' + data;
            } else {
                opt.url += '?' + data;
            }
            data = null;
        }
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
                            el.innerHTML = obj;
                            obj = el.firstChild;
                            el.removeChild(obj);
                            el = null;
                        } catch(err) {
                            obj = null;
                        }
                    break;
                    case 'script':
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
    async: true,
    type: 'GET',
    dataType: 'text',
    contentType: 'application/x-www-form-urlencoded'
};

/**
 * 把对象转换成url参数
 * 如:
 *    {name: 'jcode', uid:215}                  ===> name=jcode&uid=215
 *    null                                      ===> 
 *    serach-string                             ===> serach-string
 */
exports.param = function(object) {
    if ('string' == typeof object) {
        return object;
    }

    if ('number' == typeof object) {
        return object.toString();
    }

    if (!object) {
        return '';
    }

    var key, ret = [];
    for (key in object) {
        ret.push(key + '=' + window.encodeURIComponent(object[key] || ''));
    }
    return ret.join('&');
}

exports.ajax = ajax;

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
