'use strict';

// Include Gulp & Tools We'll Use
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var gutil = require('gulp-util');
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var port = 8000;

var reload = browserSync.reload;

var DIST = 'dist/';
var SRC = 'src/';

// Copy html to (dist/)
gulp.task('copy-html', function() {
  return gulp.src('src/*.html', {
      dot: true
    })
    // Minify Any HTML
    .pipe($.if('*.html', $.htmlmin({
      collapseWhitespace: true,
      removeComments: true,
      minifyJS: true,
      minifyCSS: true,

    })))
    .pipe(gulp.dest('dist/'))
    .pipe($.size({
      title: 'copying html'
    }));
});

// Copy html to (dist/)
gulp.task('copy-js', function() {
  return gulp.src('src/js/*.js')
    .pipe($.uglify())
    .pipe(gulp.dest('dist/js/'))
    .pipe($.size({
      title: 'copying js files'
    }));
});

gulp.task('process-sass', function() {
  var AUTOPREFIXER_BROWSERS = [
    'ie >= 10',
    'ie_mob >= 10',
    'ff >= 30',
    'chrome >= 34',
    'safari >= 7',
    'opera >= 23',
    'ios >= 7',
    'android >= 4.4',
    'bb >= 10'
  ];

  return gulp.src('src/scss/styles.scss')
    .pipe($.sass()) // Converts Sass to CSS with gulp-sass
    .pipe(gulp.dest('src/css'))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    // Minify Styles
    .pipe($.if('*.css', $.csso()))
    .pipe(gulp.dest('dist/css'))
    .pipe($.size({
      title: 'copying css'
    }));
});

// Lint JavaScript
gulp.task('jshint', function() {
  return gulp.src([SRC + '**/*.js'])
    .pipe(reload({
      stream: true,
      once: true
    }))
    .pipe($.jshint('.jshintrc'))
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
});

// Clean Output Directory
gulp.task('clean', del.bind(null, ['dist/*', '!dist/'], {
  dot: true
}));

// Build and serve the output from the dist build
gulp.task('serve', ['default'], function() {
  browserSync({
    notify: false,
    logPrefix: 'WSK-DIST',
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: 'dist',
    baseDir: "dist"
  });

  gulp.watch('src/*.html', ['copy-html', reload]);
  gulp.watch('src/scss/*.scss', ['process-sass', reload]);
  gulp.watch('src/js/*.js', ['jshint', 'copy-js', reload]);
});

// Build Production Files, the Default Task
gulp.task('default', ['clean'], function(cb) {
  runSequence(['jshint','copy-js','copy-html','process-sass'], cb);
});