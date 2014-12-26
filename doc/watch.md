# x-watch 指令标签

## watch来源
> 这指令跟avalon学来的, 在avalon里它身份是*ms_bind*"万能绑定",
> 但抄袭过来后才发觉这指令很不必要, 所以又把它独立成一个组件.

## 标签使用

监听字段`fieldname`的变化, 当有变化时执行`somefun()`
```html
<div x-watch-fieldname="somefun()"></div>
```

在里面执行一些语句也是可以的, 如:
```html
<div x-watch-fieldname="user.name='jcode'; user.job='被踢'"></div>
```
但是尽量不要这样做, 因为里面再赋值可能会导致 监听=>赋值=>监听 的死循环,
这也是model.$watch的建议之一.

要监听大写的字段名可以这样用:
```html
<div x-watch-user-name="somefun()"></div>
```
这样就监听`userName`字段啦

要监听`user.name`怎么办呢? 可以这样:
```html
<div x-watch-user.name="somefun()"></div>
```

执行的函数是可以采用参数的, 如:
```html
<div x-watch-fieldname="somefun(param)"></div>
```

参数的`this`指向当前结点, 如:
```html
<div x-controller="test" x-watch-fieldname="somefun(this)"></div>
```
```javascript
vmodel({
    $id: 'test',
    somefun: function(el) {
        console.log(el); // <div></div>
    }
})
```

而函数里的`this`是永远指向其model的:
```html
<div x-controller="test" x-watch-fieldname="somefun(this)"></div>
```
```javascript
vmodel({
    $id: 'test',
    somefun: function(el) {
        console.log(this.$id); // test
    }
})
```

## watch建议
>    这指令监听字段变化, 然后执行相关代码, 然而, 这是代码逻辑,
> 而不是视图表现, 不应该出现在视图标签中, 应该放到js代码中
> 去才适合VM分离原则, 所以不建议过多使用这指令标签, 就算采用
> 也不宜在表达式中写复杂的代码, 尽管支持上没有问题.  
>  
>    但这指令很容易取到结点, 与结点相关的逻辑写在这里可能很容易,
> 写在js上则要另外找方法取结点, 因为整个框架没有实现选择器支持.  
>  
>   然而这与前面建议相勃而行? 其实不然, 框架本身反对直接操作结点,
> 与结点相关的操作基本上都可以用绑定指令来实现, 实在做不到情况才
> 考虑结点操作.
