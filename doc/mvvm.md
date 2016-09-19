# mvvm
> 采用namespace代替前辍

## 字符串插值
- [x] 用`{}`括起来的部分是插值表达式.
- [x] 普通标签属性可以使用字符串插值
- [x] 带`x:text`属性标签的文本结点都可以使用字符串插值.
- [x] x命名空间的属性不能使用字符串插值, 因为它们本身就
      是表达式了.
- [x] 所有字符串插件都会对值的特殊字符进行html实体编码,
      如果不想转码, 可用`{= ... }`代替`{ ... }`, "{="是
	  连着写的, 不能分开.  
- [ ] 还有条件插值用`{() ... }`, 省略号部分是普通的插值
      语句, 小括号里是条件, 当条件不成立时省略号部分直接
	  就为空字符串

```html
<div tile="{userName }, 电话: {= telPhone }">
	...
</div>
<!-- 以上可能渲染成: 
<div tile="张三, 电话: 12345678">
	...
</div>
或
<div tile="张三, 电话: ">
	...
</div>
-->

<div tile="{ userName }{(telPhone != null), 电话: {= telPhone }}">
	...
</div>
<!-- 以上可能渲染成: 
<div tile="张三">
	...
</div>
或
<div tile="张三, 电话: 12345678">
	...
</div>
-->
```

## href
- [x] a标签的href的属性值为空或为"#"时, 点击将阻止返回头部的默认行为,
- [x] 值为"#"时也为会改变location.hash值, 这空hash本身没有意义
- [ ] 这行为仅在没有`x:href`属性时有效

```html
<a href="" onclick="doSomething()">...</a>
```

## x:href
- [x] 如果采用字符串做动态连接, 会产生无效连接情况, 为避免这种情况, 应该
      采用`x:href`代替href属性.

```html
<a x:href="/fetch/user/{uid}" x:text="userName"></a>
```

## x:src
- [x] 同`x:href`一样, 如果用`src`图片地址如果带有插值字符串, 浏览器会加载无效
      的图片地址, 为避免这情况, 采用`x:src`代替

```html
<img x:src="/path/to/image.jpg"/>
```

## x:skip
- [x] 忽略扫描其子结点
- [x] 这个优先级最高

```html
<div x:skip>
	...
</div>
```

## x:delay
- [x] 延迟扫描子结点
- [x] 这个优先级仅次于`x:skip`

```html
<div x:delay="ifValue">
	...
	<!-- 只有ifValue为真时, 才扫描子结点 -->
</div>
```


## x:if
- [x] 是否显示结点

```html
<a x:if="state != 'removed'">[删除]</a>
```

## x:show
- [x] 是否显示, 与if不同, 这个是设置其样式来隐藏, 而if是直接移除dom
- [x] 采用过滤器添加动态效果

```html
<a x:show="state != 'removed'">[删除]</a>

<!-- 采用过滤器, 让显示与隐藏有过渡效果 -->
<a x:show="state != 'removed' | ease 200">[删除]</a>
```

## x:text
- [x] 绑定文本子结点
- [x] **会对**字符串进行html实体编码

```html
<a x:text="someValue"></a>
```

## x:html
- [x] 绑定文本子结点
- [x] **不对**字符串进行html实体编码, 带有html标签时采用这方式很有效

```html
<a x:text="someValue"></a>
```

## x:enable
- [x] 添加或移除`disabled="disabled"`属性

```html
	<input type="checkbox" x:enable="state != 'actived'"/>
```

## x:readonly
- [x] 添加或移除`readonly="readonly"`属性

```html
	<input type="checkbox" x:readonly="state == 'actived'"/>
```

## x:bind
> 双向绑定, 值得注意的是这只能绑定变量, 不能用其它表达式(不好反向绑定):

- [x] 输入框值的双向绑定
- [x] 是否选中复选框(checkbox)
- [x] 选哪个单选项(radio)
- [x] 选哪个选择项(select)

```html
	<input x:bind="someVar"/>
	<textarea x:bind="someVar"></textarea>
	
	<input type="checkbox" name="favorite[]" value="体育" x:bind="someArray"/>
	<!-- 当someArray数组包含"体育"时, 被渲染成 -->
	<!-- <input type="checkbox" name="favorite[]" value="体育" checked="checked" /> -->

	<input type="radio" name="favorite" value="体育" x:bind="someVar"/>
	<!-- 当someArray值为"体育"时, 被渲染成 -->
	<!-- <input type="checkbox" name="favorite" value="体育" checked="checked" /> -->

	<select x:bind="someVar">
		...
	</select>
	<!-- 选中值为someVar变量值的项 -->
```

## x:css
- [x] 是否添加某个class类, 每个className对应一个表达式, 计算
      结果为真是添加这个class, 否则移除这个class
- [ ] 采用过渡过滤器实现过度效果

```html
	<div x:css-class-name="ifState1">
		...
	</div>
```

## x:style
- [x] 设置样式值, 与css差不多, 只是css的每个条件返回一个
      boolean布值, 而这返回字符串值, 另外, 采用过渡[过滤器](filter.md)
	  能使用样式改变时有个过渡效果动画

```html
	<div x:style-style-name="someValue | smooth 200">
		...
	</div>
```

## x:scope
- [x] 定义一个作用域, 默认顶级作用域为`root`, 其它作用域自行定义
- [x] 这个扫描的优先级高于其它(除`x:skip`及`x:delay`)

```html
	<div x:scope="useScope">
		...
	</div>
```

## x:model
- [x] 获取数据源, 一般配合`x:scope`一起使用以限定作用域

```html
<div x:model-user="{name: 'jcode', age: 35}">
	<!-- 采用值直接做结果 -->
</a>
<div x:model-name="'jcode' | filter1 args | filter2">
	<!-- 当然可以有过滤器 -->
</a>
<div x:model-var-name="xbind.getJson('/get/user?uid=' + uid) | filters">
	<!-- 可以是计算结果, 计算结果如果返回个Promise的要等到其实际得到结果 -->
</a>
```

## x:each
- [x] 循环某个数据, 一般配合`x:scope`一起使用.  
- [x] 会在循环里把当前元素的每个属性注入当前作用域
- [x] 会注入默认的`$index`(当前元素序号, 如果循环的是
      对象, 这个是键名), `$key`(同$index), `$first`(bool
	  , 是否是第一个元素), `$middle`(bool, 是否是中间
	  元素), `$last`(bool, 是否是最后一个元素)等数据.

```html
<select x:selected="someOne">
	<option value="">选择</option>
	<option x:each-user="users" value="{uid}" x:text="userName"></option>
</select>
```

## x:include
- [x] 远程加载到结点下, 会清除掉所有子结点.
- [x] 加载到子结点后, 会继续扫描这些子结点, 不想扫描子
      结点的结合`x:skip`使用.
- [x] 扫描子结点共享当前作用域, 如果不想这样做, 结合
      `x:scope`使用.
- [x] 如果想给模板传递参数, 可使用`x:model`

```html
<div x:include="/path/to/tpl">
	....
</div>
```

## x:component
- [x] 组件的定义, 供给其它用

```html
<div x:component="userComponent">
	<label>First Name: <input x:bind="firstName" /></label>
	<label>Last Name: <input x:bind="lastName" /></label>
</div>
```

## x:use
- [x] 使用某个组件
- [x] 结合`x:model`一起使用, 用于传递参数给组件

```html
<div x:use="userComponent" x:model-user="{firstName: 'wu', lastName: 'rf'}"></div>
```

## 自定义绑定

```javascript

// 注册绑定方法, 这个一定要在扫描前注册
// 可以重复注册?
xbind.regMvvmHandler('custom', {
	priority: 5000,  // 扫描优先级, 越小越先处理扫描, 自定义的请设置在1000以上
	init: function(element, valueAccessor, allBinds, model, bindingContext) {
		// 扫描时处理动作
	},
	update: function(element, valueAccessor, allBinds, model, bindingContext) {
		// 当有数据更新时将被调用
		// 一般用来更新视图
	}
});

/* 注册过后, 就可以用如下mvvm
<div x:custom="someExpress">
	...
</div>
*/
```
