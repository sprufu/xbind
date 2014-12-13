describe('replaceWrapLineString', function() {
    it('dos', function() {
        assert(replaceWrapLineString('abc\r\ntest\r\n123') == 'abc\\r\\ntest\\r\\n123');
        assert(replaceWrapLineString('\r\nabc') == '\\r\\nabc');
        assert(replaceWrapLineString('a\r\n') == 'a\\r\\n');
    });

    it('unix', function() {
        assert(replaceWrapLineString('abc\ntest\n123') == 'abc\\ntest\\n123');
        assert(replaceWrapLineString('\ntest') == '\\ntest');
        assert(replaceWrapLineString('test\n') == 'test\\n');
    });

    it('mac', function() {
        assert(replaceWrapLineString('abc\rtest\r123') == 'abc\\rtest\\r123');
        assert(replaceWrapLineString('\rtest') == '\\rtest');
        assert(replaceWrapLineString('test\r') == 'test\\r');
    });

    it('*', function() {
        assert(replaceWrapLineString('abc\r\ntest\r123\n') == 'abc\\r\\ntest\\r123\\n');
    });
});

describe('parseString()', function() {
    it('hello {{ user.name }}!', function() {
        var fields = {};
        assert(parseString('hello {{ user.name }}!', fields) == '""+"hello "+$model.$get("user.name",0,1)+"!"');
        assert(fields['user.name'] === true);
    });

    it('My name is {{ user.name }}, I\'m {{ user.age }}.', function() {
        var fields = {};
        assert(parseString('My name is {{ user.name }}, I\'m {{ user.age }}.', fields) == '""+"My name is "+$model.$get("user.name",0,1)+", I\'m "+$model.$get("user.age",0,1)+"."');
        assert(fields['user.name'] === true);
        assert(fields['user.age'] === true);
    })

    it('mutil line.', function() {
        var fields = {};
        assert(parseString('hello \r\n {{ user.name }}!', fields) == '""+"hello \\r\\n "+$model.$get("user.name",0,1)+"!"');
        assert(fields['user.name'] === true);
    });
})

describe('parseExpress()', function() {
    var fields = {};

    beforeEach(function() {
        fields = {};
    });

    it('user.name', function() {
        var str = 'user.name';
        assert(parseExpress(str, fields) == '$model.$get("user.name")');
        assert(fields['user.name'] === true);
        fields = {};
        assert(parseExpress(str, fields, true) == '$model.$get("user.name",0,1)');
        assert(fields['user.name'] === true);
    });

    it('user.age + 1', function() {
        assert(parseExpress('user.age + 1', fields) == '$model.$get("user.age") + 1');
        assert(fields['user.age'])
    });

    it('user.method() + 2', function() {
        assert(parseExpress('user.method() + 2', fields) == '$model.$get("user.method")() + 2');
        assert(fields.hasOwnProperty('user.method') == false);
    });

    it('user.method(user.age)', function() {
        assert(parseExpress('user.method(user.age)', fields) == '$model.$get("user.method")($model.$get("user.age"))');
        assert(fields.hasOwnProperty('user.method') == false);
        assert(fields['user.age']);
    });

    it('user.addTime | date "yyyy-mm-dd"', function() {
        assert(parseExpress('user.addTime | date "yyyy-mm-dd"', fields) == '(function(expr){expr=$model.$filter("date",expr, "yyyy-mm-dd");return expr;}($model.$get("user.addTime")))');
        assert(fields['user.addTime'])
    });

    it('user.addTime | date "yyyy-mm-dd" | limit', function() {
        assert(parseExpress('user.addTime | date "yyyy-mm-dd" | limit', fields) == '(function(expr){expr=$model.$filter("date",expr, "yyyy-mm-dd" );expr=$model.$filter("limit",expr);return expr;}($model.$get("user.addTime")))');
        assert(fields['user.addTime'])
    })
})

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
