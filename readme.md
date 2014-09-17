Gulp Static Handlebars
----------------------

Reads partials and helpers from another source that can be asynchronous (like a database, file system, or promise).

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

##To Do:

* Support more handlebars options