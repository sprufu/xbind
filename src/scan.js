/**
 * 扫描信息存储
 * <div attr-name="data" scan-guid="scanGuid"> ... </div>
 * 扫描后可以生成很多信息, 这些信息与结点相关, 每个信息是一个回调函数, 连接时只需要执行这个回调函数就行
 */
var SCANS_INFO = {
	/*
	* someScanGuid: [ callback array ],
	* ...
	* callback(element, model);
	*/
};

/**
 * 扫描结点, 添加绑定
 */
function scan(element, model) {
	element = element || document.documentElement;
	model = model || null;

	switch(element.nodeType) {
	// 普通结点
	case 1:
		model = scanAttrs(element, model) || model;
		if (element.childNodes.length) {
			scanChildNodes(element, model);
		}
	break;
	// 文本结点
	case 3:
		scanText(element, model);
	break;
	case 9:
		scanChildNodes(element, model);
	break;
	}
}

exports.scan = scan;

function scanChildNodes(element, parentModel) {
	var el = element.firstChild;
	while (el) {
		scan(el, parentModel);
		el = el.$nextSibling || el.nextSibling;
	}
}

/**
 * 扫描某个结点的属性
 * 一个结点只能生成一次model
 * TODO 某个属性扫描后, 移出其同名的className
 * @param {Element} element 结点对象
 * @param {Model} model model
 * @returns {Model} 如果生成model, 则返回model, 否则返回父级model
 */
function scanAttrs(element, model) {
	var attrs = element.attributes,
	list = getScanAttrList(attrs),
	i = list.length,
	item, fn, attr;

	while (i--) {
		item = list[i];
		attr = attrs[item.index];
		fn = optScanHandlers[item.type];
		if (fn) {
			model = fn({
				model: model,
				element: element,
				type: item.type,
				param: item.param,
				value: attr.value
			}, attr) || model;
		}
	}

	return model;
}

function scanText(element, parentModel) {
	bindModel(parentModel, element.data, parseString, function(res, value, oldValue) {
		element.data = res;
	});
}

/**
 * 获取所要扫描的属性列表
 * 这个是一个有序的列表
 * @param {NamedNodeMap} attrs 属性列表, 只读
 * @returns {Array} [{
 *    index: 属性索引,
 *    priority: 优先级, 小的排在前
 * }]
 */
function getScanAttrList(attrs) {
	var res = [];

	if (attrs.length === 0) {
		return res;
	}

	var i = attrs.length, attr, param, endpos, type;
	while (i--) {
		attr = attrs[i];

		// 过滤ie67的element.attributes得到一大堆属性
		if (!attr.specified) {
			continue;
		}

		param = undefined;

		if (attr.name.startsWith('x-')) {
			endpos = attr.name.indexOf('-', 2);
			if (~endpos) {
				type = attr.name.substr(0, endpos);
				param = attr.name.substr(endpos+1);
			} else {
				type = attr.name;
			}
		} else if (!optScanHandlers[attr.name]) {
			continue;
		} else {
			type = attr.name;
		}

		res.push({
			index: attr.name,
			type: type,
			param: param,
			priority: optPriority[type] || 1000
		});
	}

	if (res.length === 0) {
		return res;
	}

	res.sort(function(a,b) {
		return a.priority > b.priority;
	});

	return res;
}
