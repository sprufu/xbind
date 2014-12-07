describe('ajax', function() {
	it('ajax#success()', function(done) {
		ajax({
			url: '../sample/data.json',
			dataType: 'json',
			success: function(res) {
				assert(res.total);
				done();
			}
		})
	})

	it('ajax#error()', function(done) {
		ajax({
			url: 'unkown-url',
			dataType: 'json',
			error: function(res) {
				console.log(res);
				done();
			}
		})
	})
});

describe('object2UrlSearch()', function() {
	it('object2UrlSearch', function() {
		assert(object2UrlSearch(null) == '', 'null返回空字符串');
		assert(object2UrlSearch(undefined) == '', 'undefined返回空字符串');
		assert(object2UrlSearch() == '', '不传值返回空字符串');
		assert(object2UrlSearch({name:'jcode'}) == 'name=jcode', '{name:"jcode"}返回字符串"name=jcode"');
		assert(object2UrlSearch({name:'jcode', uid:215}) == 'name=jcode&uid=215', '{name:"jcode", uid:215}返回字符串"name=jcode&uid=215"');
		assert(object2UrlSearch({name:'jcode', uid:null}) == 'name=jcode&uid=', '{name:"jcode", uid:null}返回字符串"name=jcode&uid="');
	})
})
