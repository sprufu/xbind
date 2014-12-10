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
            $dirty: false, // 是否更改过
            $valid: true // 是不验证通过
        });
        element.$xform = param;
        return model;
    }
})

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

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
