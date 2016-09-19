xbind是一款轻量级的MVVM框架, 旨在于轻量, 易用, 易于扩展.

> 在使用angularjs及avalonjs的过程中, 发现angularjs的过滤规范化, 很难入手, 其条条款款太多, 同时, 其强大的功能背后使其失去了轻量概念, 而avalonjs过度追求完美, 导致最后一点都不完美, 使用vbscript使其预先定义属性才能使用, 与javascript的理念不同, 难让javascript用户信服.

## 自定义压缩javascript

用git拷贝项目源文件到本地:
```bash
git clone https://github.com/sprufu/xbind.git
```

进入xbind目录并压缩javascript
```bash
cd xbind && npm install && npm run build
```

## 一些其它的mvvm框架

1. google的 [argularjs](https://angularjs.org/)
1. facebook的 [reactjs](https://facebook.github.io/react/)
1. 微软的 [knockoutjs](http://knockoutjs.com/)
3. 苹果的 [emberjs](http://emberjs.com/)
4. 还有一个国产的 [avalonjs](http://rubylouvre.github.io/mvvm/)
5. riot2 [riot2](https://github.com/riot/riot)
5. ractive [ractive](http://ractivejs.org)
6. rivetsjs [rivetsjs](http://rivetsjs.com/)
7. vuejs [vuejs](http://vuejs.org/)
8. way.js [way.js](http://gwendall.github.io/way/)

## Change

#### v0.4.3 2015-01-18
1. chg: 改名为xbind.
1. add: 使用grunt-jsdoc生成doc文档
2. add: 采用jshint规范化代码.
3. add: 添加数据加载完时自动扫描一次结点配置项, 而不强制扫描.
4. add: 添加convert转换过滤器.
5. add: 添加排序过滤器sort.
6. add: 添加foreign过滤器.
7. fix: 实现过滤器参数可以用数据变量.
8. add: 添加解析字符串结果缓存, 提高扫描性能.
9. fix: 分离出parseUrlParam不常用函数
10. fix: 实现ajax的jsonp请求.
11. rmv: 删除Array.prototype.remove扩展, 用内部函数代替其功能.
12. rmv: 删除grid.js组件.


#### v0.4.2 2015-01-06
1. chg: 改extend名为mix, 改extend用于构造函数继承.
2. chg: 更改一些内容函数名称
3. fix: 当传入一个字符串参数时, 以其为id创建一个空数据对象.
4. fix: ie678中domready后删除不要的绑定函数.
5. add: 添加根据字段名获取数据方法.
6. chg: 重构$get方法.
7. fix: 优化parseString解析空字符串连接问题.
8. add: 添加生成监听函数缓存.
9. fix: 修复ajax的html响应得到文本结点的问题.
9. fix: 实现ajax的script, xml响应.
10. fix: 修改ajax只有urlencoded方式的处理数据转换.
11. fix: 修复ajax缓存控制无效问题.
12. fix: 修复手动实现Function.prototype.bind没有正常接受参数的问题.
13. fix: 去掉ajax绑定没必要生成闭合作用域.
14. fix: 修复ajax正常响应时没有清除错误信息的bug.
15. chg: 事件绑定采用统一的x-on处理.
16. fix: 修复config配置无深层拷贝问题.
17. fix: 修改each循环时不过滤函数.
18. add: ajax添加statusCode及headerCode项, 遇到相关响应状态或响应头时执行指定代码


#### v0.4.1 2015-01-01
1. fix: 修复$get多级子方法时, 其绑定调用者始终指向model自身.
2. add: 添加param过滤器.
3. chg: 优化ie678的ready事件.
4. fix: 修复x-repeat, x-include内存泄漏问题.
5. fix: 修复处理表达式中文处理出错问题.
6. add: 添加循环函数each方法.
7. add: 添加x-repeat循环对象支持.

#### v0.4.0 2014-12-24
1. add: 添加ajax条件加载机制, 避免数据没有准备好时加载数据, 也能让用户手工按需要加载数据.
2. add: 添加属性操作统一方式x-attr
3. add: 添加default默认值过滤器.
4. remove: 删除字符串属性绑定, 布尔属性绑定, 其功能统一由x-attr处理
5. fix: 修复repeat绑定与其它绑定共同使用时预先扫描问题.
6. change: 分离出filter, form, grid模块, 可自由使用或移出.
7. change: 重命名watch, unwatch, fire方法.

