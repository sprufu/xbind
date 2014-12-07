function ajax(opt) {
    opt = exports.extend({}, ajax.defaults, opt);
    var xhr = new (window.XMLHttpRequest || ActiveXObject)('Microsoft.XMLHTTP'),
    data = null;

    if (opt.data) {
        data = object2UrlSearch(opt.data);
        if (opt.type.toLowerCase() == 'get') {
            if (~opt.url.indexOf('?')) {
                opt.url += '&' + data;
            } else {
                opt.url += '?' + data;
            }
            data = null;
        }
    }

    xhr.open(opt.type, opt.url, true);
    if (opt.headers) {
        var key, header;
        for (key in opt.headers) {
            xhr.setRequestHeader(key, opt.headers[key]);
        }
    }
    //xhr.overrideMimeType(opt.dataType); // 低版本IE不支持overrideMimeType
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
                    opt.error.call(opt, this, this.responseText);
                }
            }
        }
    }
    xhr.send(data);
}

ajax.defaults = {
    type: 'GET',
    dataType: 'text'
};

/**
 * 把对象转换成url参数
 * 如:
 *    {name: 'jcode', uid:215}                  ===> name=jcode&uid=215
 *    null                                      ===> 
 *    serach-string                             ===> serach-string
 */
function object2UrlSearch(object) {
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

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
