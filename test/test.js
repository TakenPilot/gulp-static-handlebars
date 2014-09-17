var fs = require('fs'),
  Promise = require('bluebird'),
  handlebars = require('../.'),
  sinon = require('sinon'),
  expect = require('chai').expect;

describe('Gulp Static Handlebars', function () {
  it('should load helpers', function (done) {
    //arrange
    var helper = function (options) {
        return 'HELPER';
      },
      expectedContents = '<div>contents!!</div>\n<div>HELPER</div>';
    var deferred = Promise.defer();

    //act
    fs.createReadStream('./test/fixtures/test-data-with-helper.html')
      .pipe(handlebars({contents: "contents!!"}, {helpers: {'test': deferred.promise}}))
      .on('data', function (data) {
        expect(data).to.equal(expectedContents);
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
    fs.createReadStream('./test/fixtures/test-data-with-partial.html')
      .pipe(handlebars({contents: "contents!!"}, {partials: {'test': deferred.promise}}))
      .on('data', function (data) {
        expect(data).to.equal(expectedContents);
        done();
      });
    deferred.resolve(partial);
  });

  it('should load data if promise', function (done) {
    //arrange
    var expectedContents = '<div>Some dynamic content</div>';
    var deferred = Promise.defer();

    //act
    fs.createReadStream('./test/fixtures/test-data.html')
      .pipe(handlebars(deferred.promise))
      .on('data', function (data) {
        expect(data).to.equal(expectedContents);
        done();
      });
    deferred.resolve({contents: "Some dynamic content"});
  });

  it('should return function', function (done) {
    //arrange
    var expectedContents = '<div>contents!!</div>';

    //act
    fs.createReadStream('./test/fixtures/test-data.html')
      .pipe(handlebars({contents: "contents!!"}))
      .on('data', function (data) {
        expect(data).to.equal(expectedContents);
        done();
      });
  });
});