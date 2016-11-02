# mvvm
- [x] 采用namespace代替以前版本中用的属
        性前辍
- [x] 采用固定的属性名称, 以便于采用dtd或
        xsd约束
- [x] 命名空间并不是必须的，但建议加上以便
        IDE等各种检验工具能及早地发现问题。
        

xbind的理念是操作数据，所以后mvvm中不应该出现 `doSomeThing()` 的情况，取而代之是对数据进行修改。

```html
<!-- v0.4版本 -->
<!DOCTYPE HTML>
<html lang="cn-zh">
<head>
    <meta charset="UTF-8">
    <title></title>
</head>
<body>
    <a x-href="/path/to/url?with={args}">...</a>
</body>
</html>

<!-- v0.5版本 -->
<!DOCTYPE HTML>
<!-- 用xmlns:x="https://github.com/sprufu/xbind/xbind.dtd"定义命名空间 -->
<html lang="cn-zh"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xmlns:x="https://github.com/sprufu/xbind"
     xsi:schemaLocation="https://github.com/sprufu/xbind 
     https://github.com/sprufu/xbind/master/raw/xbind.xsd">
<head>
    <meta charset="UTF-8">
    <title></title>
</head>
<body>
    <!-- 使用"x"命名空间 -->
    <a x:href="/path/to/url?with={args}">...</a>
</body>
</html>
```

## 字符串插值
- [x] 用`{}`括起来的部分是插值表达式.
- [x] 普通标签属性（href和src外）都
        **可以**使用字符串插值
- [x] 文本结点能不能使用字符串插值通过扫
        描选项 `scanTextNode` 或 `x:text` 行
        为确定，默认不能以提高效率.
- [x] 所有字符串插件都会对值的特殊字符进行
        html实体编码
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
<img x:src="{imgUrl}"/>
```

## x:skip
- [x] 忽略扫描其子结点

优先级：0

```html
<div x:skip>
    ...
</div>
```

## x:delay
- [x] 延迟扫描子结点

优先级：10

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
<a x:show="state != 'removed' | ease(200)">[删除]</a>
```

## x:text
- [x] 绑定文本子结点

```html
<a x:text="The string with some { varWithHtmlEncoding }"></a>
<a x:text="The string with some {= varWithoutHtmlEncoding }"></a>
```

## x:text-node
- [x] 重定义是否扫描文本结点选项
- [x]  `scan` 扫描子结点
- [x]  `skip` 忽略子结点扫描
- [x]  `self` 只对直接子结点扫描，深级采用
        上下文定义
- [x]  `rest` 重置开始扫描是定义值

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
- [x] 对像，对像的键为样式名，值如果为 `false` 时删除这样式，否则添加这样式。
- [x] 字符串数组，把这数组元素作为样式。
- [x] 可以对每个样式条件采用过滤器
- [ ] 采用过渡过滤器实现过度效果

```html
    <div x:css="{
        className1: ifState1,                        // 普通用法
        'class-with-char': state2,                  // 样式名带"-"符号时用法
        class3: state3 | filter arg1, arg2 | noArgFilter                    // 可以使用过滤器
        }">
        ...
    </div>
    <div x:css="someArray">
       ...
    </div>
```

## x:style
- [x] 设置样式值, 与css差不多, 只是css的
        每个条件返回一个boolean布值, 而这
        返回字符串值
- [x] 不能像样式那样绑定数组。
- [x] 采用过渡[过滤器](filter.md), 能使用
        样式改变时有个过渡效果动画

```html
    <div x:style="{styleName: someValue | smooth 200}">
        ...
    </div>
```

## x:model
- [x] 数据定义
- [x] 每个属性用计算结果做值，但当结果返回
        个Promise时，要等到成功时才能得到
        结果。
- [x] 可以使用过虑器。
- [x] 可以引用其它数据参与计算，这时候监听
        其它数的变化重新计算。

```html
<div x:model="name = 'jcode'; age = 35">
    <!-- 采用值直接做结果 -->
</a>
<div x:model="name = 'jcode' | filter1 args | filter2">
    <!-- 当然可以有过滤器 -->
</a>
<div x:model="user = xbind.getJson('/get/user?uid=' + uid) | filters">
    <!-- 可以是计算结果, 计算结果如果返回个Promise的要等到其实际得到结果 -->
</a>
```

## x:each
- [x] 会在循环里把当前元素的每个属性注入当前作用域
- [x] 会注入默认的`$index`(当前元素序号, 如果循环的是
      对象, 这个是键名), `$key`(同$index), `$first`(bool
      , 是否是第一个元素), `$middle`(bool, 是否是中间
      元素), `$last`(bool, 是否是最后一个元素), $value(
      元素具体数据)

```html
<select x:bind="someOne">
    <option value="">选择</option>
    <option x:each="users" value="{uid}" x:text="userName"></option>
    
    <!-- 下面的用法是一样的 -->
    <option x:each="users" value="{$value.uid}" x:text="$value.userName"></option>
</select>
```

## x:[event]
- [x] 事件处理

```html
<a x:click="var1=someone; var2=getSomeVar();">...</a>
```



## x:include
- [x] 远程加载到结点下, 会清除掉所有子结点.
- [x] 加载到子结点后, 会继续扫描这些子结点, 
        不想扫描子结点的结合`x:skip`使用.
- [x] 如果想给模板传递参数, 可使用`x:model`
- [x] 可使用动态插入不同内容
- [ ] 使用这个是不是很容易做个单页应用呢？

```html
<div x:include="/path/to/{tpl}">
    ....
</div>
```

## x:mixin
- [x] 组件的定义, 供给其它用

```html
<div x:mixin="userMixin">
    <label>First Name: <input x:bind="firstName" /></label>
    <label>Last Name: <input x:bind="lastName" /></label>
</div>
```

## x:use
- [x] 使用某个组件
- [x] 结合`x:model`一起使用, 用于传递参数给
        组件
- [x] 这是个字符串插值，可以动态替换为不同
        的组件，不采用表达式的原因是使用常量
        时写法我简捷。

```html
<div x:use="{userMixin}" x:model="user = {firstName: 'wu', lastName: 'rf'}"></div>
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