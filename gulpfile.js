'use strict';

var autoprefixer = require('gulp-autoprefixer');
var browserify = require('gulp-browserify');
var browserSync = require('browser-sync').create();
var concat = require('gulp-concat');
var del = require('del');
var gulp = require('gulp');
var imagemin = require('gulp-imagemin');
var inject = require('gulp-inject');
var minifycss = require('gulp-minify-css');
var notify = require('gulp-notify');
var rename = require('gulp-rename');
var runSequence = require('run-sequence');
var sass = require('gulp-sass');
var streamSeries = require('stream-series');
var plumber = require('gulp-plumber');
var uglify = require('gulp-uglify');

var vendors = require('./config/vendors');



/* ============================================================================================================
============================================ For Development ==================================================
=============================================================================================================*/


// copy fonts from node_modules and src/fonts to build/fonts
gulp.task('publish-fonts', function () {
    var fonts = vendors.fonts.concat([
        'src/fonts/*'
    ]);

    return gulp.src(fonts)
        .pipe(gulp.dest('build/fonts'));
});

// optimize images under src/images and save the results to build/images
gulp.task('publish-images', function () {
    var imagesWithoutSVG = ['src/images/**/*', '!src/images/**/*.svg'];
    var SVGs = 'src/images/**/*.svg';

    return streamSeries(
        gulp.src(imagesWithoutSVG)
            .pipe(imagemin({
                optimizationLevel: 3,
                progressive: true,
                interlaced: true
            })),
        gulp.src(SVGs)
    )
        .pipe(gulp.dest('build/images'));
});

// copy audios from src/audios to build/audios
gulp.task('publish-audios', function () {
    return gulp.src('src/audios/*')
        .pipe(gulp.dest('build/audios'));
});

// compile sass, concat stylesheets in the right order,
// and save as build/stylesheets/bundle.css
gulp.task('publish-css', function () {
    var cssVendors = vendors.stylesheets;

    return streamSeries(
        gulp.src(cssVendors),
        gulp.src('src/scss/main.scss')
            .pipe(plumber({
                errorHandler: errorAlert
            }))
            .pipe(sass({
                outputStyle: 'expanded'
            }))
            .pipe(autoprefixer())
    )
        .pipe(concat('bundle.css'))
        .pipe(gulp.dest('build/stylesheets'))
        .pipe(browserSync.stream());
});

// bundle CommonJS modules under src/javascripts, concat javascripts in the right order,
// and save as build/javascripts/bundle.js
gulp.task('publish-js', function () {
    var jsVendors = vendors.javascripts;

    return streamSeries(
        gulp.src(jsVendors),
        gulp.src('src/javascripts/*.js')
            .pipe(plumber({
                errorHandler: errorAlert
            }))
            .pipe(browserify({
                transform: ['partialify'],
                debug: true
            }))
        )
        .pipe(concat('bundle.js'))
        .pipe(gulp.dest('build/javascripts'));
});

// inject build/stylesheets/bundle.css and build/javascripts/bundle.js into src/index.html
// and save as build/index.html
gulp.task('inject', function () {
    var target = gulp.src('src/index.html');
    var assets = gulp.src([
        'build/stylesheets/bundle.css',
        'build/javascripts/bundle.js'
    ], {
        read: false
    });
    return target
        .pipe(inject(assets, {
            ignorePath: 'build/',
            addRootSlash: false,
            removeTags: true
        }))
        .pipe(gulp.dest('build'));
});

// watch files and run corresponding task(s) once files are added, removed or edited.
gulp.task('watch', function () {
    browserSync.init({
        server: {
            baseDir: 'build'
        }
    });

    gulp.watch('src/index.html', ['inject']);
    gulp.watch('src/scss/**/*.scss', ['publish-css']);
    gulp.watch('src/javascripts/**/*', ['publish-js']);
    gulp.watch('src/fonts/**/*', ['publish-fonts']);
    gulp.watch('src/images/**/*', ['publish-images']);
    gulp.watch('src/audios/**/*', ['publish-audios']);

    gulp.watch('build/index.html').on('change', browserSync.reload);
    gulp.watch('build/javascripts/*').on('change', browserSync.reload);
    gulp.watch('build/fonts/*').on('change', browserSync.reload);
    gulp.watch('build/images/*').on('change', browserSync.reload);
});

// delete files under build
gulp.task('clean-files', function(cb) {
    return del([
//      'build/**/*'
    ], cb);
});

// delete cache
// gulp.task('clean-cache', function (cb) {
//     return cache.clearAll(cb)
// });

// development workflow task
gulp.task('dev', function (cb) {
    runSequence(['clean-files'], ['publish-fonts', 'publish-images', 'publish-audios', 'publish-css', 'publish-js'], 'inject', 'watch', cb);
});

// default task
gulp.task('default', ['dev']);



/* ============================================================================================================
================================================= For Production ==============================================
=============================================================================================================*/

// minify build/stylesheets/bundle.css and save as build/stylesheets/bundle.min.css
gulp.task('minify-css', function () {
    return gulp.src('build/stylesheets/bundle.css')
        .pipe(minifycss())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('build/stylesheets'));
});

// uglify build/javascripts/bundle.js and save as build/javascripts/bundle.min.js
gulp.task('uglify-js', function () {
    return gulp.src('build/javascripts/bundle.js')
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('build/javascripts'));
});

// inject build/stylesheets/bundle.min.css and build/javascripts/bundle.min.js into src/index.html
// and save as build/index.html
gulp.task('inject-min', function () {
    var target = gulp.src('src/index.html');
    var assets = gulp.src([
        'build/stylesheets/bundle.min.css',
        'build/javascripts/bundle.min.js'
    ], {
        read: false
    });
    return target
        .pipe(inject(assets, {
            ignorePath: 'build/',
            addRootSlash: false,
            removeTags: true
        }))
//      .pipe(gulp.dest('build'))
        .pipe(gulp.dest('build'));
});

// delete build/stylesheets/bundle.css and build/javascripts/bundle.js
gulp.task('del-bundle', function (cb) {
    return del([
        'build/stylesheets/bundle.css',
        'build/javascripts/bundle.js'
    ], cb);
});

// run 'minify-css' and 'uglify-js' at the same time
// inject the minified files to index.html
// delete unminified files
gulp.task('prod',  function (cb) {
    runSequence(['minify-css', 'uglify-js'], ['inject-min', 'del-bundle'], cb);
});



/* ===============================================
 ================== Functions ====================
 ================================================*/

// handle errors
function errorAlert(error){
    notify.onError({
        title: "Error in plugin '" + error.plugin + "'",
        message: 'Check your terminal',
        sound: 'Sosumi'
    })(error);
    console.log(error.toString());
    this.emit('end');
}