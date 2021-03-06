'use strict';
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var sequence = require('run-sequence');
var path = require('path');
var argv = require('yargs').argv;
var bs = require('browser-sync').create();
var source = require('vinyl-source-stream');
var babelify = require('babelify');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var serveStatic = require('serve-static');

var isDist = argv.dist;

var onError = function (e) {
  $.util.beep();
  $.util.log(e.message);
  this.emit('end');
};

/**
 * Compile LESS files into CSS
 * Minify if required
 */
gulp.task('css', function () {
  return gulp.src(['less/main.less', 'less/presenter.less'], {base: path.join(__dirname, 'less')})
    .pipe($.plumber({
        errorHandler: onError
    }))
    .pipe($.less({
      paths: [ path.join(__dirname, 'node_modules') ]
    }))
    .pipe($.autoprefixer({cascade: false}))
    .pipe($.rename(function (path) {
      if (path.basename == 'main') {
        path.basename = 'debut';
      }
    }))
    .pipe(gulp.dest('dist'))
    .pipe(bs.reload({ stream: true }))
    .pipe($.if(isDist, $.rename(function (path) {
      path.basename += '.min';
    })))
    .pipe($.if(isDist, $.minifyCss()))
    .pipe($.if(isDist, gulp.dest('dist')));
});

/**
 * Compile JS files into a single bundle.
 * We are doing bad, bad things with this for the sake of UMD.
 * All externals are globals (inside the scope of the library).
 * One day, someone will figure this out.
 */
gulp.task('js', function () {
  return browserify('lib/main.js')
    .transform(babelify)
    .bundle()
    .on('error', onError)
    .pipe(source('debut.js'))
    .pipe(buffer())
    .pipe($.derequire())
    .pipe($.umd({
      dependencies: function () {
        return [
          {
            name: 'jQuery',
            amd: 'jquery',
            cjs: 'jquery',
            global: 'jQuery',
            param: 'jQuery'
          }, {
            name: 'transit',
            amd: 'jquery.transit',
            cjs: 'jquery.transit',
            global: 'jQuery.transit',
            param: '__transit'
          }
        ];
      },
      exports: function () {
        return '__debut';
      },
      namespace: function () {
        return 'Debut';
      },
      template: path.join(__dirname, 'umdTemplate.js')
    }))
    .pipe(gulp.dest('dist'))
    .pipe(bs.reload({ stream: true }))
    .pipe($.if(isDist, $.rename('debut.min.js')))
    .pipe($.if(isDist, $.uglify()))
    .pipe($.if(isDist, gulp.dest('dist')));
});

/**
 * Build Everything
 */
gulp.task('build', function () {
  sequence(['css', 'js']);
});

/**
 * Watch for changes
 */
gulp.task('watch', ['build'], function () {
  gulp.watch(['lib/*.js'], ['js']);
  gulp.watch(['less/*.less'], ['css']);
  gulp.watch('test/**', bs.reload);
});

/**
 * Serve a test server and update changes automatically
 */
gulp.task('serve', ['watch'], function () {
  bs.init({
    server: './test',
    open: false,
    middleware: serveStatic('./dist')
  });
});

/**
 * Serve by default
 */
gulp.task('default', ['serve']);
