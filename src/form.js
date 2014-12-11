/**
 * @file 表单处理
 * @author jcode
 */

extend(exports.scanners, {
    /**
     * 表单操作
     * <form x-form-frmname="action" action="actionUrl" method="post">
     *      <input name="name" x-bind="name" />
     * </form>
     */
    'x-form': function(model, element, value, attr, type, param) {
        element.removeAttribute(attr.name);
        extend(model, {
            $xform: param,
            $dirty: false, // 是否更改过
            $valid: true // 是不验证通过
        });
        return model;
    },

    /**
     * 最小值限制验证
     */
    min: function(model, element, value) {
        if (!element.form) {
            return;
        }

        var minValue = +value;
        function onevent() {
            updateFormItem(element, 'max', +element.value >= minValue)
        }

        exports.on(element, 'keyup', onevent);
        exports.on(element, 'change', onevent);
    },

    /**
     * 最大值限制验证
     */
    max: function(model, element, value) {
        if (!element.form) {
            return;
        }

        var maxValue = +value;
        function onevent() {
            updateFormItem(element, 'max', +element.value <= maxValue)
        }

        exports.on(element, 'keyup', onevent);
        exports.on(element, 'change', onevent);
    },

    /**
     * 最小长度验证
     */
    minlength: function(model, element, value) {
        if (!element.form) {
            return;
        }

        var minValue = +value;
        function onevent() {
            updateFormItem(element, 'minlength', element.value.length >= minValue)
        }

        exports.on(element, 'keyup', onevent);
        exports.on(element, 'change', onevent);
    },

    /**
     * 最大长度验证
     */
    maxlength: function(model, element, value) {
        if (!element.form) {
            return;
        }

        var maxValue = +value;
        function onevent() {
            updateFormItem(element, 'maxlength', element.value.length <= maxValue)
        }

        exports.on(element, 'keyup', onevent);
        exports.on(element, 'change', onevent);
    },

    /**
     * 正则验证
     */
    pattern: function(model, element, value) {
        if (!element.form) {
            return;
        }

        var regexp = new RegExp(value),
        fn = function() {
            updateFormItem(element, 'pattern', element.value.test(regexp));
        };

        exports.on(element, 'keyup', onevent);
        exports.on(element, 'change', onevent);
    },

    /**
     * 必填验证
     */
    required: function(model, element, value) {
        if (!element.form) {
            return;
        }

        var fn = function() {
            updateFormItem(element, 'required', !!value);
        };

        exports.on(element, 'keyup', onevent);
        exports.on(element, 'change', onevent);
    },

    /**
     * 类型判断
     */
    type: function(model, element, value) {
        value = value.toLowerCase();

        if (!element.form || !REGEXPS[value]) {
            return;
        }

        var fn = function() {
            updateFormItem(element, 'type', element.value.test(REGEXPS[value]));
        }

        exports.on(element, 'keyup', onevent);
        exports.on(element, 'change', onevent);
    }
});

/**
 * 更新表单验证信息
 * @param {Element} element 表单项, 如: <input name="name" />
 * @param {String} type 验证类型
 * @param {boolean} res 验证结果
 */
function updateFormItem(element, type, res) {
    var frm = element.form,
    model = exports.getExtModel(frm),
    name, prefix;

    if (!model) {
        return;
    }

    name = element.name;
    prefix = model.$xform + '.' + element.name;
    model.$set(prefix + '.$valid', res);
    model.$set(prefix + '.$error.' + type, !res);
}

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
