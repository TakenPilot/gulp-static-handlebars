var WritableStream = require('readable-stream/writable');
var _ = require('lodash');

function writable(options, write, end) {
  if (_.isFunction(options)) {
    end = write;
    write = options;
    options = {};
  }

  var w = new WritableStream(options);

  w._write = write;
  if (end) {
    w.end = end;
  }

  return w;
}

module.exports = writable;
module.exports.obj = function obj(options, write, end) {
  if (_.isFunction(options)) {
    end = write;
    write = options;
    options = {};
  }

  return writable(_.defaults(options, { objectMode: true, highWaterMark: 16 }), write, end);
};
