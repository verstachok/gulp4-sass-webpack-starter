'use strict';

const gulp = require('gulp'),
  sass = require('gulp-sass'),
  minify = require('gulp-csso'),
  imagemin = require('gulp-imagemin'),
  plumber = require('gulp-plumber'),
  postcss = require('gulp-postcss'),
  svgstore = require('gulp-svgstore'),
  rename = require('gulp-rename'),
  uglify = require('gulp-uglify-es').default,
  webp = require('gulp-webp'),
  pump = require('pump'),
  del = require('del'),
  autoprefixer = require('autoprefixer'),
  gulpWebpack = require('webpack-stream'),
  babel = require('gulp-babel'),
  server = require('browser-sync').create();


// Creating configuration for webpack. All the files *.js are concatenated in "all.js" file

let webpackConfig = {
  output: {
    filename: 'all.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: '/node-modules/'
      }
    ]
  },
  mode: 'none'
};

// BUILD HTML
// Any html file is taken from "source" directory and placed in "build" directory

gulp.task('html', function () {
  return gulp.src('source/*.html')
    .pipe(gulp.dest('build'));
});

// END BUILD HTML


// BUILD CSS
// Any sass file is taken from "source/sass" directory, runs through "sass", "postcss", "autoprefixer" and placed in "build/css" directory with same name that sass file. Then it minify, add .min suffix and placed in "build/css". Thus, two files are obtained, this *.css and *.min.css.

gulp.task('style', function () {
  return gulp.src('source/sass/*.scss')
    .pipe(plumber())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer({
        grid: 'autoplace'
      })
    ]))
    .pipe(gulp.dest('build/css'))
    .pipe(minify())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('build/css'))
    .pipe(server.stream());
});

// END BUILD CSS


// BUILD SVG SPRITE
// Any svg file is taken from "source/img/icons" directory, runs through "svgstore" and placed in "sprite.svg" file located in "build/img/sprite" directory

gulp.task('sprite', function () {
  return gulp.src([
    'source/img/icons/*.svg',
  ])
  .pipe(svgstore({
    inlineSvg: true
  }))
  .pipe(rename('sprite.svg'))
  .pipe(gulp.dest('build/img/sprite'));
});

// END SVG SPRITE


// BUILD IMAGES
// Any file with *.png, *.jpg or *.gif extensions is taken from "source/img/" directory, runs through "imagemin" and then placed in "source/img" directory

gulp.task('images', function () {
  return gulp.src('source/img/**/*.{png,jpg,gif}')
  .pipe(imagemin([
    imagemin.optipng({optimizationLevel: 3}),
    imagemin.jpegtran({progressive: true})
  ]))
  .pipe(gulp.dest('source/img'));
});

// END BUILD IMAGES


// BUILD WEBP FORMATE (can be deleted if not needed)
// Any file with *.png, *.jpg extensions is taken from "source/img/" directory, runs through "webp" and then placed in "build/img" directory

gulp.task('webp', function () {
  return gulp.src('source/img/**/*.{png,jpg}')
      .pipe(webp({quality: 90})) //you can put a value of 75 without losing quality
      .pipe(gulp.dest('build/img'));
});

// END BUILD WEBP FORMATE


// BUILD LIBRARIES
// Any file with *.js, *.css extensions is taken from "source/libs" directory and placed in "build/vendor" directory

gulp.task('vendor', function () {
  return gulp.src('source/libs/**/*.{js,css}')
  .pipe(gulp.dest('build/vendor'))
  .pipe(server.stream());
});

// END BUILD LIBRARIES


// BUILD JS

gulp.task('js', function (cd) {
  pump([
    gulp.src('source/js/**/*.js'),
    server.stream()
  ], cd);
});

// END BUILD JS


// BUILD WEBPACK
// Any file imported into index.js is run through "babel" and "webpack", then minified, the suffix .min is added and placed in the "build/js" directory

gulp.task('webpack', function () {
  return gulp.src('source/js/index.js')
  .pipe(babel({
    presets: ['@babel/preset-env']
  }))
  .pipe(gulpWebpack(webpackConfig))
  .pipe(uglify())
  .pipe(rename({suffix: '.min'}))
  .pipe(gulp.dest('build/js'))
  .pipe(server.stream());
});

// END BUILD WEBPACK


// BUILD COPYING
// Copying fonts and images from "source" to "build"

gulp.task('copy', function () {
  return gulp.src([
    'source/fonts/**/*.{woff,woff2}',
    'source/img/**'
  ], {
    base: 'source'
  })
    .pipe(gulp.dest('build'));
});

// END BUILD COPYING


// BUILD CLEANING
// Cleaning "build" directory and deleting it

gulp.task('clean', function () {
  return del('build');
});

// BUILD CLEANING


// Writing all tasks to a variable

const build = gulp.series('clean', 'copy', 'webp', 'vendor', 'sprite', 'style', 'html', 'js', 'webpack');


// TASK "BUILD" (with parameter const "build")

gulp.task('build', build);

// END TASK "BUILD"


// TASK "SERVE"
// Running "browser-sync" from "build" directory and monitoring working files in "source" directory in order to "browser-sync" reload when they changes.

gulp.task('serve', function () {
  server.init({
    server: ['build/', './']
  });

  gulp.watch('source/*.html', gulp.series('html')).on('change', server.reload);
  gulp.watch('source/js/**/*.js', gulp.series('js')).on('change', server.reload);
  gulp.watch('source/js/**/*.js', gulp.series('webpack')).on('change', server.reload);
  gulp.watch('src/img/*', gulp.series('images'));
  gulp.watch('source/sass/**/*.scss', gulp.series('style'));
  gulp.watch('source/img/icons/*.svg', gulp.series('sprite'));
});

// END TASK "SERVE"
