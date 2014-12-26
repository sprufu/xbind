module.exports = function(grunt) {
    grunt.initConfig({
    });

    var files = [
        'src/core.js',
        'src/ajax.js',
        'src/model.js',
        'src/scan.js',
        'src/compat.js',
        'src/scanners.js',
        'src/parser.js',

        'src/exports.js'
    ],

    // 扩展部分
    // 这部分可以不用
    extfiles = {
        filter: 'src/filter.js',
        grid: 'src/grid.js',
        form: 'src/form.js',
        watch: 'src/watch.js'
    };

    // TODO 处理自定义组件
    //console.log(grunt.cli.options)
    var opt = grunt.cli.options;

    // 默认添加过滤器组件
    if (!opt['without-filter']) {
        files.push(extfiles.filter);
    }

    // 默认添加表单处理组件
    if (!opt['without-form']) {
        files.push(extfiles.form);
    }

    // 默认不添加datagrid组件
    if (opt['with-grid']) {
        files.push(extfiles.grid);
    }

    // 默认不添加watch组件
    if (opt['with-watch']) {
        files.push(extfiles.watch);
    }

    // 添加wrap
    files.unshift('src/wrap/header');
    files.push('src/wrap/footer');

    //grunt.fatal('ag');

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            dist: {
                options: {
                    separator: '',
                    footer: '',
                    wrap:'global',
                    process: function(src) {
                        return src.replace('"use strict";', '').replace(/\/\/ vim\:.*\r\n/g, '');
                    }
                },
                files: {
                    'dist/<%= pkg.name %>.js': files,
                },
            },
            distnoie: {
                options: {
                    separator: '',
                    footer: '',
                    wrap:'global',
                    process: function(src) {
                        var start = '/* ie678( */',
                        end = '/* ie678) */',
                        code = '',
                        pos0 = 0, // start起点
                        pos1 = 0, // end起点
                        pos = 0;  // code起点

                        while (true) {
                            pos0 = src.indexOf(start, pos);
                            if (pos0 == -1) {
                                code += src.substr(pos);
                                break;
                            }

                            pos1 = src.indexOf(end, pos0);
                            if (pos1 == -1) {
                                break;
                            }

                            code += src.substring(pos, pos0);
                            pos = pos1 + end.length;
                        }

                        return code;
                    }
                },
                files: {
                    'dist/<%= pkg.name %>-noie.js': 'dist/<%= pkg.name %>.js',
                },
            }
        },

        uglify: {
            options: {
                ASCIIOnly: true,
                sourceMap: true,
                banner: '/*!\r\n * <%= pkg.description %> v<%= pkg.version %>\r\n * <%= pkg.repository.url %>\r\n */'
            },
            build: {
                src: 'dist/<%= pkg.name %>.js',
                dest: 'dist/<%= pkg.name %>.min.js'
            },
            build_noie: {
                src: 'dist/<%= pkg.name %>-noie.js',
                dest: 'dist/<%= pkg.name %>-noie.min.js'
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');

    // Default task(s).
    grunt.registerTask('default', ['concat', 'uglify']);
    grunt.registerTask('uglifyjs', ['uglify']);
    grunt.registerTask('concatjs', ['concat']);

};

// vim:et:sw=4:ft=javascript:ff=dos:fenc=utf-8:ts=4:noswapfile
