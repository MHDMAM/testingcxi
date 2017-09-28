var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    karma = require('gulp-karma'),
    concat = require('gulp-concat'),
    ngAnnotate = require('gulp-ng-annotate'),
    uglify = require('gulp-uglify'),
    gulpFilter = require('gulp-filter'),
    clean = require('gulp-clean');


var src = ['./src/**/*.module.js', './src/**/*.js'];
var dist = './dist';

var bowerFiles = [
  './bower_components/angular/angular.js',
  './bower_components/angular-messages/angular-messages.js',
  './bower_components/angular-mocks/angular-mocks.js'];

var testFiles = [].concat(bowerFiles, src);

var filter = gulpFilter(['*', '!*spec.js']);

gulp.task('clean', function () {
  return gulp.src(dist + '/*.js', { read: false})
      .pipe(clean());
});


gulp.task('build', ['clean'], function () {
  return gulp.src(src)
      .pipe(filter)
      .pipe(ngAnnotate())
      .pipe(uglify())
      .pipe(concat('fus-messages.js'))
      .pipe(gulp.dest(dist));
});

gulp.task('jshint', function () {
  return gulp.src(src)
      .pipe(jshint())
      .pipe(jshint.reporter('jshint-stylish', {verbose: true}));

});

gulp.task('test', function () {

  return gulp.src(testFiles)
      .pipe(karma({
        configFile: 'karma.conf.js',
        action: 'run'
      }))
      .on('error', function (err) {
        throw err;
      });
});

gulp.task('default', function () {
  gulp.src(testFiles)
      .pipe(karma({
        configFile: 'karma.conf.js',
        action: 'watch'
      }));
});
