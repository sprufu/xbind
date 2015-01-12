/**
 * 自定义监听绑定
 * 表达式里的this指向结点, 而函数里的this是永远指向model的
 * 例:
 *      js:
 *      var model = vmodel({
 *           name: 'jcode',
 *           say: function(el) {
 *               console.log(
 *                  'My name is %s, this tagName is %s',
 *                   this.name, // 在函里的this永远指向model
 *                   el.tagName // 表达式里的this指向结点
 *               );
 *           }
 *      });
 *
 *      html:
 *      <div x-watch-user="say(this)"></div>
 *                         表达式里this指向当前结点
 *
 * 提示:
 *      在监听表达式里, 最好不要改变字段值,
 *      以防不小心陷入不断改变和监听的死循环.
 */
/* jshint -W097 */
"use strict";
exports.scanners['x-watch'] = function(model, element, value, attr, param) {
    // 监听字段, 把"-"连起的字符串转化为驼峰式命名
    // 如: x-watch-user-name 监听字段 "userName"
    // 可以带命名空间, 如: x-watch-user.name="express"是正常的
    // 如果没有给出监听字段, 表示"*", 也就是监听所有字段改变
    var field = param ? camelize(param) : '*',
    /* jshint -W054 */
    fn = new Function('$model', parseExecute(value)),
    observer = {
        update: function(model) {
            fn.call(element, model);
        }
    };
    compileElement(element, attr.name, 'x-watch');
    model.$watch(field, observer);
};

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
