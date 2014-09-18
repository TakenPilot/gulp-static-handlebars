var Promise = require('bluebird'),
  handlebars = require('../.'),
  expect = require('chai').expect,
  gulp = require('gulp'),
  rename = require('gulp-rename');

describe('Gulp Static Handlebars', function () {
  it('should load helpers', function (done) {
    //arrange
    var helper = function (options) {
        return 'HELPER';
      },
      expectedContents = '<div>contents!!</div>\n<div>HELPER</div>';
    var deferred = Promise.defer();

    //act
    gulp.src('./test/fixtures/test-data-with-helper.html')
      .pipe(handlebars({contents: "contents!!"}, {helpers: {'test': deferred.promise}}))
      .on('data', function (data) {
        expect(data.contents.toString()).to.equal(expectedContents);
        done();
      });
    deferred.resolve(helper);
  });

  it('should load partials', function (done) {
    //arrange
    var partial = '<div>Partial</div>',
      expectedContents = '<div>contents!!</div>\n<div><div>Partial</div></div>';
    var deferred = Promise.defer();

    //act
    gulp.src('./test/fixtures/test-data-with-partial.html')
      .pipe(handlebars({contents: "contents!!"}, {partials: {'test': deferred.promise}}))
      .on('data', function (data) {
        expect(data.contents.toString()).to.equal(expectedContents);
        done();
      });
    deferred.resolve(partial);
  });

  it('should load data if promise', function (done) {
    //arrange
    var expectedContents = '<div>Some dynamic content</div>';
    var deferred = Promise.defer();

    //act
    gulp.src('./test/fixtures/test-data.html')
      .pipe(handlebars(deferred.promise))
      .on('data', function (data) {
        expect(data.contents.toString()).to.equal(expectedContents);
        done();
      });
    deferred.resolve({contents: "Some dynamic content"});
  });

  it('should load partials from pipe if available', function (done) {
    //arrange
    var expectedContents = '<div>contents!!</div>\n<div><test>partial 1 contents!!</test></div>';

    //act
    gulp.src('./test/fixtures/test-data-with-partial.html')
      .pipe(handlebars({contents: "contents!!"}, {partials: gulp.src('./test/fixtures/partials/**/*')}))
      .on('data', function (data) {
        expect(data.contents.toString()).to.equal(expectedContents);
        done();
      });
  });

  it('should load helpers from pipe if available', function (done) {
    //arrange
    var expectedContents = '<div>contents!</div>\n<div>Imported Helper</div>';

    //act
    gulp.src('./test/fixtures/test-data-with-helper.html')
      .pipe(handlebars({contents: "contents!"}, {helpers: gulp.src('./test/fixtures/helpers/**/*')}))
      .on('data', function (data) {
        expect(data.contents.toString()).to.equal(expectedContents);
        done();
      });
  });

  it('should not fail on no partial files', function (done) {
    //arrange
    var expectedContents = '<div>contents!</div>\n<div><test>partial 1 contents!</test></div>';

    //act
    gulp.src('./test/fixtures/test-data-with-partial.html')
      .pipe(handlebars({contents: "contents!"}, {partials: gulp.src('./test/fixtures/something/**/*')}))
      .on('data', function (data) {
        expect(data.contents.toString()).to.equal(expectedContents);
      }).on('end', function () {
        done();
      });
  });

  it('should not fail on no helper files', function (done) {
    //arrange
    var expectedContents = '<div>contents!</div>\n<div>Imported Helper</div>';

    //act
    gulp.src('./test/fixtures/test-data-with-helper.html')
      .pipe(handlebars({contents: "contents!"}, {helpers: gulp.src('./test/fixtures/something/**/*')}))
      .on('data', function (data) {
        expect(data.contents.toString()).to.equal(expectedContents);
      }).on('end', function () {
        done();
      });
  });

  it('can rename files afterward', function (done) {
    //arrange
    var expectedContents = '<div>contents!</div>\n<div><test>partial 1 contents!</test></div>';

    //act
    gulp.src('./test/fixtures/test-data-with-partial.html')
      .pipe(handlebars({contents: "contents!"}, {partials: gulp.src('./test/fixtures/something/**/*')}))
      .pipe(rename('./test/test/test'))
      .on('data', function (data) {
        expect(data.contents.toString()).to.equal(expectedContents);
      }).on('end', function () {
        done();
      });
  });
});