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
  if(options.partials){
    dependencies.concat(_.map(options.partials, function (result, name) {
      if (result instanceof Promise) {
        result.tap(function (partial) {
          Handlebars.registerPartial(name, partial);
        });
        return result;
      } else {
        return null;
      }
    }));
  }
  //Go through a helpers object
  if(options.helpers){
    dependencies.concat(_.each(options.helpers, function (result, name) {
      if (result instanceof Promise) {
        result.tap(function (partial) {
          Handlebars.registerHelper(name, partial);
        });
      }
    }));
  }


  return through.obj(function (file, enc, callback) {
    var self = this;
    Promise.all(dependencies).then(function () {
      self.push(Handlebars.compile(file.toString()));
      callback()
    }.bind(this)).catch(function (err) {
      self.emit('error', gutil.PluginError(err))
    });
  });
};