module.exports = function(grunt) {
    var pkg = grunt.file.readJSON('package.json');

    var uglify_files = {};
    var sass_files = {};
    var ejs = {};
    var copy = {};
    var ejsJobNames = [];
    var copyJobNames = [];
    var zip = {};
    var zipJobNames = [];
    var buildId = process.env.BUILD_ID ? process.env.BUILD_ID : new Date().getTime();

    pkg.ads.forEach(function(ad) {
        var buildDir = 'build/ads/' + ad.name;
        uglify_files[buildDir + '/scripts/script.js'] = [
            'js/vendor/*',
            'js/' + ad.files.js
        ];
        sass_files[buildDir + '/styles/styles.css'] = 'scss/' + ad.files.scss;
        
        ejs['preview-' + ad.name] = {
            src: ['ejs/preview.ejs'],
            dest: 'build/preview-' + ad.name + '.html',
            ext: '.html',
            options: ad
        }
        ejsJobNames.push('ejs:preview-' + ad.name);

        ejs['ad-' + ad.name] = {
            src: ['ejs/' + ad.files.ejs],
            dest: buildDir + '/index.html',
            ext: '.html',
            options: ad
        }
        ejsJobNames.push('ejs:ad-' + ad.name);

        copy['images-' + ad.name] = {
            expand: true,
            src: ['images/' + ad.name + '/**'],
            dest: buildDir + '/'
        };
        copyJobNames.push('copy:images-' + ad.name);
        copy['images-shared-' + ad.name] = {
            expand: true,
            src: ['images/shared/**'],
            dest: buildDir + '/'
        };
        copyJobNames.push('copy:images-shared-' + ad.name);

        copy['ebloader-' + ad.name] = {
            expand: false,
            src: ['js/EBLoader.js'],
            dest: buildDir+'/scripts/EBLoader.js'
        };
        copyJobNames.push('copy:ebloader-' + ad.name);

        zip['ad-' + ad.name] = {
            'cwd': buildDir,
            'src': [buildDir + '/**'],
            'dest': 'build/archive/' + ad.name + '_' + buildId + '.zip'
        };
        zipJobNames.push('zip:ad-' + ad.name);
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
        ejs: ejs,
        copy: copy,
        zip: zip,
        maxFilesize: {
            ad: {
                options: {
                    maxBytes: pkg.maxSize
                },
                src: ['build/ads/**']
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
                tasks: ejsJobNames
            },
            images: {
                files: 'images/**',
                tasks: copyJobNames
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
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-ejs');
    grunt.loadNpmTasks('grunt-max-filesize');
    grunt.loadNpmTasks('grunt-zip');
    grunt.registerTask('default', ['dev','connect:server','watch']);
    grunt.registerTask('dev', ['uglify:dev','sass:dev'].concat(copyJobNames).concat(ejsJobNames));
    grunt.registerTask('dist', ['clean','uglify:dist','sass:dist'].concat(copyJobNames).concat(ejsJobNames).concat(['maxFilesize:ad']).concat(zipJobNames));
}