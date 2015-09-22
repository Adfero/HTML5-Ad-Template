module.exports = function(grunt) {
    var uglify_files = {
        'build/ad/scripts/script.js': [
            'js/vendor/*',
            'js/script.js'
        ]
    };
    var sass_files = {
        'build/ad/styles/style.css' : 'scss/main.scss'
    };
    var pkg = grunt.file.readJSON('package.json');
    grunt.initConfig({
        pkg: pkg,
        clean: ['./build'],
        uglify: {
            dist: {
                files: uglify_files
            },
            dev: {
                options: {
                    compress: false,
                    mangle: false,
                    beautify: true
                },
                files: uglify_files
            }
        },
        sass: {
            dist: {
                options: {
                    style: 'compressed',
                    sourcemap: 'none'
                },
                files: sass_files
            },
            dev: {
                options: {
                    style: 'expanded'
                },
                files: sass_files
            }
        },
        ejs: {
          preview: {
            src: ['ejs/preview.ejs'],
            dest: 'build/index.html',
            ext: '.html',
            options: pkg.ad
          },
          ad: {
            src: ['ejs/index.ejs'],
            dest: 'build/ad/index.html',
            ext: '.html',
            options: pkg.ad
          },
        },
        copy: {
            images: {
                expand: true,
                src: ['images/**'],
                dest: 'build/ad/'
            },
            scripts: {
                expand: false,
                src: ['js/EBLoader.js'],
                dest: 'build/ad/scripts/EBLoader.js'
            }
        },
        maxFilesize: {
            ad: {
                options: {
                    maxBytes: pkg.ad.maxSize
                },
                src: ['build/ad/**']
            }
        },
        watch: {
            css: {
                files: 'scss/*.scss',
                tasks: ['sass:dev']
            },
            js: {
                files: 'js/*.js',
                tasks: ['uglify:dev']
            },
            ejs: {
                files: 'ejs/*.ejs',
                tasks: ['ejs:preview','ejs:ad']
            },
            images: {
                files: 'images/*',
                tasks: ['copy:images']
            }
        },
        connect: {
            server: {
                options: {
                    port: 4000,
                    base: 'build',
                    hostname: '*'
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-ejs');
    grunt.loadNpmTasks('grunt-max-filesize');
    grunt.registerTask('default', ['dev','connect:server','watch']);
    grunt.registerTask('dev', ['uglify:dev','sass:dev','copy:images','ejs:preview','ejs:ad']);
    grunt.registerTask('dist', ['clean','uglify:dist','sass:dist','copy:images','copy:scripts','ejs:preview','ejs:ad','maxFilesize:ad']);
}