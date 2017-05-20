const gulp = require('gulp')
const babel = require('gulp-babel')
const filter = require('gulp-filter')
const header = require('gulp-header')
const minifier = require('gulp-uglify/minifier')
const uglify = require('uglify-js')

export function build() {
  const f = filter('src/cli.js', {
    restore: true,
  })
  return gulp.src('./src/*.js')
    .pipe(babel())
    .pipe(minifier({}, uglify))
    .pipe(f)
    .pipe(header('#!/usr/bin/env node\n'))
    .pipe(f.restore)
    .pipe(gulp.dest('./dist'))
}

export function devbuild() {
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

export default build
