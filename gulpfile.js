const gulp = require('gulp')
const babel = require('gulp-babel')
const filter = require('gulp-filter')
const header = require('gulp-header')
const uglify = require('uglify-es')
const composer = require('gulp-uglify/composer')

const minify = composer(uglify, console)

function build() {
  const f = filter('src/cli.js', {
    restore: true,
  })
  return gulp.src('./src/*.js')
    .pipe(babel())
    .pipe(minify({
      mangle: {
        toplevel: true,
      },
      compress: {
        toplevel: true,
        unsafe: true,
        passes: 3,
      },
      toplevel: true,
      ecma: 8,
    }))
    .pipe(f)
    .pipe(header('#!/usr/bin/env node\n'))
    .pipe(f.restore)
    .pipe(gulp.dest('./dist'))
}

function devBuild() {
  const f = filter('src/cli.js', {
    restore: true,
  })
  return gulp.src('./src/*.js')
    .pipe(babel())
    .pipe(f)
    .pipe(header('#!/usr/bin/env node\n'))
    .pipe(f.restore)
    .pipe(gulp.dest('./dist'))
}

module.exports = {
  build,
  devBuild,
}
