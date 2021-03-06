/**
 * 属性扫描定义的回调
 */
/* jshint -W097 */
"use strict";

function compileElement(element, removeAttributeName, removeClassName, noScanChild, skipNextSibling, skipScanOtherAttrs) {
    removeAttributeName  && element.removeAttribute(removeAttributeName);
    removeClassName     && exports.removeClass(element, removeClassName);
    noScanChild         && (element.$noScanChild = true);
    skipNextSibling     && (element.$nextSibling = element.nextSibling);
    skipScanOtherAttrs  && (element.$skipOtherAttr = true);
}

function bindEvent(model, element, express, attr, param, once) {
    var fn = getFn(parseExecute(express), true);
    compileElement(element, attr.name);
    exports.on(element, param, function () {
        return fn.call(element, model);
    }, once);
}
/**
 * 扫描器列表
 * @namespace
 */
exports.scanners = {
    /**
     * 忽略扫描这结点及其子结点
     */
    'x-skip': function(model, element, value, attr) {
        compileElement(element, attr.name, 0, 1, 0, 1);
    },

    /**
     * 单击绑定
     * 这个绑定在将来版本中去掉, 请使用x-on事件绑定代替
     */
    'x-click': function(model, element, value, attr) {
        exports.scanners['x-on'](model, element, value, attr, 'click');
    },

    /**
     * 事件绑定
     */
    'x-on': function(model, element, value, attr, param) {
        bindEvent(model, element, value, attr, param);
    },

    // 一次性绑定事件
    'x-once': function(model, element, value, attr, param) {
        bindEvent(model, element, value, attr, param, true);
    },

    /**
     * 当a[href=""]时, 阻止默认点击行为和事件冒泡
     */
    'href': function(model, element, value) {
        // ie下使用getAttribute第二个参数, 避免属性进行了转换
        // https://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
        if (element.tagName == 'A' && element.getAttribute("href", 2) === '') {
            exports.on(element, 'click', function() {
                return false;
            });
        }
    },

    'x-controller': function(model, element, value, attr, param) {
        model = MODELS[value];
        compileElement(element, attr.name, 'x-controller');
        if (model && !model.element) {
            model.$scope(element, param != 'top');
            return model;
        }
    },

    /**
     * 初始化数据
     */
    'x-init': function(model, element, value, attr) {
        if (!model) {
            return;
        }

        compileElement(element, attr.name);
        var expr = parseExecute(value),
        /* jshint -W054 */
        fn = new Function('$model', expr);
        fn.call(element, model);
    },

    /**
     * 用来定义一个模板
     * <div x-template="tplId"> ... </div>
     *
     * 模板包括最外层的Element,
     * 扫描后会移出这个结点, 并移出这个属性及x-template的class
     * 可以设置.x-template{display:none}避免没有扫描到时显示错乱
     */
    'x-template': function(model, element, value, attr) {
        compileElement(element, attr.name, 'x-template', 1, 1);
        new Template(value, element);
        element.parentNode.removeChild(element);
    },

    /**
     * 加载一个模板到子结点
     * <div x-include="tplId or urlString"></div>
     *
     * 所有在页面上定义的模板, 在首次扫描时就收集到TEMPLATES中,
     * 从url加载的模板加载一次后也会收集到TEMPLATES中
     * 优先从TEMPLATES中查找, 如果没有就从url中加载.
     */
    'x-include': function(model, element, value, attr) {
        compileElement(element, attr.name, 'x-include', 1);
        bindModel(model, value, parseExpress, function(res) {
            // 回收垃圾数据
            // 是不是做个条件回收?
            gcElement(element, true);

            if (TEMPLATES[res]) {
                var copyEl = TEMPLATES[res].element.cloneNode(true);

                /* ie678( */
                // ie678的cloneNode会连同自定义属性一起拷贝
                // 且ie67还不能delete
                if (ie678) {
                    copyEl.$noScanChild = false;
                }
                /* ie678) */

                element.innerHTML = '';
                element.appendChild(copyEl);
                scan(copyEl, model);
            } else {
                ajax({
                    url: res,
                    cache: true,
                    dataType: 'html',
                    success: function(html) {
                        var tpl = new Template(res, html),
                        copyEl = tpl.element.cloneNode(true);
                        element.innerHTML = '';
                        element.appendChild(copyEl);
                        scan(copyEl, model);
                    },
                    error: function() {
                        throw new Error('Cannot find template: ' + res);
                    }
                });
            }

        });
    },

    'x-repeat': function(model, element, value, attr, param) {
        var parent = element.parentNode,
        startElement = document.createComment('x-repeat-start:' + param),
        endElement = document.createComment('x-repeat-end:' + param);

        // 插入定界注释结点
        parent.insertBefore(startElement, element);
        parent.insertBefore(endElement, element.nextSibling);

        // 设定下一个扫描结点
        compileElement(element, attr.name, 'x-repeat', 1, 1, 1);
        element.parentNode.removeChild(element);

        bindModel(model, value, parseExpress, function(res) {
            if (!res) {
                return;
            }

            var el = startElement.nextSibling;

            // 循环删除已经有的结点
            while (el && el != endElement) {
                gcElement(el);
                el.parentNode.removeChild(el);
                el = startElement.nextSibling;
            }

            // 循环添加
            exports.each(res, function(item, i) {
                var el = element.cloneNode(true);
                /* ie678( */
                if (ie678) {
                    el.$noScanChild = false;
                }
                /* ie678) */

                var model = new Model({
                    $index: i,
                    $key: i,
                    $remove: function() {
                        el.parentNode.removeChild(el);
                        gc(model);
                    },
                    $first: !i,
                    $last: i == res.length,
                    $middle: i > 0 && i < res.length
                });
                model[param] = item;
				model.$model = model;

                parent.insertBefore(el, endElement);
                model.$scope(el);
                scan(el, model, true);

                // 置空el, 打破循环引用导致无法回收clone出来的结点.
                el = null;
            });
        });
    },

    // 条件扫描 x-scan="express" 当条件为真时才扫描子结点
    'x-scan': function(model, element, value) {
        compileElement(element, 'x-scan', 'x-scan', 1, 0, 1);
        bindModel(model, value, parseExpress, function(res, observer, fields) {
            if (res) {
                element.$noScanChild = false;
                element.$skipOtherAttr = false;
                scan(element, model, false);
                for(var field in fields) {
                    model.$unwatch(field, observer);
                }
            }
        });
    },

    'x-if': function(model, element, value, attr) {
        var parent = element.parentElement,
        parentModel = getParentModel(element),
        replaceElement = document.createComment('x-if:' + model.$id);

        compileElement(element, attr.name, 'x-if', 1, 1);

        model = getModel(element) || new Model();
        if (!element.$modelId) {
            model.$scope(element);
        }

        bindModel(parentModel, value, parseExpress, function(res) {
            if (res) {
                element.parentElement || parent.replaceChild(element, replaceElement);
                model.$freeze = false;
				scanChildNodes(element, model);
                for (var field in model.$watchs) {
                    model.$fire(field);
                }
            } else {
                element.parentElement && parent.replaceChild(replaceElement, element);
                model.$freeze = true;
            }
        });
        return model;
    },

    'x-show': function(model, element, value, attr) {
        compileElement(element, attr.name, 'x-show');
        bindModel(model, value, parseExpress, function(res) {
            element.style.display = res ? "" : "none";
        });
    },

    'x-bind': function(model, element, value, attr, param) {
        compileElement(element, attr.name);
		var field, pos = value.indexOf('|');
		if (pos == -1) {
			field = value;
		} else {
			field = value.substr(0, pos).trim();
		}
        bindModel(model, value, parseExpress, function(res) {
			if ('undefined' == typeof res) return;
            if (element.tagName == 'INPUT') {
                if (element.type == 'radio') {
                    if (res == element.value) {
                        element.checked = true;
                    } else {
                        element.checked = false;
                    }
                } else if (element.type == 'checkbox') {
                    if (!res || ~res.indexOf(element.value)) {
                        element.checked = true;
                    } else {
                        element.checked = false;
                    }
                } else {
                    element.value = res || '';
                }
            } else {
                element.value = res || '';
            }
        });

        if (element.tagName == 'INPUT' && element.type == 'checkbox') {
            var v = model.$get(field);
            if (v && !exports.type(v, 'array')) {
                throw new TypeError('Checkbox bind must be array.');
            }

            if (!v) {
                model.$set(field, []);
            }

            exports.on(element, 'click', function(e) {
                var $value = model.$get(field),
                    item = element.value;

                if (element.checked) {
                    $value.push(item);
                } else {
                    // 删除掉元素
                    removeArrayItem($value, item);
                }

                model.$set(field, $value);
            });
        } else {
            exports.on(element, param ? camelize(param) : 'change', function() {
                model.$set(field, element.value);
            });
        }
    },

    /**
     * class类操作
     * avalon用 ms-class="className: expr",
     * 但我觉得x-class-className="expr" 更直观些,
     * 且当操作多个class时不需要像avalon那样添加杂质.
     * 但这样有个问题, 就是类名只能用小写, 因为属性名都会转化为小写的
     * 当expr结果为真时添加class, 否则移出
     */
    'x-class': function(model, element, value, attr, param) {
        compileElement(element, attr.name, 'x-class');
        bindModel(model, value, parseExpress, function(res) {
            if (res) {
                exports.addClass(element, param);
            } else {
                exports.removeClass(element, param);
            }
        });
    },

    /**
     * 属性绑定
     * 把结果设置属性值,
     * 如果计算结果为空的字符串, 则删除属性
     */
    'x-attr': function(model, element, value, attr, param) {
        compileElement(element, attr.name);
        bindModel(model, value, parseString, function(res) {
            if (res) {
                element.setAttribute(param, res);
            } else {
                element.removeAttribute(param);
            }
        });
    },

    /**
     * ajax数据绑定
     */
    'x-ajax': function(model, element, value, attr, param) {
        compileElement(element, attr.name, 'x-ajax');

        var

        // 请求的地址, 这个参数可能在变, 因为可能会与数据绑定
        url,

        // 请求条件
        // 根据 x-ajax-if 结果求得
        // 用于条件加载
        $if = true,
        ifBindExpr = element.getAttribute('x-ajax-if'),
        callback,
        callbackExpr = element.getAttribute('x-ajax-callback'),

        // 请求的方法
        read = function() {
            ajax({
                type: 'GET',
                dataType: 'json',
                cache: false,
                url: url,
                success: function(res) {
                    model.$set(param + '.$error', null);
                    if (Array.isArray(res)) {
                        model.$set(param, res);
                    } else {
                        model.$set(res, param);
                    }
                    callback && callback(model);
                },
                error: function(xhr, err) {
                    model.$set(param + '.$error', err);
                }
            });
        };

        if (callbackExpr) {
            callbackExpr = parseExecute(callbackExpr, {});
            /* jshint -W054 */
            callback = new Function('$model', callbackExpr);
        }

        // 暴露加载函数, 供外部需要时加载数据
        model[param] = {
            $read: read
        };

        // 绑定加载条件
        if (ifBindExpr) {
            element.removeAttribute('x-ajax-if');
            bindModel(model, ifBindExpr, parseExpress, function(res) {
                $if = res;
            });
        }

        // 绑定url变化
        // 当url发生改变时重新加载数据
        // 调用这个时务必要给绑定赋初值, 否则加加载如: /ajax?id=undefined
        // TODO 基于这个不正确加载, 后期考虑条件加载机制.
        var bind = bindModel(model, value, parseString, function(res) {
            url = res;
            $if && read();
        });

        // 如果没有字符串插值
        // 也就是url一层不变, 那么加载一次数据
        if (bind === false) {
            url = value;
            $if && read();
        }

        return model;
    },

    'x-style': function(model, element, value, attr, param) {
        var cssName = camelize(param);
        compileElement(element, attr.name, 'x-style');
        bindModel(model, value, parseExpress, function(res) {
            exports.css(element, cssName, res);
        });
    }
};

function bindModel(model, str, parseFn, updateFn) {
    var fields = {},
    expr = parseFn(str, fields);
    if (!expr) {
        return;
    }

    var fn = getFn(expr),
    observer = {
        update: function(model) {
            updateFn(fn(model, exports.filter), observer, fields);
        }
    };

    for (var field in fields) {
        getRealModel(model, field).$watch(field, observer);
    }
	observer.update(model);
}

var fnCache = {};
function getFn(str, withoutReturn) {
    if (fnCache[str]) {
        return fnCache[str];
    }

    /* jshint -W054 */
    var fn = new Function('$model,filter', (withoutReturn ? '' : 'return ') + str);
    fnCache[str] = fn;
    return fn;
}


/**
 * 注册的模板列表
 */
var TEMPLATES = {
    /**
     * 以模板id为键, 模板为值
     * some_tpl_id : template
     */
};

/**
 * @class
 */
function Template(id, element) {
    /**
     * @property {String} id 唯一的属性id
     */
    this.id = id;

    /**
     * @property {Element} element 模板对应的结点
     */
    this.element = element;
    TEMPLATES[id] = this;
}

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
