'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

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

function aggregatedFunction(fnName, field, conditions, callback) {
  if (typeof conditions === 'function') {
    callback = conditions;
    conditions = {};
  }

  if (typeof field === 'function') {
    callback = field;
    conditions = {};
    field = '*';
  }

  if (typeof field === 'undefined') {
    field = '*';
  }

  var query = this.find(conditions).select(fnName + '(' + field + ')').scalar(true);

  return callback ? query.exec(callback) : query;
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

  schema.virtual('rid', { metadata: true }).get(function () {
    return this.get('@rid');
  });

  schema.virtual('_id', { metadata: true }).get(function () {
    return this.get('@rid');
  });

  schema.statics.aggregatedFunction = aggregatedFunction;

  mathFunctions.forEach(function (fnName) {
    schema.statics[fnName] = function (field, conditions, callback) {
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
      if (type && type.isDocumentClass) {
        return _types2['default'].Linked;
      }

      return _get(Object.getPrototypeOf(OrientSchema.prototype), 'convertType', this).call(this, type);
    }
  }]);

  return OrientSchema;
})(_livia.Schema);

exports['default'] = OrientSchema;