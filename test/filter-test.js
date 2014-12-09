// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
describe('date', function() {
	var sDate1 = '2014-12-09';
	var sDate2 = '2014/12/09';
	var sDate3 = '12/09/2014';
	var sDate4 = '12-09-2014';
	var dateLocals = 1418083200000;
	var date = 1418054400000;

	var sDateTime1 = '2014-12-09 03:24:08';
	var sDateTime2 = '2014/12/09 03:24:08';
	var sDateTime3 = '12/09/2014 03:24:08';
	var sDateTime4 = '12-09-2014 03:24:08';
	var dateTime = 1418066648000;

	var sJson = "2014-12-09T03:24:08.539Z";
	var jsonTime = 1418095448539;

	it('parseDateString()', function() {
		assert(parseDateString(sDate1) - 0 == dateLocals);
		assert(parseDateString(sDate2) - 0 == date);
		assert(parseDateString(sDate3) - 0 == date);
		assert(parseDateString(sDate4) - 0 == date);

		assert(parseDateString(sDateTime1) - 0 == dateTime);
		assert(parseDateString(sDateTime2) - 0 == dateTime);
		assert(parseDateString(sDateTime3) - 0 == dateTime);
		assert(parseDateString(sDateTime4) - 0 == dateTime);

		assert(parseDateString(sJson) - 0 == jsonTime);
	});

	it('parseDateNumber()', function() {
		var d = parseDateNumber(date);
		assert(d.getFullYear() == 2014);
		assert(d.getDate() == 9);
		assert(d.getMonth() == 12 - 1);
		var d = parseDateNumber(date/1000);
		assert(d.getFullYear() == 2014);
		assert(d.getDate() == 9);
		assert(d.getMonth() == 12 - 1);
	});

	it('parseDate', function() {
		assert(parseDate(sDate1) - 0 == dateLocals);
		assert(parseDate() == null);
		var d = new Date();
		assert(parseDate(d) == d);
		assert(parseDate(d - 0) - 0 == d - 0);
		assert(parseDate(d/1000) - 0 == d - 0);
	});

});
