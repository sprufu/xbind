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
        assert(parseString('hello {{ user.name }}!', fields) == '""+"hello "+$model.$get("user.name",true)+"!"');
        assert(fields['user.name'] === true);
    });

    it('My name is {{ user.name }}, I\'m {{ user.age }}.', function() {
        var fields = {};
        assert(parseString('My name is {{ user.name }}, I\'m {{ user.age }}.', fields) == '""+"My name is "+$model.$get("user.name",true)+", I\'m "+$model.$get("user.age",true)+"."');
        assert(fields['user.name'] === true);
        assert(fields['user.age'] === true);
    })

    it('mutil line.', function() {
        var fields = {};
        assert(parseString('hello \r\n {{ user.name }}!', fields) == '""+"hello \\r\\n "+$model.$get("user.name",true)+"!"');
        assert(fields['user.name'] === true);
    });
})

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
