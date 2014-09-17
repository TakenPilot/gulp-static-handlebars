Gulp Static Handlebars
----------------------

Reads partials and helpers from another source that can be asynchronous (like a database, file system, or promise).

##Example:

```JavaScript

var Promise = require('bluebird'); //promise implementation library

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

##To Do:

* Allow reading in of pipes (buffers, streams and vinyl) as well
* Support more handlebars options