exports.scanners['x-grid'] = function(model, element, value, attr, param) {
    element.removeAttribute(attr.name);

    if (!element.$modelId) {
        model = new Model();
        model.$bindElement(element);
    }

    var opt = {
        name: param,
        url: value,
        page: element.getAttribute('page'),
        pageSize: element.getAttribute('page-size')
    };

    model[param] = new DataGrid(opt);
    model[param].$$model = model;

    return model;
};

function DataGrid(opt) {
    if (opt.page) {
        if (REGEXPS.number.test(opt.page)) {
            this.$$page = +opt.page;
        } else {
            this.$$page = +parseUrlParam(opt.page) || 1;
        }
    } else {
        this.$$page = 1;
    }

    if (opt.pageSize) {
        if (REGEXPS.number.test(opt.pageSize)) {
            this.$$pageSize = +opt.pageSize;
        } else {
            this.$$pageSize = +parseUrlParam(opt.pageSize) || 20;
        }
    } else {
        this.$$pageSize = 20;
    }

    this.$$sort = '';
    this.$$order = '';
    this.$$params = {
        page: this.$$page,
        pageSize: this.$$pageSize
    };
    this.$$url = opt.url;
    this.$$name = opt.name;

    this.$read();
}

DataGrid.prototype = {
    /**
     * 读取数据
     */
    $read: function(search) {
        if (arguments.length) {
            this.$$params = search;
            this.$$page = 1;
        }

        var self = this,
        data = this.$$params;
        mix(data, {
            page: this.$$page,
            pageSize: this.$$pageSize
        });
        if (this.$$sort) {
            data.sort = this.$$sort;
        }

        if (this.$$order) {
            data.order = this.$$order;
        }

        ajax({
            type: 'GET',
            dataType: 'json',
            cache: false,
            url: this.$$url,
            data: data,
            success: function(res) {
                self.$$model.$set(res, self.$$name + '.');
            },
            error: function(xhr, err) {
                self.$$model.$set(self.$$name + '.$error', err);
            }
        });
    },

    /**
     * 获取当前页码或跳到指定页码
     */
    $page: function(page) {
        if (page) {
            this.$$page = page;
            this.$read();
        } else {
            return this.$$page;
        }
    },

    /**
     * 设置或更改每页显示记录数
     * 更改时重新加载页面并跳到第一页
     */
    $pageSize: function(pageSize) {
        if (pageSize) {
            this.$$pageSize = pageSize;
            this.$$page = 1;
            this.$read();
        } else {
            return this.$$pageSize;
        }
    },

    /**
     * 重新排序
     */
    $sort: function(field, order) {
        this.$$sort = field;
        this.$$order = order || '';
        this.$read();
    }
};

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
