var gutil = require('gulp-util');
var through = require('through2');
var Handlebars = require('handlebars');
var fs = require('fs');
var Promise = require('bluebird');
var _ = require('lodash');

module.exports = function (data, options) {
  options = options || {};
  var dependencies = [];
  //Go through a partials object

  if (data instanceof Promise) {
    dependencies.push(data.tap(function (result) {
      data = result;
    }));
  }

  if(options.partials){
    var partialDependencies = _.map(options.partials, function (result, name) {
      if (result instanceof Promise) {
        result.tap(function (partial) {
          Handlebars.registerPartial(name, partial);
        });
      }
      return result;
    });
    dependencies = dependencies.concat(partialDependencies);
  }
  //Go through a helpers object
  if(options.helpers){
    var helperDependencies = dependencies.concat(_.each(options.helpers, function (result, name) {
      if (result instanceof Promise) {
        result.tap(function (partial) {
          Handlebars.registerHelper(name, partial);
        });
      }
    }));
    dependencies = dependencies.concat(helperDependencies);
  }


  return through.obj(function (file, enc, callback) {
    var self = this;
    Promise.all(dependencies).then(function () {
      self.push(Handlebars.compile(file.toString())(data));
      callback()
    }.bind(this)).catch(function (err) {
      self.emit('error', new gutil.PluginError('gulp-static-handlebars', err))
    });
  });
};