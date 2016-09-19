# Accessor属性访问器

## 公共方法

### getRawString()
- [ ] 获取原始字符串

```javascript
// <div x:model-user="{name: 'jcode', age: 35}">
var accessor = new Accessor("{name: 'jcode', age: 35}");

// 获取原始字符串
console.log(accessor.getRawString());
// "{name: 'jcode', age: 35}"

```

### getBindFields()
- [ ] 获取绑定的字段(属性)

```javascript
// <div title="User name: {username}"></div>
var accessor = new Accessor("User name: {username}");

console.log(accessor.getBindFields());
// ['username']
```

## 各种访问器

### ExpressAccessor表达式访问器

#### getValue(model, callback)获取表达式结果
- [ ] 获取其计算值, 这是个异步计算过程
1. `model` 作用域名参数
2. `callback`, 回调函数, 有一个参数(表达式结果值)

```javascript
// <div x:model-user="xbind.ajax('/get/user?uid=' + uid)">
var accessor = new Accessor("xbind.ajax('/get/user?uid=' + uid)");

accessor.getValue({uid: 20}, function(user) {
	console.log(user);
	// {name: 'jcode', age: 35}
});
```

### StringAccessor字符串插值访问器

#### getString(model, callback)
- [ ] 获取插值后字符串, 这是个异步过程
1. `model` 作用域名参数
2. `callback`, 回调函数, 有一个参数(插值后的字符串)

```javascript
// <div x:text="User name: {username}"></div>
var accessor = new Accessor("User name: {username}");

accessor.getValue({username: 'jcode'}, function(text) {
	console.log(text);
	// User name: jcode
});
```

### ExecuteAccessor可执行代码访问器

#### execute(model, callback)
- [ ] 执行表达式,获取插值后字符串, 这是个异步过程
1. `model` 作用域名参数
2. `callback`, 回调函数

```javascript
// <div x:click="state = state1; var2 = someValue"></div>
var accessor = new Accessor("state = state1; var2 = someValue");

accessor.getValue({state1: 'removed', someValue: 'test'}, function() {
	
});
```
