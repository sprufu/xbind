vmodel是一款轻量级的MVVM框架, 旨在于轻量, 易用, 易于扩展.

> 在使用angularjs及avalonjs的过程中, 发现angularjs的过滤规范化, 很难入手, 其条条款款太多, 同时, 其强大的功能背后使其失去了轻量概念, 而avalonjs过度追求完美, 导致最后一点都不完美, 使用vbscript使其预先定义属性才能使用, 与javascript的理念不同, 难让javascript用户信服.

## 一些其它的mvvm框架

1. google的 [argularjs](https://angularjs.org/)
1. 微软的 [knockoutjs](http://knockoutjs.com/)
3. 苹果的 [emberjs](http://emberjs.com/)
4. 还有一个国产的 [avalonjs](http://rubylouvre.github.io/mvvm/)
5. ractive [ractive](http://ractivejs.org)
6. rivetsjs [rivetsjs](http://rivetsjs.com/)
7. vuejs [vuejs](http://vuejs.org/)
8. way.js [way.js](http://gwendall.github.io/way/)

## TODO

1. 列表处理当前记录, 当前的内容与列表某条记录一至处理.
2. x-ajax-error="express" ajax绑定请求错误时处理.

## Issue

## Change

#### v0.4.0 2014-12-24
1. add: 添加ajax条件加载机制, 避免数据没有准备好时加载数据, 也能让用户手工按需要加载数据.
2. add: 添加属性操作统一方式x-attr
3. add: 添加default默认值过滤器.
4. remove: 删除字符串属性绑定, 布尔属性绑定, 其功能统一由x-attr处理
5. fix: 修复repeat绑定与其它绑定共同使用时预先扫描问题.
6. change: 分离出filter, form, grid模块, 可自由使用或移出.
7. change: 重命名watch, unwatch, fire方法.

