/**
 * @file 表达式字符串解析
 * @author jcode
 */
/* jshint -W097 */
"use strict";

var
filterRegExp    = /(\w+)(.*)/,
URLPARAMS       = null,
exprActionReg   = /[-\+\*\/\=\(\)\%\&\|\^\!\~\,\?\s\>\<\:]+/g,    // 表达式操作符
whithReg        = /^[\s\uFEFF\xA0]$/,
cacheParse      = false,
cacheParses     = {
    string : {},
    express: {}
},
parseJSON       = window.JSON ? window.JSON.parse : function(str) {
    /* jshint -W054 */
    return (new Function('', 'return ' + str.trim())());
};

/**
 * 解析插值字符串
 */
function parseString(str, fields) {
    var cache;
    // get from cache
    if (cacheParse && (cache = cacheParses.string[str])) {
        mix(fields, cache.fields);
        return cache.expr;
    }

    // parse string
    var txt = '""',
    tmp,
    interpolate1 = options.interpolate[0],
    interpolate2 = options.interpolate[1],
    len1 = interpolate1.length,
    len2 = interpolate2.length,
    flag = false,
    pos = 0,
    pos1 = 0,
    pos2 = 0;
    while (true) {
        pos1 = str.indexOf(interpolate1, pos1);
        if (~pos1) {
            pos2 = str.indexOf(interpolate2, pos1 + len1);
            if (~pos2) {
                flag = true;
                tmp = replaceWrapLineString(str.substring(pos, pos1));
                if (tmp) {
                    txt += '+"' + tmp + '"';
                }
                txt += '+' + parseExpress(str.substring(pos1 + len1, pos2), fields, true);
                pos = pos1 = pos2 = pos2 + len2;
            } else {
                tmp = replaceWrapLineString(str.substr(pos));
                if (tmp) {
                    txt += '+"' + tmp + '"';
                }
                break;
            }
        } else {
            tmp = replaceWrapLineString(str.substr(pos));
            if (tmp) {
                txt += '+"' + tmp + '"';
            }
            break;
        }
    }

    // cache the result.
    if (cacheParse) {
        cacheParses.string[str] = {
            fields: fields,
            expr: txt
        };
    }

    return flag ? txt : false;
}

function replaceWrapLineString(str) {
    return str.replace(/\r/g, '\\r').replace(/\n/g, '\\n');
}

/**
 * 解析表达式, 收集依赖
 *
 * 常见的表达式如下:
 * {{ name }}
 * {{ user.name }}
 * {{ test.method() + 2 }}
 * {{ test.method() + 2 | number(2) }}
 * {{ user.addDate || new Date() | date('yyyy-mm-dd') }}
 *
 * 实现步骤:
 *    1. 取得过滤表达式, 过虑器只能是常量, 不能用变量做参数
 *    2. 取得其对应的源表达式
 *    3. 取得源表达式变量并收集依赖
 *    任何步骤出错将返回空串
 *
 * @param {boolean} isDisplayResult 标识这个取值结果是否用于显示, 如果为真, null及undefined将替换为空字符串, 避免在页面上显示这些字符串.
 */
function parseExpress(str, fields, isDisplayResult) {
    var cache;
    // get from cache
    if (cacheParse && (cache = cacheParses.express[str])) {
        mix(fields, cache.fields);
        return cache.expr;
    }

    try {
        var expr, filters = [];

        str = divExpress(str, filters, fields);
        expr = parseExecuteItem(str.trim(), fields, isDisplayResult);

        if (filters.length) {
            var filter, ifn = '(function(expr){';
            for (var i=0; i<filters.length; i++) {
                filter = filters[i];
                ifn += 'expr=filter("' + filter.name + '",expr' + (filter.args.trim() ? ',' + filter.args : '') + ');';
            }
            expr = ifn + 'return expr;}(' + expr + ', $model))';
        }

        // cache the result.
        if (cacheParse) {
            cacheParses.express[str] = {
                fields: fields,
                expr: expr
            };
        }

        return expr;
    } catch (err) {
        return '';
    }
}

/**
 * 把表达式分离成表达式和过滤器两部门
 * @param {String} str 表达式, 也就是双花括号的中间部分
 * @param {Array} filters 传值的过滤器引用, 用于收集过滤器, 过滤器要分解出其参数, 所以是一个对象的数组, 如: [{
 *     name: 'date', // 过滤器名字
 *     args: 'yyyy-mm-dd', // 参数列表
 * }]
 * @returns {String} 没有带过滤器的表达式
 */
function divExpress(str, filters, fields) {
    var pos = 0, expr;
    while (true) {
        pos = str.indexOf('|', pos);
        if (~pos) {
            if (str.charAt(pos + 1) == '|') {
                pos += 2;
            } else {
                /* jshint -W083 */
                str.substr(pos + 1).split('|').forEach(function(str) {
                    var filter = parseFilter(str, fields);
                    filters.push(filter);
                });
                expr = str.substr(0, pos - 1);
                break;
            }
        } else {
            expr = str;
            filters = [];
            break;
        }
    }
    return expr;
}

/**
 * 解析过滤器, 把过滤器分解成名字和参数两部分
 * 名字与参数部分用空格分开
 * 多个参数用逗号分隔
 * @param {String} str 过滤器表达式
 * @returns {Object} 分解后的对象, 如 date 'yyyy-mm-dd' 应该返回: {
 *    name: 'date',
 *    args: 'yyyy-mm-dd'
 * }
 */
function parseFilter(str, fields) {
    var p = filterRegExp.exec(str);
    return {
        name: p[1],
        args: parseExecuteItem(p[2].trim(), fields)
    };
}

/**
 * 解析些待执行的表达式
 * 如:
 *    user.name = 'jcode'         ===>   $model.$set("user.name", "jcode")                    // 赋值表达式要转换成model的$set
 *    user.age = user.age + 1     ===>   $model.$set("user.age", $model.$get("user.age") + 1) // 赋值也可能与调用方法混用
 *    clickHandler                ===>   $model.$get("clickHandler")()                        // 方法要转换成model方法
 *    clickHandler(item)          ===>   $model.$get("clickHandler")($model.$get("item"))     // 变量要转换成model变量
 *    clickHandler(4, null, true) ===> $model.$get("clickHandler")(4, null, true)             // 常量(数字, null, undefined, boolean)不转换
 *
 * 从上面情况来看, 虽然复杂, 但就只有两种情况: 赋值和执行函数操作
 * 表达式由各个操作元素(变量或常量)和操作符(+, -, *, /, '%', 等)组合在一起
 * TODO fields是否应该收集
 */
function parseExecute(str) {
    var fields = {},
    ret = '';

    if (~str.indexOf(';')) {
        // 含有";", 如: user.name = 'jcode'; user.age = 31
        // 表示由多个表达式组成
        var strs = str.split(';'),
        i = 0;

        // 循环解析每个表达式, 把结果累加在一起
        for (; i<strs.length; i++) {
            if (i) {
                ret += ';';
            }
            ret += parseExecute(strs[i].trim());
        }
    } else {
        if (~str.indexOf('=')) {
            // 含有"=", 是赋值操作
            var part = str.split('=');
            ret = '$model.$set("' + part[0].trim() + '",' + parseExecuteItem(part[1].trim(), fields) + ')';
        } else {
            ret = parseExecuteItem(str, fields) + ';';
        }
    }
    return ret;
}


/**
 * parseExecute的辅助函数, 用来解析单个表达式, str两边已经去掉无用的空白符
 * 如:
 *    clickHandler
 *    user.age + 1
 *    user.getName()
 *
 * 这与javascript表达式有所不同, "."两边不能有空格, 如: user.  age
 */
function parseExecuteItem(str, fields, isDisplayResult) {
    var ret, actions, c = str.charAt(0),
    model = {
        isField: false
    };

    if (c == '"' || c == "'") {
        return str;
    }

    actions = str.match(exprActionReg);
    if (actions) {
        ret = '';
        var field,
        pos0 = 0,
        pos,
        i = 0;

        // 循环解析操作符分隔的每个表达式
        // 并把他们加在一起
        for (; i<actions.length; i++) {
            if (whithReg.test(actions[i])) {
                // 是纯空白的不处理
                continue;
            }

            model.isField = false;

            pos = str.indexOf(actions[i], pos0);
            field = str.substring(pos0, pos);
            ret += parseStatic(field, isDisplayResult, model) + actions[i];
            pos0 = pos + actions[i].length;

            // 不是方法, 而是属性的话, 要加到监听列表里
            // 不是关键字及数字.
            if (model.isField && actions[i].indexOf('(') == -1) {
                fields[field] = true;
            }
        }

        // 处理最后结尾部分
        if (str.length > pos0) {
            field = str.substr(pos0);
            model.isField = false;
            var res = parseStatic(field, isDisplayResult, model);
            if (res != field) {
                fields[field] = true;
            }
            ret += res;
        }

        return ret;
    } else {
        ret = parseStatic(str, isDisplayResult, model);
        if (model.isField) {
            fields[str] = true;
        }
        return ret;
    }
}

/**
 * 编译用到的关键字
 * 这些关键不编译, 其它转换成model变量
 */
options.keywords = {};
'$model return if else true false null undefined this'.split(' ').forEach(function(item) {
    options.keywords[item] = true;
});

function parseStatic(str, isDisplayResult, model) {
    if (!str) {
        return '';
    }

    // 普通常量, 常量有很多, 这里只处理几个常用的
    if (options.keywords[str]) {
        return str;
    }

    // 数字
    if (REGEXPS.number.test(str)) {
        return str;
    }

    var c=str.charAt(0);
    if (c == '"' || c == "'") {
        return str;
    }

    model.isField = true;

    return '$model.$get("' + str + '"' + (isDisplayResult ? ',0,1':'') +')';
}

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
