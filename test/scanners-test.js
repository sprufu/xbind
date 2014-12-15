describe('booleanHandler', function() {
	var model = new Model({
		isTest: false
	});

	it('disabled', function() {
		var dom = document.createElement('div');
		dom.setAttribute('disabled', 'isTest');
		scan(dom, model);

		assert(dom.getAttribute('disabled') == null);

		model.$set("isTest", true);
		assert(dom.getAttribute('disabled') == 'disabled');
	});

})

describe('stringBindHandler', function() {
	var model = new Model({
		name: 'jcode',
		job: 'IT'
	});

	beforeEach(function() {
		model.name = 'jcode';
		model.job = 'IT';
	});

	it('simple', function() {
		var dom = document.createElement('div');
		dom.setAttribute('title', '{{ name }}');
		scan(dom, model);
		assert(dom.getAttribute('title') == 'jcode');

		model.$set('name', 'sprufu');
		assert(dom.getAttribute('title') == 'sprufu');
	});

	it('single bind', function() {
		var dom = document.createElement('div');
		dom.setAttribute('title', 'Hello {{ name }}!');
		scan(dom, model);
		assert(dom.getAttribute('title') == 'Hello jcode!');

		model.$set('name', 'sprufu');
		assert(dom.getAttribute('title') == 'Hello sprufu!');
	});

	it('mutil bind', function() {
		var dom = document.createElement('div');
		dom.setAttribute('title', 'Name:{{name}}, Job:{{age}}.');
		scan(dom, model);
		assert(dom.getAttribute('title'), 'Name:jcode, Job:IT.');
		model.$set("job", '被踢');
		assert(dom.getAttribute('title'), 'Name:jcode, Job:被踢.');
	});

	it('mutil line', function() {
		var dom = document.createElement('div');
		dom.setAttribute('title', 'Hello\r\n{{name}}\n!');
		scan(dom, model);
		assert(dom.getAttribute('title', 'Hello\r\n{{name}}\n!'));
	});
});
