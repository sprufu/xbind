describe('REGEXPS test', function() {
	it('url regexp', function() {
		assert(REGEXPS.url.test('http://www.baidu.com'), 'http协议');
		assert(REGEXPS.url.test('https://encrypted.google.com/'), 'https协议');
		assert(REGEXPS.url.test('www.google.com') == false, '没带协议类型');
		assert(REGEXPS.url.test('http://test_cd.com') == false, '域名不能带下划线');
	});

	it('email regexp', function() {
		assert(REGEXPS.email.test('sprufu@163.com'), 'sprufu@163.com');
		assert(REGEXPS.email.test('j.code@qq.com'), 'j.code@qq.com');
		assert(REGEXPS.email.test('27301490@qq.com'), '27301490@qq.com');
		assert(REGEXPS.email.test('abc@de_dt.cn') == false, '域名不能带下划线');
	});

	it('number regexp', function() {
		assert(REGEXPS.number.test('12345'), '12345');
		assert(REGEXPS.number.test('12.345'), '12.345');
		assert(REGEXPS.number.test('-234'), '-234');
		assert(REGEXPS.number.test('-0.24'), '-0.25');
		assert(REGEXPS.number.test('.34'), '.34');
		assert(REGEXPS.number.test('-.34'), '-.34');
		assert(REGEXPS.number.test('3-4') == false, '3-4!');
		assert(REGEXPS.number.test('3.4.4') == false, '3.4.4!');
	});

	it('phone regexp', function() {
		assert(REGEXPS.phone.test('13639137912'), '13639137912')
		assert(REGEXPS.phone.test('136391379120') == false, '136391379120')
	});

	it('telphone regexp', function() {
		assert(REGEXPS.telphone.test('08515814740'), '08515814740')
	})

	it('idcard regexp', function() {
		assert(REGEXPS.idcard.test('655312198312012345'))
		assert(REGEXPS.idcard.test('6553121983120123459') == false)
		assert(REGEXPS.idcard.test('65531219831201234a') == false)
		assert(REGEXPS.idcard.test('65531219831201234x') == true)
		assert(REGEXPS.idcard.test('65531229831201234x') == false, '生日年不对')
		assert(REGEXPS.idcard.test('65531219831401234x') == false, '生日月不对')
		assert(REGEXPS.idcard.test('65531219831241234x') == false, '生日日不对')
		assert(REGEXPS.idcard.test('65531219831231234x') == true, '生日日不对')
		assert(REGEXPS.idcard.test('65531219831232234x') == false, '生日日不对')
	})
})

describe('extend()', function() {
	it('base', function() {
		var a = {a:'a'},
		b = {a:'b', b:'2'};
		var c = extend({}, a, b);
		assert(c.a == b.a && c.b == b.b);

		extend(a, b);
		assert(a.a == b.a && b.b == a.b && a.b);
	});

	it('deep', function() {
		var a = {a:{a:1,b:2}},
		b = {a: {b:5}};
		extend(true, a, b);
		assert(a.a.b == a.a.b && a.a.a == 1);
	})
})

describe('isFunction()', function() {
	it('base', function() {
		assert(exports.isFunction(function(){}));
		assert(exports.isFunction(''.toString));
		assert(exports.isFunction(null) == false);
		assert(exports.isFunction({}) == false);
		assert(exports.isFunction([]) == false);
		assert(exports.isFunction(false) == false);
		assert(exports.isFunction(1) == false);
	});

})
