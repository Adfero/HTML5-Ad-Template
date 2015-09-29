module.exports = function(grunt) {
    var pkg = grunt.file.readJSON('package.json');

    var uglify_files = {};
    var sass_files = {};
    var ejs = {}
    var ejsPreviewJobs = [];
    var ejsAdJobs = [];

    pkg.ads.forEach(function(ad) {
        uglify_files['build/ads/' + ad.name + '/scripts/script.js'] = [
            'js/vendor/*',
            'js/' + ad.files.js
        ];
        sass_files['build/ads/' + ad.name + '/styles/styles.css'] = 'scss/' + ad.files.scss;
        ejs['preview-' + ad.name] = {
            src: ['ejs/preview.ejs'],
            dest: 'build/preview-' + ad.name + '.html',
            ext: '.html',
            options: ad
        }
        ejs['ad-' + ad.name] = {
            src: ['ejs/' + ad.files.ejs],
            dest: 'build/ads/' + ad.name + '/index.html',
            ext: '.html',
            options: ad
        }
        ejsPreviewJobs.push('preview-' + ad.name);
        ejsAdJobs.push('ad-' + ad.name)l
    });
    
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
        ejs: ejs
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
                files: 'images/**',
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
    grunt.registerTask('dev', ['uglify:dev','sass:dev','copy:images','copy:scripts','ejs:preview','ejs:ad']);
    grunt.registerTask('dist', ['clean','uglify:dist','sass:dist','copy:images','copy:scripts','ejs:preview','ejs:ad','maxFilesize:ad']);
}