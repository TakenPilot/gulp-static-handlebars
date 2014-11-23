var gutil = require('gulp-util');
var through = require('through2');
var Handlebars = require('handlebars');
var Promise = require('bluebird');
var _ = require('lodash');
var Path = require('path');
var writable = require('./lib/writable');

/**
 * Duck-typing to allow different promise implementations to work.
 */
function isPromise(obj) {
  return !!obj && _.isFunction(obj.then);
}

function isPipe(obj) {
  return !!obj && _.isFunction(obj.pipe);
}

function isFile(obj) {
  return !!obj && _.isFunction(obj.isStream) && _.isFunction(obj.isBuffer) && _.isString(obj.path);
}

function getNameFromPath(path) {
  return path.split(Path.sep).pop().split('.').shift();
}

function getPromiseFromPipe(pipe, fn) {
  var d = Promise.defer();
  pipe.pipe(writable.obj(function (file, enc, cb) {
    var str = file.contents.toString();
    fn(file, str);
    cb();
  }, function () {
    //end
    d.resolve();
  }));
  return d.promise;
}

function getPromises(obj, fn) {
  if (_.isPlainObject(obj)) {
    return _.map(obj, function (result, name) {
      if (isPromise(result)) {
        return result.then(function (partial) {
          fn(name, partial);
          return partial;
        });
      } else if (_.isFunction(result)) {
        fn(name, result);
        return result;
      }
      return null;
    });
  } else if (isPipe(obj)) {
    return [getPromiseFromPipe(obj, fn)];
  }
  return [];
}

module.exports = function (data, options) {
  var dataDependencies;
  options = options || {};
  var dependencies = [];
  //Go through a partials object

  if (data) {
    if (isPromise(data)) {
      dataDependencies = data.then(function (result) {
        data = result;
        return result;
      });
    } else {
      dataDependencies = Promise.resolve(data);
    }
    dependencies.push(dataDependencies);
  }


  if (options.partials) {
    var partialDependencies = getPromises(options.partials, function (id, contents) {
      if (isFile(id)) {
        id = getNameFromPath(id.path);
      }
      Handlebars.registerPartial(id, contents);
    });
    dependencies = dependencies.concat(partialDependencies);
  }
  //Go through a helpers object
  if (options.helpers) {
    var helperDependencies = getPromises(options.helpers, function (id, contents) {
      if (isFile(id)) {
        var helperFile = require(id.path);
        if (_.isFunction(helperFile)) {
          Handlebars.registerHelper(getNameFromPath(id.path), helperFile);
        } else if (_.isObject(helperFile)) {
          _.each(helperFile, function(value, key) {
            Handlebars.registerHelper(key, value);
          });
        }
      } else if (_.isString(id) && _.isFunction(contents)) {
        id = id.toLowerCase();
        Handlebars.registerHelper(id, contents);
      }
    });
    dependencies = dependencies.concat(helperDependencies);
  }


  return through.obj(function (file, enc, callback) {
    var self = this;
    Promise.all(dependencies).then(function () {
      file.contents = new Buffer(Handlebars.compile(file.contents.toString())(data));
      self.push(file);
    }.bind(this)).catch(function (err) {
      self.emit('error', new gutil.PluginError('gulp-static-handlebars', err));
    }).finally(function () {
      callback();
    });
  });
};

module.exports.Handlebars = Handlebars;
