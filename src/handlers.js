/**
 * 属性扫描定义的回调
 */

// 忽略的标签
var optIgonreTag = {
    script: true,
    noscript: true,
    iframe: true
};

// 扫描优先级, 没有定义的都在1000
options.priorities = {
    'x-skip': 0,
    'x-controller': 10,
    'x-each': 20,
    'x-with': 30,
    'x-if': 50,
    'href': 3000
};

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

function booleanHandler (model, element, value, attr, type) {
    // 如果是类似: disabled="disabled"或disabled="true", 不处理
    if (value == type || value == "true") {
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

function stringXBindHandler(model, element, value, attr, type) {
    var attrName = type.substr(2);
    element.removeAttribute(attr.name);
    bindModel(model, value, parseString, function(res) {
        element.setAttribute(attrName, res);
    });
}

function eventBindHandler(model, element, value, attr, type) {
    var eventType = type.substr(2),
    expr = parseExecute(value),
    fn = new Function('$model', expr);

    element.removeAttribute(attr.name);
    exports.on(element, eventType, function(event) {
        if (fn(model) === false) {
            /* ie678( */
            if (ie678) {
                event.cancelBubble = true;
                event.returnValue = false;
            } else {
                /* ie678) */
                event.stopPropagation();
                event.preventDefault();
                /* ie678( */
            }
            /* ie678) */
        }
    });
}

/**
 * 布尔插值扫描属性名
 * 如:
 *      disabled="user.sex == 'F'"
 */
options.booleanBindAttrs = [
    "disabled",
    "checked",
    "selected",
    "contenteditable",
    "draggable",
    "dropzone"
];

options.booleanBindAttrs.forEach(function(type) {
    exports.scanners[type] = booleanHandler;
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
options.stringBindAttrs = [
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
    'type',
    'border',
    'size',
    'face',
    'color',
    'value',
    'label',
    'wrap'
];

/**
 * 事件绑定属性
 * 如:
 *      x-click="click()"
 *
 * 所有的属性都会自动加上前辍"x-"
 */
options.eventBindAttrs = [
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
];

options.stringBindAttrs.forEach(function(type) {
    exports.scanners[type] = stringBindHandler;
});

'x-src x-href'.split(' ').forEach(function(type) {
    exports.scanners[type] = stringXBindHandler;
});

options.eventBindAttrs.forEach(function(type) {
    exports.scanners['x-' + type] = eventBindHandler;
});

exports.extend(exports.scanners, {
    'x-skip': function(model, element, value, attr) {
        element.removeAttribute(attr.name);
        element.$noScanChild = true;
    },
    'x-controller': function(model, element, value, attr) {
        model = MODELS[value];
        element.removeAttribute(attr.name);
        if (model && !model.element) {
            model.$bindElement(element);
        } else {
            return;
        }
        return model;
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

    'x-repeat': function(model, element, value, attr, type, param) {
        var parent = element.parentNode,
        startElement = document.createComment('x-repeat-start:' + param),
        endElement = document.createComment('x-repeat-end:' + param);

        // 插入定界注释结点
        parent.insertBefore(startElement, element);
        parent.insertBefore(endElement, element.nextSibling);

        // 设定下一个扫描结点
        element.$nextSibling = element.nextSibling;
        element.$noScanChild = true;
        element.removeAttribute(attr.name);
        element.parentNode.removeChild(element);

        bindModel(model, value, parseExpress, function(res) {
            if (!exports.isArray(res)) {
                return;
            }

            var el = startElement.nextSibling, model;

            // 循环删除已经有的结点
            while (el && el != endElement) {
                model = exports.getModel(el);
                exports.destroyModel(model, true);
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
                        exports.destroyModel(model, true);
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
        parentModel = exports.getParentModel(element),
        replaceElement = document.createComment('x-if:' + model.$id);

        element.$nextSibling = element.nextSibling;
        element.removeAttribute(attr.name);

        model = exports.getModel(element) || new Model();
        if (!element.$modelId) {
            model.$bindElement(element);
        }

        bindModel(parentModel, value, parseExpress, function(res) {
            if (res) {
                element.parentElement || parent.replaceChild(element, replaceElement);
                model.$freeze = false;
                for (var field in model.$subscribes) {
                    model.$notifySubscribes(field);
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
        bindModel(model, value, parseExpress, function(res) {
            element.style.display = res ? "" : "none";
        });
    },

    'x-bind': function(model, element, value, attr) {
        element.removeAttribute(attr.name);
        bindModel(model, value, parseExpress, function(res) {
            var flag = true;
            if (element.tagName == 'INPUT') {
                if (element.type == 'radio') {
                    flag = false;
                    if (res == element.value) {
                        element.checked = true;
                    } else {
                        element.checked = false;
                    }
                } else if (element.type == 'checkbox') {
                    flag = false;
                    if (~res.indexOf(element.value)) {
                        element.checked = true;
                    } else {
                        element.checked = false;
                    }
                }
            }

            if (flag) {
                element.value = res;
            }

            if (element.name && element.form && element.form.$xform) {
                validItem(element);
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
                        if (v && !exports.isArray(v)) {
                            throw new TypeError('Checkbox bind must be array.');
                        }

                        if (!v) {
                            model.$set(value, []);
                        }

                        exports.on(element, 'click', function(e) {
                            var $value = model.$get(value),
                            item = element.value;

                            if (el.checked) {
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
    'x-class': function(model, element, value, attr, type, param) {
        element.removeAttribute(attr.name);
        bindModel(model, value, parseExpress, function(res) {
            if (res) {
                exports.addClass(element, param);
            } else {
                exports.removeClass(element, param);
            }
        });
    },
    'x-ajax': function(model, element, value, attr, type, param) {
        element.removeAttribute(attr.name);

        if (!element.$modelId) {
            model = new Model();
            model.$bindElement(element);
        }

        var read = function() {
            ajax({
                type: 'GET',
                dataType: 'json',
                cache: false,
                url: value,
                success: function(res) {
                    for (var key in res) {
                        model.$set(param + '.' + key, res[key]);
                    }
                },
                error: function(xhr, err) {
                    model.$set(param + '.$error', err);
                }
            });
        }
        read();

        model[param] = {
            $read: read
        };

        return model;
    },
    'x-grid': function(model, element, value, attr, type, param) {
        element.removeAttribute(attr.name);

        if (!element.$modelId) {
            model = new Model();
            model.$bindElement(element);
        }

        opt = {
            name: param,
            url: value,
            page: element.getAttribute('page'),
            pageSize: element.getAttribute('page-size')
        };

        model[param] = new DataGrid(opt);
        model[param].$$model = model;

        return model;
    },

    'x-style': function(model, element, value, attr, type, param) {
        var cssName = camelize(param);
        element.removeAttribute(attr.name);
        bindModel(model, value, parseExpress, function(res) {
            element.style[cssName] = res;
        });
    },

    /**
     * 表单操作
     * <form x-form-frmname="action" action="actionUrl" method="post">
     *      <input name="name" x-bind="name" />
     * </form>
     */
    'x-form': function(model, element, value, attr, type, param) {
        element.removeAttribute(attr.name);
        extend(model, {
            $dirty: false, // 是否更改过
            $valid: true // 是不验证通过
        });
        element.$xform = param;
        return model;
    }
});

var VALIDATTRIBUTES = {
    /**
     * 最小长度验证
     */
    min: function(num, value) {
        return value.length >= +num;
    },

    /**
     * 最大长度验证
     */
    max: function(num, value) {
        return value.length <= +num;
    },

    /**
     * 正则验证
     */
    pattern: function(regexp, value) {
        return new RegExp(regexp).test(value);
    },

    /**
     * 类型验证, 如type="url", type="email", type="number"
     */
    type: function(type, value) {
        var reg = REGEXPS[type.toLowerCase()];
        if (reg) {
            return ret.test(value);
        }
        return true;
    },

    /**
     * 必填验证
     */
    required: function(_, value) {
        return !!value;
    }
}

/**
 * 验证输入表单数据
 * @param {Element} input 输入结点, 如input, textarea, select
 */
function validItem(input) {
    var name, fn, attr, field,
    valid = true, error,
    frm = input.form,   // 表单
    fname = frm.$xform, // 表单绑定名
    fmodel = exports.getExtModel(frm); // 表单数据
    for (name in VALIDATTRIBUTES) {
        attr = input.attributes[name];

        // 没有的属性, 不做处理
        // if (!attr || !attr.specified) {
        if (!attr /* ie678( */ || !attr.specified /* ie678) */) {
            continue;
        }

        // 计算验证结果
        fn = VALIDATTRIBUTES[name];
        if (fn.call(input, attr.value, input.value)) {
            error = false;
        } else {
            error = true;
            valid = false;
        }

        // 更新验证出错信息
        // 验证出错信息是区分开的
        field = fname + '.' + input.name + '.$error.' + name;
        if (fmodel.$get(field) != error) {
            fmodel.$set(field, error);
        }
    }

    // 更新验证结果
    field = fname + '.' + input.name + '.valid';
    if (fmodel.$get(field) != valid) {
        fmodel.$set(field, valid);
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

function DataGrid(opt) {
    if (opt.page) {
        if (REGEXPS.number.test(opt.page)) {
            this.$$page = +opt.page;
        } else {
            this.$$page = +parseUrlParam(opt.page) || 1;
        }
    } else {
        this.$$page = 1;
    }

    if (opt.pageSize) {
        if (REGEXPS.number.test(opt.pageSize)) {
            this.$$pageSize = +opt.pageSize;
        } else {
            this.$$pageSize = +parseUrlParam(opt.pageSize) || 20;
        }
    } else {
        this.$$pageSize = 20;
    }

    this.$$sort = '';
    this.$$order = '';
    this.$$params = {
        page: this.$$page,
        pageSize: this.$$pageSize
    };
    this.$$url = opt.url;
    this.$$name = opt.name;

    this.$read();
}

DataGrid.prototype = {
    /**
     * 读取数据
     */
    $read: function(search) {
        if (arguments.length) {
            this.$$params = search;
            this.$$page = 1;
        }

        var self = this,
        data = this.$$params;
        extend(data, {
            page: this.$$page,
            pageSize: this.$$pageSize
        });
        if (this.$$sort) {
            data.sort = this.$$sort;
        }

        if (this.$$order) {
            data.order = this.$$order;
        }

        ajax({
            type: 'GET',
            dataType: 'json',
            cache: false,
            url: this.$$url,
            data: data,
            success: function(res) {
                for (var key in res) {
                    self.$$model.$set(self.$$name + '.' + key, res[key]);
                }
            },
            error: function(xhr, err) {
                self.$$model.$set(self.$$name + '.$error', err);
            }
        });
    },

    /**
     * 获取当前页码或跳到指定页码
     */
    $page: function(page) {
        if (page) {
            this.$$page = page;
            this.$read();
        } else {
            return this.$$page;
        }
    },

    /**
     * 设置或更改每页显示记录数
     * 更改时重新加载页面并跳到第一页
     */
    $pageSize: function(pageSize) {
        if (pageSize) {
            this.$$pageSize = pageSize;
            this.$$page = 1;
            this.$read();
        } else {
            return this.$$pageSize;
        }
    },

    /**
     * 重新排序
     */
    $sort: function(field, order) {
        this.$$sort = field;
        this.$$order = order || '';
        this.$read();
    }
};

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
