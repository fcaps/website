'use strict()'

module.exports = function (grunt) {
    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt)

    const options = {
        config: {
            src: './grunt/*.js'
        },
        paths: {
            public: './public'
        },
        pkg: grunt.file.readJSON('package.json')
    }

    const configs = require('load-grunt-config')(grunt, options)

    // Project configuration.
    grunt.initConfig(configs)
    grunt.registerTask('prod', [
        'sass:dist',
        'concat:js',
        'uglify:dist'
    ])
}
