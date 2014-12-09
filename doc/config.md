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

### 常用的配置项
1. `interpolate`
	> 字符串插值分隔符, 是一个有两个元素的数组, 默认是: `['{{', '}}']`

2. `ajax`
	> ajax默认参数, 默认:
	```javascript
	{
		type: 'get',
		dataType: 'text',
		cache: false
	}
	```

3. `stringBindAttrs`
	> 可用于字符串插值的属性

4. `booleanBindAttrs`
	> 布尔属性绑定属性

5. `eventBindAttrs`
	> 事件绑定属性, 这些属性会自动添加前辍"x-"

6. `priorities`
	> 扫描属性优先级顺序, 以属性名为键, 数字为值, 值越小优先级越高, 越早得到扫描, 没有设置的属性默认为3000
	> 如: `vmodel.config({priorities:{"x-controller":50}})`
