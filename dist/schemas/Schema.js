'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

exports.prepareSchema = prepareSchema;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _livia = require('livia');

var _types = require('../types');

var _types2 = _interopRequireDefault(_types);

function getDefaultClassName() {
  return this._className;
}

function aggregatedFunction(_x5, _x6, _x7, _x8) {
  var _this = this;

  var _again2 = true;

  _function2: while (_again2) {
    var fnName = _x5,
        field = _x6,
        conditions = _x7,
        callback = _x8;
    _again2 = false;

    if (typeof conditions === 'function') {
      _x5 = fnName;
      _x6 = field;
      _x7 = {};
      _x8 = conditions;
      _again2 = true;
      continue _function2;
    }

    if (typeof field === 'function') {
      _x5 = fnName;
      _x6 = '*';
      _x7 = {};
      _x8 = field;
      _again2 = true;
      continue _function2;
    }

    if (typeof field === 'undefined') {
      _x5 = fnName;
      _x6 = '*';
      _x7 = conditions;
      _x8 = callback;
      _again2 = true;
      continue _function2;
    }

    var query = _this.find(conditions).select(fnName + '(' + field + ')').scalar(true);

    return callback ? query.exec(callback) : query;
  }
}

var mathFunctions = ['count', 'avg', 'sum', 'min', 'max', 'median', 'percentile', 'variance', 'stddev'];

function prepareSchema(schema) {
  schema.add({
    '@type': {
      type: String,
      readonly: true,
      metadata: true,
      'default': 'd',
      subCreate: true,
      subUpdate: true
    },
    '@class': {
      type: String,
      readonly: true,
      metadata: true,
      'default': getDefaultClassName,
      subCreate: true,
      subUpdate: true
    },
    '@rid': {
      type: _types2['default'].RID,
      readonly: true,
      metadata: true,
      isRecordID: true
    },
    '@version': { type: Number, readonly: true, metadata: true },
    '@fieldTypes': { type: String, readonly: true, metadata: true }
  });

  schema.virtual('rid', { metadata: true }).get(function getRid() {
    return this.get('@rid');
  });

  schema.virtual('_id', { metadata: true }).get(function getID() {
    return this.get('@rid');
  });

  schema.statics.aggregatedFunction = aggregatedFunction;

  mathFunctions.forEach(function (fnName) {
    schema.statics[fnName] = function mathFunction(field, conditions, callback) {
      return this.aggregatedFunction(fnName, field, conditions, callback);
    };
  });
}

var OrientSchema = (function (_Schema) {
  _inherits(OrientSchema, _Schema);

  function OrientSchema(props, options) {
    _classCallCheck(this, OrientSchema);

    _get(Object.getPrototypeOf(OrientSchema.prototype), 'constructor', this).call(this, props, options);

    prepareSchema(this);
  }

  _createClass(OrientSchema, [{
    key: 'getSubdocumentSchemaConstructor',
    value: function getSubdocumentSchemaConstructor() {
      return OrientSchema;
    }
  }, {
    key: 'convertType',
    value: function convertType(type) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (!type) {
        return _get(Object.getPrototypeOf(OrientSchema.prototype), 'convertType', this).call(this, type, options);
      }

      // todo it can be removed in next version
      if (type.isDocumentClass) {
        return _types2['default'].Linked;
      }

      if (type === Number) {
        if (options.integer) {
          return _types2['default'].Integer;
        } else if (options.long) {
          return _types2['default'].Long;
        } else if (options.float) {
          return _types2['default'].Float;
        } else if (options.short) {
          return _types2['default'].Short;
        } else if (options.byte) {
          return _types2['default'].Byte;
        }
      }

      return _get(Object.getPrototypeOf(OrientSchema.prototype), 'convertType', this).call(this, type, options);
    }
  }]);

  return OrientSchema;
})(_livia.Schema);

exports['default'] = OrientSchema;