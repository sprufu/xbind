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

    it('telPhone regexp', function() {
        assert(REGEXPS.telPhone.test('08515814740'), '08515814740')
    })

    it('idCard regexp', function() {
        assert(REGEXPS.idCard.test('655312198312012345'))
        assert(REGEXPS.idCard.test('6553121983120123459') == false)
        assert(REGEXPS.idCard.test('65531219831201234a') == false)
        assert(REGEXPS.idCard.test('65531219831201234x') == true)
        assert(REGEXPS.idCard.test('65531229831201234x') == false, '生日年不对')
        assert(REGEXPS.idCard.test('65531219831401234x') == false, '生日月不对')
        assert(REGEXPS.idCard.test('65531219831241234x') == false, '生日日不对')
        assert(REGEXPS.idCard.test('65531219831231234x') == true, '生日日不对')
        assert(REGEXPS.idCard.test('65531219831232234x') == false, '生日日不对')
    })
})

describe('exports.extend()', function() {
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

describe('type', function() {
    it('isFunction()', function() {
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

    it('isArray()', function() {
        it('base', function() {
            assert(exports.isArray([]));
            assert(exports.isArray(1) == false);
            assert(exports.isArray(false) == false);
            assert(exports.isArray(null) == false);
            assert(exports.isArray({}) == false);
            assert(exports.isArray('') == false);
            assert(exports.isArray(new Date) == false);
        })
    })

    it('isPlainObject()', function() {
        it('base', function() {
            assert(exports.isPlainObject({}));
            assert(exports.isPlainObject(new Date) == false);
            assert(exports.isPlainObject(null) == false);
            assert(exports.isPlainObject(false) == false);
            assert(exports.isPlainObject(2) == false);
            assert(exports.isPlainObject('') == false);
        })
    })

    it('isEmptyObject()', function() {
        it('base', function() {
            assert(exports.isEmptyObject({}));
            assert(exports.isEmptyObject({a:false}) == false);
            assert(exports.isEmptyObject(null) == false);
            assert(exports.isEmptyObject(new Date) == false);
        })
    })

    it('type()', function() {
        it('base', function() {
            assert(exports.type(0) == 'number');
            assert(exports.type(false) == 'boolean');
            assert(exports.type(null) == 'null');
            assert(exports.type([]) == 'array');
            assert(exports.type(new Date) == 'date');
            assert(exports.type(/a/) == 'regexp');
            assert(exports.type({}) == 'object');
            assert(exports.type('') == 'string');
        })
    })
})

describe('exports.ready', function() {
    // TODO
})

describe('camelize', function() {
    it('base', function() {
        assert(camelize('test') == 'test');
        assert(camelize('test-user') == 'testUser');
        assert(camelize('test-user-id') == 'testUserId');
    })
})

describe('class', function() {
    var el = document.createElement('div');
        cls = 'abc',
        cls2 = 'abcd';

    beforeEach(function() {
        el.className = '';
    })

    it('addClass()', function() {
        exports.addClass(el, cls);
        assert(el.className == cls);
        exports.addClass(el, cls2);
        assert(el.className == cls + ' ' + cls2);
    });

    it('removeClass()', function() {
        el.className = cls + ' ' + cls2;
        exports.removeClass(el, cls);
        assert(el.className == cls2);
        exports.removeClass(el, cls2);
        assert(el.className == '');
    })
})

describe('css', function() {
    // TODO
})

describe('event', function() {
    var docCount = 0;

    exports.on(document, 'click', function() {
        docCount++;
    });

    beforeEach(function() {
        docCount = 0;
    });

    it('base', function() {
        var event = new Event('click');
        document.dispatchEvent(event);
        assert(docCount == 1);
    })
})

describe('config', function() {
    // TODO
})

describe('String.prototype.startsWith()', function() {
    it('base', function() {
        assert('abcd'.startsWith('a'));
        assert('abcd'.startsWith('ab'));
        assert('abcd'.startsWith('abd') == false);
    })
})

describe('Array.prototype.remove()', function() {
    it('base', function() {
        var arr = [1,2,3,4];
        arr.remove(2);
        assert(arr[1] == 3);
    })
})

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
