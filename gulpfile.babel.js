/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
import gulp from 'gulp'
import babel from 'gulp-babel'
import filter from 'gulp-filter'
import header from 'gulp-header'
import minifier from 'gulp-uglify/minifier'
import uglify from 'uglify-js'

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
