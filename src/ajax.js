function ajax(opt) {
    opt = exports.extend({}, ajax.defaults, opt);
    var xhr = new (window.XMLHttpRequest || ActiveXObject)('Microsoft.XMLHTTP');
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
    xhr.send(opt.data);
}

ajax.defaults = {
    type: 'GET',
    dataType: 'text'
};

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
