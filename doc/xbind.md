# xbind
> 暴露全局变量xbind, amd下导出xbind

## 静态方法

### extend(Parent, override[, constructor]): Child
- [ ]继承的实现

参数说明:

1. `Parent` 父类
2. `override` 重写的方法列表
3. `constructor` 重写的父类构造函数, 调用这之前都先调用父类构造函数,
   也就是说父类构造函数总是先运行


### scan([dom][, model][, options])方法
- [ ] 扫描结点

参数说明:

1. `dom` 从哪个dom结点开始扫描, 默认从根结点开始
2. `model` 数据
3. `options` 选项, 可用的选项有:
    1. `scope` 默认为`root`
    2. `callback` 扫描完成后的回调函数

其它说明:

- [ ] 循环扫描子结点
- [ ] 跳过已经扫描过的子结点
- [ ] 扫描结果不影响其它结点扫描, 也就是说扫描是互不依赖的
- [ ] 扫描时不做更新视图动作
- [ ] 扫描是异步的, 带include之类的要异步加载一起扫描完成才算扫描完成

### set(field, value)
- [ ] 更新数据

### get(field|dom)
- [ ] 获取数据

### ~~fire(field)~~
- [ ] 强制更新视图
- [ ] 这个方法可能移除

### subscribe(field, callback) : Function
- [ ] 监听数据变化, 返回一个函数, 调用后取消监听
- [ ] 回调函数能取到变化前后的值, 过渡效果要用到两个值

### ajax(url): Promise
- [ ] 仿JQuery的ajax

参数说明：

1.  `url` 请求地址