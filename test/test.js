var bluebird = require('bluebird'),
  es6Promise = require('es6-promise').Promise,
  handlebars = require('../.'),
  expect = require('chai').expect,
  gulp = require('gulp'),
  rename = require('gulp-rename'),
  File = require('vinyl'),
  stream = require('stream'),
  gUtil = require('gulp-util');

/**
 * Defer resolution for ES6 promises
 */
function deferES6Promise() {
  var defer = {};
  defer.promise = new es6Promise(function (resolve, reject) {
    defer.resolve = resolve;
    defer.reject = reject;
  });
  return defer;
}

/**
 * Clear away all the helpers and partials that we may create in our tests.
 */
function clearHandlebars() {
  handlebars.instance().unregisterPartial('test');
  handlebars.instance().unregisterHelper('helper-function-export');
  handlebars.instance().unregisterHelper('test');
}

/**
 * Create a new null file
 */
function createNullFile() {
  return new File({
    cwd: "/",
    base: "/test/",
    path: "/test/whatever",
    contents: null
  });
}

describe('Gulp Static Handlebars', function () {
  afterEach(function () {
    clearHandlebars();
  });

  describe('Helpers', function () {
    afterEach(function () {
      clearHandlebars();
    });

    function promisesInObject(deferred, done) {
      var helper = function () {
          return 'HELPER';
        },
        expectedContents = '<div>contents!!</div>\n<div>HELPER</div>\n<div></div>';

      gulp.src('./test/fixtures/test-data-with-helper.html')
        .pipe(handlebars({contents: "contents!!"}, {helpers: {'test': deferred.promise}}))
        .on('error', function (err) {
          done(err);
        })
        .on('data', function (data) {
          expect(data.contents.toString()).to.equal(expectedContents);
          done();
        });
      deferred.resolve(helper);
    }

    it('es6 promises in object should load', function (done) {
      var deferred = deferES6Promise();

      promisesInObject(deferred, done);
    });

    it('bluebird promises in object should load', function (done) {
      var deferred = bluebird.defer();

      promisesInObject(deferred, done);
    });

    function promiseReturningObject(deferred, done) {
      //arrange
      var helper = function () {
          return 'HELPER';
        },
        expectedContents = '<div>contents!!</div>\n<div>HELPER</div>\n<div></div>';

      //act
      gulp.src('./test/fixtures/test-data-with-helper.html')
        .pipe(handlebars({contents: "contents!!"}, {helpers: {'test': deferred.promise}}))
        .on('error', function (err) {
          done(err);
        })
        .on('data', function (data) {
          expect(data.contents.toString()).to.equal(expectedContents);
          done();
        });
      deferred.resolve(helper);
    }

    it('es6 promise returning object should load', function (done) {
      var deferred = deferES6Promise();

      promiseReturningObject(deferred, done);
    });

    it('bluebird returning object should load', function (done) {
      var deferred = bluebird.defer();

      promiseReturningObject(deferred, done);
    });

    it('pipe should load', function (done) {
      //arrange
      var expectedContents = '<div>contents!</div>\n<div>Imported Helper</div>\n<div>Imported Single Helper</div>';

      //act
      gulp.src('./test/fixtures/test-data-with-helper.html')
        .pipe(handlebars({contents: "contents!"}, {helpers: gulp.src('./test/fixtures/helpers/**/*')}))
        .on('error', function (err) {
          done(err);
        })
        .on('data', function (data) {
          expect(data.contents.toString()).to.equal(expectedContents);
          done();
        });
    });

    it('should ignore null files as helpers', function (done) {
      var nullFile = createNullFile();

      gulp.src('./test/fixtures/test-data.html')
        .pipe(handlebars({contents: "contents!!"}, {helpers: nullFile}))
        .on('data', function () {})
        .on('end', function () {
          done();
        });
    });
  });

  describe('Partials', function () {
    afterEach(function () {
      clearHandlebars();
    });

    it('should load more than highWaterMark:17 files', function (done) {
      //arrange
      var partial = '<div>Partial</div>';
      var deferred = Promise.defer();
      var lengthTest = 17;
      var passThrough = new stream.PassThrough({highWaterMark: lengthTest, objectMode: true});

      //act
      passThrough
        .pipe(handlebars({contents: "contents!!"}, {partials: {'test': deferred.promise}}))
        .pipe(gUtil.buffer(function (err, files) {
          expect(files).to.have.length(lengthTest);
          done();
        }));
      deferred.resolve(partial);

      for(var i = 0; i < lengthTest; i++) {
        passThrough.push(new File({
          path: "some/fake/path" + i + ".hbs",
          contents: new Buffer("some fake {{contents}} " + i + "\n")
        }));
      }
      passThrough.push(null);
    });

    it('should load more than highWaterMark:17 partials', function (done) {
      //arrange
      var i,
        lengthTest = 17,
        files = new stream.PassThrough({highWaterMark: lengthTest, objectMode: true}),
        partials = new stream.PassThrough({highWaterMark: lengthTest, objectMode: true});

      //act
      files
        .pipe(handlebars({contents: "contents!!"}, {partials: partials}))
        .pipe(gUtil.buffer(function (err, files) {
          expect(files).to.have.length(lengthTest);
          files.forEach(function (file, index) {
            expect(file.contents.toString()).to.equal("some fake some fake contents!! " + index + "\n " + index + "\n");
          });
          done();
        }));

      for(i = 0; i < lengthTest; i++) {
        files.push(new File({
          path: "some/fake/path" + i + ".html",
          contents: new Buffer("some fake {{> partial" + i + "}} " + i + "\n")
        }));
      }
      files.push(null);

      for(i = 0; i < lengthTest; i++) {
        partials.push(new File({
          path: "some/fake/partial" + i + ".hbs",
          contents: new Buffer("some fake {{contents}} " + i + "\n")
        }));
      }
      partials.push(null);
    });

    it('should not load partials from arrays (must have a name for each partial)', function (done) {
      gulp.src('./test/fixtures/test-data-with-partial.html')
        .pipe(handlebars({contents: "contents!!"}, {partials: ['things']}))
        .on('error', function () {
          done();
        });
    });

    function promisesInObject(deferred, done) {
      //arrange
      var partial = '<div>Partial</div>',
        expectedContents = '<div>contents!!</div>\n<div><div>Partial</div></div>';

      //act
      gulp.src('./test/fixtures/test-data-with-partial.html')
        .pipe(handlebars({contents: "contents!!"}, {partials: {'test': deferred.promise}}))
        .on('error', function (err) {
          done(err);
        })
        .on('data', function (data) {
          expect(data.contents.toString()).to.equal(expectedContents);
          done();
        });
      deferred.resolve(partial);
    }

    it('es6 promises in object should load', function (done) {
      var deferred = deferES6Promise();

      promisesInObject(deferred, done);
    });

    it('bluebird promises in object should load', function (done) {
      var deferred = bluebird.defer();

      promisesInObject(deferred, done);
    });

    function promiseReturningObject(deferred, done) {
      //arrange
      var partial = {
          test: '<div>Partial</div>'
        },
        expectedContents = '<div>contents!!</div>\n<div><div>Partial</div></div>';

      //act
      gulp.src('./test/fixtures/test-data-with-partial.html')
        .pipe(handlebars({contents: "contents!!"}, {partials: deferred.promise}))
        .on('error', function (err) {
          done(err);
        })
        .on('data', function (data) {
          expect(data.contents.toString()).to.equal(expectedContents);
          done();
        });
      deferred.resolve(partial);
    }

    it('es6 promise returning object should load', function (done) {
      var deferred = deferES6Promise();

      promiseReturningObject(deferred, done);
    });

    it('bluebird promise returning object should load', function (done) {
      var deferred = bluebird.defer();

      promiseReturningObject(deferred, done);
    });

    it('plain mapped strings should load', function (done) {
      gulp.src('./test/fixtures/test-data-with-partial.html')
        .pipe(handlebars({contents: "contents!!"}, {partials: {
          'test': 'things'
        }}))
        .on('data', function (result) {
          expect(result).to.be.instanceOf(File);
        })
        .on('end', function () {
          done();
        });
    });

    it('inline functions should load ', function (done) {
      //arrange
      var expectedContents = '<div>contents!!</div>\n<div>immediate data</div>';

      //act
      gulp.src('./test/fixtures/test-data-with-partial.html')
        .pipe(handlebars({contents: "contents!!"}, {partials: {
          'test': function () { return 'immediate data'; }
        }}))
        .on('data', function (data) {
          expect(data.contents.toString()).to.equal(expectedContents);
          done();
        });
    });

    it('pipe should load', function (done) {
      //arrange
      var expectedContents = '<div>contents!!</div>\n<div><test>partial 1 contents!!</test></div>';

      //act
      gulp.src('./test/fixtures/test-data-with-partial.html')
        .pipe(handlebars({contents: "contents!!"}, {partials: gulp.src('./test/fixtures/partials/**/*')}))
        .on('error', function (err) {
          done(err);
        })
        .on('data', function (data) {
          expect(data.contents.toString()).to.equal(expectedContents);
          done();
        });
    });

    it('should not fail on no partial files and no partial references', function (done) {
      //arrange
      var expectedContents = '<div>contents!</div>';

      //act
      gulp.src('./test/fixtures/test-data.html')
        .pipe(handlebars({contents: "contents!"}, {partials: gulp.src('./test/fixtures/something/**/*')}))
        .on('error', function (err) {
          done(err);
        })
        .on('data', function (data) {
          expect(data.contents.toString()).to.equal(expectedContents);
        })
        .on('end', function () {
          done();
        });
    });

    it('should fail on no partial files and partial references', function (done) {
      //arrange
      var expectedContents = '<div>contents!</div>\n<div><test>partial 1 contents!</test></div>';

      //act
      gulp.src('./test/fixtures/test-data-with-partial.html')
        .pipe(handlebars({contents: "contents!"}, {partials: gulp.src('./test/fixtures/something/**/*')}))
        .on('error', function (err) {
          expect(err).to.be.instanceOf(Error);
          done();
        })
        .on('data', function (data) {
          //should not happen
          done(data);
        });
    });

    it('should ignore null files as partials', function (done) {
      var nullFile = createNullFile();

      gulp.src('./test/fixtures/test-data.html')
        .pipe(handlebars({contents: "contents!!"}, {partials: nullFile}))
        .on('data', function () {})
        .on('end', function () {
          done();
        });
    });
  });

  describe('Data', function () {
    afterEach(function () {
      clearHandlebars();
    });

    it('es6 promises should load', function (done) {
      //arrange
      var data = {contents: "Some dynamic content"},
        expectedContents = '<div>Some dynamic content</div>',
        deferred = deferES6Promise();

      //act
      gulp.src('./test/fixtures/test-data.html')
        .pipe(handlebars(deferred.promise))
        .on('error', function (err) {
          done(err);
        })
        .on('data', function (data) {
          expect(data.contents.toString()).to.equal(expectedContents);
          done();
        });
      deferred.resolve(data);
    });

    it('bluebird promises should load', function (done) {
      //arrange
      var data = {contents: "Some dynamic content"},
        expectedContents = '<div>Some dynamic content</div>',
        deferred = bluebird.defer();

      //act
      gulp.src('./test/fixtures/test-data.html')
        .pipe(handlebars(deferred.promise))
        .on('error', function (err) {
          done(err);
        })
        .on('data', function (data) {
          expect(data.contents.toString()).to.equal(expectedContents);
          done();
        });
      deferred.resolve(data);
    });

    it('should not fail on missing data reference', function (done) {
      //arrange
      var data = {},
        expectedContents = '<div></div>',
        deferred = bluebird.defer();

      //act
      gulp.src('./test/fixtures/test-data.html')
        .pipe(handlebars(deferred.promise))
        .on('error', function (err) {
          done(err);
        })
        .on('data', function (data) {
          expect(data.contents.toString()).to.equal(expectedContents);
          done();
        });
      deferred.resolve(data);
    });

    it('should not fail on missing data reference ', function (done) {
      //arrange
      var data = undefined,
        expectedContents = '<div></div>',
        deferred = bluebird.defer();

      //act
      gulp.src('./test/fixtures/test-data.html')
        .pipe(handlebars(deferred.promise))
        .on('error', function (err) {
          done(err);
        })
        .on('data', function (data) {
          expect(data.contents.toString()).to.equal(expectedContents);
          done();
        });
      deferred.resolve(data);
    });

    it('should ignore null files as data', function (done) {
      var nullFile = createNullFile();

      gulp.src('./test/fixtures/test-data.html')
        .pipe(handlebars(nullFile))
        .on('data', function () {})
        .on('end', function () {
          done();
        });
    });
  });

  /**
   * If we can use gulp-rename afterward, then we're passing all the correct data for vinyl files that other gulp
   * plugins need.
   */
  it('can rename files afterward', function (done) {
    //arrange
    var expectedContents = '<div>contents!</div>\n<div><test>partial 1 contents!</test></div>';

    //act
    gulp.src('./test/fixtures/test-data-with-partial.html')
      .pipe(handlebars({contents: "contents!"}, {partials: gulp.src('./test/fixtures/partials/**/*')}))
      .on('error', function (err) {
        done(err);
      })
      .pipe(rename('./test/test/test'))
      .on('error', function (err) {
        done(err);
      })
      .on('data', function (data) {
        expect(data.contents.toString()).to.equal(expectedContents);
      })
      .on('end', function () {
        done();
      });
  });

  it('can use another Handlebars instance', function (done) {
    var Handlebars = {
      'test' : 'Handlebars'
    };
    handlebars.instance(Handlebars);
    expect(Handlebars).to.be.equal(handlebars.instance());
    handlebars.instance(null); // use default
    done();
  });

});
