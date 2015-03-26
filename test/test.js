var bluebird = require('bluebird'),
  es6Promise = require('es6-promise').Promise,
  handlebars = require('../.'),
  expect = require('chai').expect,
  gulp = require('gulp'),
  rename = require('gulp-rename'),
  File = require('vinyl'),
  stream = require('stream'),
  gUtil = require('gulp-util');

function deferES6Promise() {
  var defer = {};
  defer.promise = new es6Promise(function (resolve, reject) {
    defer.resolve = resolve;
    defer.reject = reject;
  });
  return defer;
}

describe('Gulp Static Handlebars', function () {
  afterEach(function () {
    handlebars.Handlebars.unregisterPartial('test');
    handlebars.Handlebars.unregisterHelper('helper-function-export');
    handlebars.Handlebars.unregisterHelper('test');
  });
  
  describe('Helpers', function () {
    it('es6 promises in object should load', function (done) {
      //arrange
      var helper = function () {
          return 'HELPER';
        },
        expectedContents = '<div>contents!!</div>\n<div>HELPER</div>';
      var deferred = deferES6Promise();

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
    });

    it('bluebird promises in object should load', function (done) {
      //arrange
      var helper = function () {
          return 'HELPER';
        },
        expectedContents = '<div>contents!!</div>\n<div>HELPER</div>';
      var deferred = bluebird.defer();

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
    });

    it('es6 promise returning object should load', function (done) {
      //arrange
      var helper = function () {
          return 'HELPER';
        },
        expectedContents = '<div>contents!!</div>\n<div>HELPER</div>';
      var deferred = deferES6Promise();

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
          done()
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

    it('should load data if promise', function (done) {
      //arrange
      var expectedContents = '<div>Some dynamic content</div>';
      var deferred = Promise.defer();

      //act
      gulp.src('./test/fixtures/test-data-with-helper.html')
        .pipe(handlebars({contents: "contents!!"}, {helpers: deferred.promise}))
        .on('error', function (err) {
          done(err);
        })
        .on('data', function (data) {
          expect(data.contents.toString()).to.equal(expectedContents);
          done();
        });
      deferred.resolve(helper);
    });

    it('bluebird promise returning object should load', function (done) {
      //arrange
      var helper = function () {
          return {
            test: 'HELPER'
          };
        },
        expectedContents = '<div>contents!!</div>\n<div>HELPER</div>';
      var deferred = bluebird.defer();

      //act
      gulp.src('./test/fixtures/test-data-with-helper.html')
        .pipe(handlebars({contents: "contents!!"}, {helpers: deferred.promise}))
        .on('error', function (err) {
          done(err);
        })
        .on('data', function (data) {
          expect(data.contents.toString()).to.equal(expectedContents);
          done();
        });
      deferred.resolve(helper);
    });

    it('pipe should load', function (done) {
      //arrange
      var expectedContents = '<div>contents!</div>\n<div>Imported Helper</div>';

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

    it('should not fail on no helper files and no helper references', function (done) {
      //arrange
      var expectedContents = '<div>contents!</div>\n<div>Imported Helper</div>';

      //act
      gulp.src('./test/fixtures/test-data-with-helper.html')
        .pipe(handlebars({contents: "contents!"}, {helpers: gulp.src('./test/fixtures/something/**/*')}))
        .on('error', function (err) {
          done(err);
        })
        .on('data', function (data) {
          expect(data.contents.toString()).to.equal(expectedContents);
        }).on('end', function () {
          done();
        });
    });
  });

  describe('Partials', function () {
    it('es6 promises in object should load', function (done) {
      //arrange
      var partial = '<div>Partial</div>',
        expectedContents = '<div>contents!!</div>\n<div><div>Partial</div></div>';
      var deferred = deferES6Promise();

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
    });

    it('bluebird promises in object should load', function (done) {
      //arrange
      var partial = '<div>Partial</div>',
        expectedContents = '<div>contents!!</div>\n<div><div>Partial</div></div>';
      var deferred = bluebird.defer();

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
    });

    it('es6 promise returning object should load', function (done) {
      //arrange
      var partial = {
          test: '<div>Partial</div>'
        },
        expectedContents = '<div>contents!!</div>\n<div><div>Partial</div></div>';
      var deferred = deferES6Promise();

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
    });

    it('bluebird promise returning object should load', function (done) {
      //arrange
      var partial = {
          test: '<div>Partial</div>'
        },
        expectedContents = '<div>contents!!</div>\n<div><div>Partial</div></div>';
      var deferred = bluebird.defer();

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
      var expectedContents = '<div>contents!</div>\n<div><test>partial 1 contents!</test></div>';

      //act
      gulp.src('./test/fixtures/test-data-with-partial.html')
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
  });

  describe('Data', function () {
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
  });

  it('can load helper file exporting single function using filename as name of helper', function (done) {
    //arrange
    var expectedContents = '<div>contents!</div>\n<div></div>\n<div>Imported Single Helper</div>';

    //act
    gulp.src('./test/fixtures/test-data-with-helper.html')
      .pipe(handlebars({contents: "contents!"}, {helpers: gulp.src('./test/fixtures/helpers/helper-function-export.js')}))
      .on('data', function (data) {
        expect(data.contents.toString()).to.equal(expectedContents);
      }).on('end', function () {
        done();
      });
  });

  it('should load partials from data from inline functions', function (done) {
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

  it('should load partials from data from mapped promises', function (done) {
    //arrange
    var expectedContents = '<div>contents!!</div>\n<div>immediate data</div>';

    //act
    gulp.src('./test/fixtures/test-data-with-partial.html')
      .pipe(handlebars({contents: "contents!!"}, {partials: {
        'test': Promise.delay('immediate data', 50)
      }}))
      .on('data', function (data) {
        expect(data.contents.toString()).to.equal(expectedContents);
        done();
      });
  });

  it('should not load partials from plain mapped strings (must have scope)', function (done) {
    gulp.src('./test/fixtures/test-data-with-partial.html')
      .pipe(handlebars({contents: "contents!!"}, {partials: {
        'test': 'things'
      }}))
      .on('error', function () {
        done();
      });
  });

  it('should not load partials from arrays (must have a name for each partial)', function (done) {
    gulp.src('./test/fixtures/test-data-with-partial.html')
      .pipe(handlebars({contents: "contents!!"}, {partials: ['things']}))
      .on('error', function () {
        done();
      });
  });

  it('should ignore null files as data', function (done) {
    var f = new File();
    gulp.src('./test/fixtures/test-data.html')
      .pipe(handlebars(f))
      .on('data', function () {})
      .on('end', function () {
        done();
      });
  });

  it('should ignore null files as partials', function (done) {
    var f = new File({
      cwd: "/",
      base: "/test/",
      path: "/test/whatever",
      contents: null
    });
    gulp.src('./test/fixtures/test-data.html')
      .pipe(handlebars({contents: "contents!!"}, {partials: f}))
      .on('data', function () {})
      .on('end', function () {
        done();
      });
  });

  it('should ignore null files as helpers', function (done) {
    var f = new File({
      cwd: "/",
      base: "/test/",
      path: "/test/whatever",
      contents: null
    });
    gulp.src('./test/fixtures/test-data.html')
      .pipe(handlebars({contents: "contents!!"}, {helpers: f}))
      .on('data', function () {})
      .on('end', function () {
        done();
      });
  });

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
});