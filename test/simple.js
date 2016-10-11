/**
 * 采用mocha+phantom做单元测试示例
 * Created by jcode on 2016-09-23.
 */
const assert = require('assert');
const driver = require('promise-phantom');

describe('web page', () => {
    var phantom, page;
    before(function() {
        return driver.create().then(_phantom => {
            phantom = _phantom;
            return phantom.createPage();
        }).then(_page => {
            page = _page;
        });
    });

    after(function () {
        return phantom.exit();
    });

    it('page', function () {
        return page.open('test/.stubs.js', 'GET')
            .then(status => {
                assert('success' === status);
                return page.get('content');
            }).then(text => {
                console.log(text);
        });
    });

    it('html', function () {
        return page.openHtml('<html><head></head><body>This is a body</body></html>', './')
        .then(() => {
            // page.evaluate仅支持ES5
            // https://github.com/Reewr/promise-phantom/blob/master/docs/webpage.md#Page+evaluate
            page.evaluate(function() {
                document.body.innerText = 'hello word';
                return document.body.textContent;
            });
        }).then(content => {
            assert('hello word', content);
        });
    });
});