/**
 * @file 表单处理
 * @author jcode
 */
/* jshint -W097 */
"use strict";

mix(exports.scanners, {
    /**
     * 表单操作
     * @memberOf scanners
     */
    'x-form': function(model, element, value, attr, param) {
        element.removeAttribute(attr.name);
        mix(model, {
            $xform: param,
            $dirty: false, // 是否更改过
            $valid: true // 是不验证通过
        });
        return model;
    },

    /**
     * 最小值限制验证
     * @memberOf scanners
     */
    min: function(model, element, value) {
        var minValue = +value;
        bindValidModel(element, function() {
            updateFormItem(element, 'min', +element.value >= minValue);
        });
    },

    /**
     * 最大值限制验证
     * @memberOf scanners
     */
    max: function(model, element, value) {
        var maxValue = +value;
        bindValidModel(element, function() {
            updateFormItem(element, 'max', +element.value <= maxValue);
        });
    },

    /**
     * 最小长度验证
     * @memberOf scanners
     */
    minlength: function(model, element, value) {
        var minValue = +value;
        bindValidModel(element, function() {
            updateFormItem(element, 'minlength', element.value.length >= minValue);
        });
    },

    /**
     * 最大长度验证
     * @memberOf scanners
     */
    maxlength: function(model, element, value) {
        var maxValue = +value;
        bindValidModel(element, function() {
            updateFormItem(element, 'maxlength', element.value.length <= maxValue);
        });
    },

    /**
     * 正则验证
     * @memberOf scanners
     */
    pattern: function(model, element, value) {
        var regexp = new RegExp(value);
        bindValidModel(element, function() {
            updateFormItem(element, 'pattern', element.value.test(regexp));
        });
    },

    /**
     * 必填验证
     * @memberOf scanners
     */
    required: function(model, element) {
        bindValidModel(element, function() {
            updateFormItem(element, 'required', !!element.value);
        });
    },

    /**
     * 类型判断
     * @memberOf scanners
     */
    type: function(model, element, value) {
        value = value.toLowerCase();

        if (!REGEXPS[value]) {
            return;
        }

        bindValidModel(element, function() {
            updateFormItem(element, 'type', element.value.test(REGEXPS[value]));
        });
    }
});

function bindValidModel(element, fn) {
    if (!element.form) {
        return;
    }
    exports.on(element, 'keyup', fn);
    exports.on(element, 'change', fn);
}

/**
 * 更新表单验证信息
 * @param {Element} element 表单项, 如: <input name="name" />
 * @param {String} type 验证类型
 * @param {boolean} res 验证结果
 */
function updateFormItem(element, type, res) {
    var frm = element.form,
    model = getExtModel(frm),
    prefix;

    if (!model) {
        return;
    }

    prefix = model.$xform + '.' + element.name;
    model.$set(prefix + '.$valid', res);
    model.$set(prefix + '.$error.' + type, !res);
}

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
