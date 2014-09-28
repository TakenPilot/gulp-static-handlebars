Gulp Static Handlebars
----------------------

Reads partials and helpers from another source that can be asynchronous (like a database, file system, or promise).

[![Build Status](https://travis-ci.org/TakenPilot/gulp-static-handlebars.svg?branch=master)](https://travis-ci.org/TakenPilot/gulp-static-handlebars)

[![Code Climate](https://codeclimate.com/github/TakenPilot/gulp-static-handlebars/badges/gpa.svg)](https://codeclimate.com/github/TakenPilot/gulp-static-handlebars)

[![Coverage Status](https://img.shields.io/coveralls/TakenPilot/gulp-static-handlebars.svg)](https://coveralls.io/r/TakenPilot/gulp-static-handlebars?branch=master)

[![Dependencies](https://david-dm.org/TakenPilot/gulp-static-handlebars.svg?style=flat)](https://david-dm.org/TakenPilot/gulp-static-handlebars.svg?style=flat)

[![NPM version](https://badge.fury.io/js/gulp-static-handlebars.svg)](http://badge.fury.io/js/gulp-static-handlebars)

##Example with any A+ compatible promises library:

```JavaScript

function getData() {
    return Promise.resolve({contents: 'whatever'});
}

function getHelpers() {
    return Promise.resolve({menu: function(options) { return 'menu!'; }});
}

function getPartials() {
    return Promise.resolve({header: '<header></header>', footer: '<footer></footer>'});
}

gulp.src('./app/index.hbs')
      .pipe(handlebars(getData(), {helpers: getHelpers(), partials: getPartials()}))
      .pipe(gulp.dest('./dist'));
      
```

##Another example with vinyl pipes

```JavaScript

gulp.src('./app/index.hbs')
      .pipe(handlebars({contents:"whatever"}, {
        helpers: gulp.src('./app/helpers/**/*.js'),
        partials: gulp.src('./app/partials/**/*.hbs')
      }))
      .pipe(gulp.dest('./dist'));

```

##Install

```Sh

npm install gulp-static-handlebars

```

##Running Tests

To run the basic tests, just run `mocha` normally.  

This assumes you've already installed the local npm packages with `npm install`.

##To Do:

* Support more handlebars options
