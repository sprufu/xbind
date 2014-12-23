/**
 * 属性扫描定义的回调
 */
"use strict";

exports.scanners = {
    /**
     * 以属性名为键, 回调为值
    * attrname: function(data[, priority]) {
    *    data.type // 属性名, 如 href, x-href
    *    data.element // 定义的dom结点对象
    *    data.param // 参数, 跟avalon学的, 如果为 x-repeat-item的话, 这返回 item
    *    data.value // 属性值, 如 x-repeat="testvalue" 的话, 这返回 testvalue字符串
    *    data.model // 结点绑定的model, 没有绑定的话返回null
    *    priority // 优先级顺序, 省略时默认1000
    * }
    */
};

function booleanHandler (model, element, value, attr) {
    // 如果是类似: disabled="disabled"或disabled="", 不处理
    var type = attr.name
    if (value == type || value === "") {
        return;
    }

    bindModel(model, value, parseExpress, function(res) {
        if (res) {
            element.setAttribute(type, type);
        } else {
            element.removeAttribute(type);
        }
    });
}

function stringBindHandler (model, element, value, attr) {
    bindModel(model, value, parseString, function(res) {
        attr.value = res;
    });
}

function stringXBindHandler(model, element, value, attr) {
    var attrName = attr.name.substr(2);
    element.removeAttribute(attr.name);
    bindModel(model, value, parseString, function(res) {
        element.setAttribute(attrName, res);
    });
}

function eventBindHandler(model, element, value, attr) {
    var eventType = attr.name.substr(2),
    expr = parseExecute(value),
    fn = new Function('$model', expr);

    element.removeAttribute(attr.name);
    exports.on(element, eventType, function(event) {
        return fn(model);
    });
}

/**
 * 布尔插值扫描属性名
 * 如:
 *      disabled="user.sex == 'F'"
 */
[
    "disabled",
    "checked",
    "selected",
    "readonly",
    "contenteditable",
    "draggable",
    "dropzone"
].forEach(function(type) {
    exports.scanners[type] = booleanHandler;
});


/**
 * 事件绑定属性
 * 如:
 *      x-click="click()"
 *
 * 所有的属性都会自动加上前辍"x-"
 */
[
    'blur',
    'focus',
    'focusin',
    'focusout',
    'load',
    'resize',
    'scroll',
    'unload',
    'click',
    'dblclick',
    'mousedown',
    'mouseup',
    'mousemove',
    'mouseover',
    'mouseout',
    'mouseenter',
    'mouseleave',
    'change',
    'select',
    'submit',
    'keydown',
    'keypress',
    'keyup',
    'error',
    'contextmenu'
].forEach(function(type) {
    exports.scanners['x-' + type] = eventBindHandler;
});

['x-src', 'x-href'].forEach(function(type) {
    exports.scanners[type] = stringXBindHandler;
});

/**
 * 字符串插值扫描的属性名
 * 如:
 *      title="删除{{ rs.title }}记录."
 *
 * 提示: 不要把style和class属性用于字符串插值, 这两个属性经常被javascript改变
 * 插值会直接设置多个属性会导致某些不想要的设置
 * 应该使用相应的x-style及x-class
 *
 * src属性在没有扫描时就会加载, 从而加载一个不存在地地址, 应该使用x-src
 * href比src好一些, 但没扫描时点击也会跳到一个不存在的连接, 这是不想要的结果, 请使用x-href
 *
 * 对于value能用x-bind的就不要用value字符串插值, 保留这个是为了其它标签, 如option
 */
[
    // 'src',
    // 'href',
    'target',
    'title',
    'width',
    'height',
    'name',
    'alt',
    'align',
    'valign',
    'clos',
    'rows',
    'clospan',
    'rowspan',
    'cellpadding',
    'cellspacing',
    'method',
    'color',
    'border',
    'size',
    'face',
    'color',
    'value',
    'label',
    'wrap'
].forEach(function(type) {
    exports.scanners[type] = stringBindHandler;
});

exports.extend(exports.scanners, {
    'x-skip': function(model, element, value, attr) {
        element.removeAttribute(attr.name);
        element.$noScanChild = true;
    },

    /**
     * 当a[href=""]时, 阻止默认点击行为和事件冒泡
     */
    'href': function(model, element, value) {
        if (element.tagName == 'A' && value === '') {
            exports.on(element, 'click', function() {
                return false;
            });
        }
    },

    'x-controller': function(model, element, value, attr, param) {
        model = MODELS[value];
        element.removeAttribute(attr.name);
        exports.removeClass(element, 'x-controller');
        if (model && !model.element) {
            model.$bindElement(element, param != 'top');
        } else {
            return;
        }
        return model;
    },

    /**
     * 初始化数据
     */
    'x-init': function(model, element, value, attr) {
        if (!model) {
            return;
        }

        element.removeAttribute(attr.name);
        var expr = parseExecute(value),
        fn = new Function('$model', expr);
        fn(model);
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
        element.$nextSibling = element.nextSibling;
        element.$noScanChild = true;
        element.removeAttribute(attr.name);
        exports.removeClass(element, 'x-template');

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
        element.$noScanChild = true;
        element.removeAttribute(attr.name);
        exports.removeClass(element, 'x-include');
        bindModel(model, value, parseExpress, function(res) {

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
        element.$nextSibling = element.nextSibling;
        element.$noScanChild = true;
        element.$skipOtherAttr = true;
        element.removeAttribute(attr.name);
        exports.removeClass(element, 'x-repeat');
        element.parentNode.removeChild(element);

        bindModel(model, value, parseExpress, function(res) {
            if (!exports.type(res, 'array')) {
                return;
            }

            var el = startElement.nextSibling, model;

            // 循环删除已经有的结点
            while (el && el != endElement) {
                model = getModel(el);
                destroyModel(model, true);
                el = startElement.nextSibling;
            }

            // 循环添加
            res.forEach(function(item, i) {
                var el = element.cloneNode(true);
                /* ie678( */
                if (ie678) {
                    el.$noScanChild = false;
                }
                /* ie678) */

                var model = new Model({
                    $index: i,
                    $remove: function() {
                        destroyModel(model, true);
                    },
                    $first: !i,
                    $last: i == res.length,
                    $middle: i > 0 && i < res.length
                });
                model[param] = item;

                parent.insertBefore(el, endElement);
                model.$bindElement(el);
                scan(el, model);
            });
        });
    },

    'x-if': function(model, element, value, attr) {
        var parent = element.parentElement,
        parentModel = getParentModel(element),
        replaceElement = document.createComment('x-if:' + model.$id);

        element.$nextSibling = element.nextSibling;
        element.removeAttribute(attr.name);
        exports.removeClass(element, 'x-if');

        model = getModel(element) || new Model();
        if (!element.$modelId) {
            model.$bindElement(element);
        }

        bindModel(parentModel, value, parseExpress, function(res) {
            if (res) {
                element.parentElement || parent.replaceChild(element, replaceElement);
                model.$freeze = false;
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
        element.removeAttribute(attr.name);
        exports.removeClass(element, 'x-show');
        bindModel(model, value, parseExpress, function(res) {
            element.style.display = res ? "" : "none";
        });
    },

    'x-bind': function(model, element, value, attr) {
        element.removeAttribute(attr.name);
        bindModel(model, value, parseExpress, function(res) {
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


        function addListen(type) {
            exports.on(element, type, function(e) {
                model.$set(value, element.value);
            });
        }
        switch(element.tagName) {
            case 'INPUT':
                switch(element.type) {
                    case 'checkbox':
                        var v = model.$get(value);
                        if (v && !exports.type(v, 'array')) {
                            throw new TypeError('Checkbox bind must be array.');
                        }

                        if (!v) {
                            model.$set(value, []);
                        }

                        exports.on(element, 'click', function(e) {
                            var $value = model.$get(value),
                            item = element.value;

                            if (element.checked) {
                                $value.push(item);
                            } else {
                                // 删除掉元素
                                $value.remove(item);
                            }

                            model.$set(value, $value);
                        });
                    break;
                    case 'radio':
                        addListen('click');
                    break;
                    default:
                        addListen('keyup');
                        addListen('change');
                    break;
                }
            break;
            case 'SELECT':
                addListen('change');
            break;
            case 'TEXTAREA':
                addListen('keyup');
                addListen('change');
            break;
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
        element.removeAttribute(attr.name);
        exports.removeClass(element, 'x-class');
        bindModel(model, value, parseExpress, function(res) {
            if (res) {
                exports.addClass(element, param);
            } else {
                exports.removeClass(element, param);
            }
        });
    },
    'x-ajax': function(model, element, value, attr, param) {
        element.removeAttribute(attr.name);
        exports.removeClass(element, 'x-ajax');

        if (!element.$modelId) {
            model = new Model();
            model.$bindElement(element);
        }

        var

        // 请求的地址, 这个参数可能在变, 因为可能会与数据绑定
        url,

        // 请求条件
        // 根据 x-ajax-if 结果求得
        // 用于条件加载
        $if = true,
        ifBindExpr = element.getAttribute('x-ajax-if'),

        // 请求的方法
        read = function() {
            ajax({
                type: 'GET',
                dataType: 'json',
                cache: false,
                url: url,
                success: function(res) {
                    model.$set(res, param);
                },
                error: function(xhr, err) {
                    model.$set(param + '.$error', err);
                }
            });
        };

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
        element.removeAttribute(attr.name);
        exports.removeClass(element, 'x-style');
        bindModel(model, value, parseExpress, function(res) {
            element.style[cssName] = res;
        });
    }
});

function bindModel(model, str, parsefn, updatefn) {
    var fields = {},
    expr = parsefn(str, fields);
    if (exports.isEmptyObject(fields)) {
        return false;
    }

    var fn = new Function('$model,filter', 'return ' + expr),
    observer = {
        update: function(model) {
            updatefn(fn(model, exports.filter));
        }
    };

    for (var field in fields) {
        if (model) {
            model.$watch(field, observer);
            observer.update(model);
        }
    }
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

function Template(id, element) {
    this.id = id;
    this.element = element;
    TEMPLATES[id] = this;
}

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
