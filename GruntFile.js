module.exports = function(grunt) {
	grunt.initConfig({
	});

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		
		concat: {
			dist: {
				options: {
					separator: '',
					footer: '',
					wrap:'global'
				},
				files: {
					'dist/<%= pkg.name %>.js': [
					'src/wrap/header',

					'src/core.js',
					'src/ajax.js',
					'src/model.js',
					'src/scan.js',
					'src/compat.js',
					'src/handlers.js',
					'src/parser.js',
					'src/exports.js',

					'src/wrap/footer'],
				},
			}
		},
		
		uglify: {
			options: {
				ASCIIOnly: true,
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			build: {
				src: 'dist/<%= pkg.name %>.js',
				dest: 'dist/<%= pkg.name %>.min.js'
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
