### 配置vmodel
> 配置vmodel很简单, 只需要调用vmodel.config方法就可以, 例如要改变默认的字符串
> 插件分隔符, 可以使用:

```javascript
vmodel.config('interpolate', ['<%', '%>']);
```

**注意**: 这必须在扫描之前设置, 否则已经扫描的将不起作用, 事实上,
大部分配置都要在扫描之前设置好.

> 如果同时设置很多配置, 可以这样:

```javascript
vmodel.config({
    interpolate: ['<%', '%>'],
	ajax: {
		type: 'post',
		dataType: 'json',
		cache: false
	}
});
```

> 采用这方法与上面有着明显不同, 上面直接替换属性的值, 而这种方式中采用extend方式深度拷贝.
