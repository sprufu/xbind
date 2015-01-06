vmodel是一款轻量级的MVVM框架, 旨在于轻量, 易用, 易于扩展.

> 在使用angularjs及avalonjs的过程中, 发现angularjs的过滤规范化, 很难入手, 其条条款款太多, 同时, 其强大的功能背后使其失去了轻量概念, 而avalonjs过度追求完美, 导致最后一点都不完美, 使用vbscript使其预先定义属性才能使用, 与javascript的理念不同, 难让javascript用户信服.

## 自定义压缩javascript

用git拷贝项目源文件到本地:
```bash
git clone https://github.com/sprufu/vmodel.git
```

进入vmodel目录并压缩javascript
```bash
cd vmodel && npm run build
```

### 自定义组件选择

如以下组件可以自由选择是否压缩到你的最终版本里:

- **filter**: 过滤器组件, 如果你的项目中用不到过滤器, 可以去掉这组件: `--without-filter=true`
- **form**: 表单处理组件, 目前这个组件仅处理表单验证, 如果你有更好的验证模块, 可以忽略这组件: `--without-form=true`
- **watch**: x-watch指令标签组件, 默认没有加入这组件, 用 `--with-watch=true` 添加
- **grid**: 表格数据组件, 类似于ajax组件, 但对表格数据加强, 默认情况下没有加入这组件, 可以用 `--with-grid=true` 加入.
- **store**: 小数据存储组件, 还在开发中.
- **view**: 单页应用组件, 还在开发中.


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

## Issue

## Change

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

