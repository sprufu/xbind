/* jshint -W097 */
"use strict";

/**
 * 扫描结点, 添加绑定
 * @param {Element} element 从哪个结点开始扫描(扫描它及它的子结点), 如果省略, 从页面顶级开始扫描.
 * @param {Model} model 这结点拥有的数据对象, 可以从上级取得
 */
function scan(element, model) {
    element = element || document.documentElement;

    if (!model) {
        model = new Model();
        model.$scope(element);
    }

    switch(element.nodeType) {
    // 普通结点
    case 1:
        if (!options.ignoreTags[element.tagName]) {
            model = scanAttrs(element, model) || model;
            if (!element.$noScanChild && element.childNodes.length) {
                scanChildNodes(element, model);
            }
        }
    break;
    // 文本结点
    case 3:
        scanText(element, model);
    break;
    }

    return model;
}

exports.scan = scan;

function scanChildNodes(element, parentModel) {
    var el = element.firstChild;
    while (el) {
        scan(el, parentModel);
        el = el.$nextSibling || el.nextSibling;
    }
}

/**
 * 扫描某个结点的属性
 * 一个结点只能生成一次model
 * TODO 某个属性扫描后, 移出其同名的className
 * @param {Element} element 结点对象
 * @param {Model} model model
 * @returns {Model} 如果生成model, 则返回model, 否则返回父级model
 */
function scanAttrs(element, model) {
    var attrs = element.attributes,
    list = getScanAttrList(attrs),
    i = list.length,
    item, fn, attr;

    while (i--) {
        item = list[i];
        attr = attrs[item.index];
        fn = exports.scanners[item.type];
        if (fn && attr) {
            model = fn(model, element, attr.value, attr, item.param) || model;
        }

        // 跳过扫描其它属性机制
        if (element.$skipOtherAttr) {
            // ie67不能delete
            //delete element.$skipOtherAttr;
            /* ie678( */
            if (ie67) {
                element.$skipOtherAttr = null;
            } else {
                /* ie678) */
                delete element.$skipOtherAttr;
                /* ie678( */
            }
            /* ie678) */
            break;
        }
    }

    return model;
}

function scanText(element, parentModel) {
    bindModel(parentModel, element.data, parseString, function(res) {
        element.data = res;
    });
}

/*
 * 低版本安卓(android2)及IE的比较函数必须返回-1, 0或1
 * 而chrome, firefox则需要返回true或false
 */
var orderFn, testOrderArray = [{k:2},{k:3}];
testOrderArray.sort(function(a,b) {
    return a.k < b.k;
});
orderFn = testOrderArray[0].k == 2 ? function(a,b) {
    return a.priority > b.priority ? -1 : a.priority < a.priority ? 1 : 0;
} : function(a, b) {
    return a.priority < b.priority;
};

/**
 * 获取所要扫描的属性列表
 * 这个是一个有序的列表
 * @param {NamedNodeMap} attrs 属性列表, 只读
 * @returns {Array} [{
 *    index: 属性索引,
 *    priority: 优先级, 小的排在前
 * }]
 */
function getScanAttrList(attrs) {
    var res = [],
    i = attrs.length, attr, param, endPos, type;
    while (i--) {
        attr = attrs[i];

        /* ie678( */
        // 过滤ie67的element.attributes得到一大堆属性
        if (!attr.specified) {
            continue;
        }
        /* ie678) */

        // 在过滤属性列表中的属性, 忽略不处理
        if (options.ignoreAttrs[attr.name]) {
            continue;
        }

        param = undefined;

        if (attr.name.startsWith('x-')) {
            endPos = attr.name.indexOf('-', 2);
            if (~endPos) {
                type = attr.name.substr(0, endPos);
                param = attr.name.substr(endPos+1);
            } else {
                type = attr.name;
            }
        } else if (!exports.scanners[attr.name]) {
            continue;
        } else {
            type = attr.name;
        }

        res.push({
            index: attr.name,
            type: type,
            param: param,
            priority: options.priorities[type] || 1000
        });
    }

    return res.sort(orderFn);
}

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
