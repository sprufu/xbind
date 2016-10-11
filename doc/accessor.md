# Accessor属性访问器

这是内部对象，不对外公布接口，除非要扩展组件才会用得到。

## getRawString()
- [ ] 获取原始字符串

```javascript
// <div x:model="name = 'jcode'; age = 35">
var accessor = new Accessor("name = 'jcode'; age = 35");

// 获取原始字符串
console.log(accessor.getRawString());
// "name = 'jcode'; age = 35"

```

## getBindFields()
- [ ] 获取绑定的字段(属性)

```javascript
// <div title="User name: {username}"></div>
var accessor = new Accessor("User name: {username}");

console.log(accessor.getBindFields());
// ['username']
```

## interpolation(model, callback)
- [ ] 获取插值后字符串, 这是个异步过程

参数说明:

1. `model` 作用域名参数
2. `callback`, 回调函数, 有一个参数(插值后的字符串)

```javascript
// <div x:text="User name: {username}"></div>
var accessor = new Accessor("User name: {username}");

accessor.interpolation({username: 'jcode'}, function(text) {
    console.log(text);
    // User name: jcode
});
```

## execute(model[, outModel][, callback])
- [ ] 执行表达式,获取插值后字符串, 这是个异步过程

参数说明:

1. `model` 作用域名参数
2. `outModel` 输出域与输入域不一样时的输出域, 用在于`x:css`及`x:style`上
3. `callback` 回调函数

```javascript
// <div x:click="state = state1; var2 = someValue"></div>
var accessor = new Accessor("state = state1; var2 = someValue");

accessor.getValue({state1: 'removed', someValue: 'test'}, function() {

});
```