'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x3, _x4, _x5) { var _again = true; _function: while (_again) { var object = _x3, property = _x4, receiver = _x5; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x3 = parent; _x4 = property; _x5 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _RID2 = require('./RID');

var _RID3 = _interopRequireDefault(_RID2);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _livia = require('livia');

var Linked = (function (_RID) {
  _inherits(Linked, _RID);

  function Linked() {
    _classCallCheck(this, Linked);

    _get(Object.getPrototypeOf(Linked.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(Linked, [{
    key: '_serialize',

    // START - copy from livia linked
    value: function _serialize(value) {
      if (value instanceof _livia.Document) {
        return value;
      } else if (_lodash2['default'].isPlainObject(value)) {
        var Doc = this.getDocumentClass();
        if (!Doc) {
          throw new Error('Document is not defined for property ' + this.name);
        }

        return new Doc(value);
      }

      return _get(Object.getPrototypeOf(Linked.prototype), '_serialize', this).call(this, value);
    }
  }, {
    key: 'get',
    value: function get(path) {
      if (this._value instanceof _livia.Document) {
        return this._value.get(path);
      }

      return _get(Object.getPrototypeOf(Linked.prototype), 'get', this).call(this, path);
    }
  }, {
    key: 'set',
    value: function set(path, value) {
      if (this._value instanceof _livia.Document) {
        return this._value.set(path, value);
      }

      return _get(Object.getPrototypeOf(Linked.prototype), 'set', this).call(this, path, value);
    }
  }, {
    key: 'setAsOriginal',
    value: function setAsOriginal() {
      _get(Object.getPrototypeOf(Linked.prototype), 'setAsOriginal', this).call(this);

      if (this._value instanceof _livia.Document) {
        return this._value.setAsCreated();
      }

      return this;
    }

    // END - copy from livia linked
  }, {
    key: 'toJSON',
    value: function toJSON() {
      var _this = this;

      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      return this._preDeserialize(function (value) {
        if (value instanceof _livia.Document) {
          var obj = value.toJSON(options);
          if ((options.update || options.create) && value.get('@rid')) {
            return obj['@rid'];
          }

          return obj;
        }

        return _get(Object.getPrototypeOf(Linked.prototype), 'toJSON', _this).call(_this, options);
      }, options.disableDefault);
    }
  }, {
    key: 'toObject',
    value: function toObject() {
      var _this2 = this;

      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      return this._preDeserialize(function (value) {
        if (value instanceof _livia.Document) {
          var obj = value.toObject(options);
          if ((options.update || options.create) && value.get('@rid')) {
            return obj['@rid'];
          }

          return obj;
        }

        return _get(Object.getPrototypeOf(Linked.prototype), 'toObject', _this2).call(_this2, options);
      }, options.disableDefault);
    }
  }, {
    key: 'isModified',
    get: function get() {
      if (this._value instanceof _livia.Document) {
        return this._value.isModified();
      }

      return _get(Object.getPrototypeOf(Linked.prototype), 'isModified', this);
    }
  }], [{
    key: 'getPropertyConfig',
    value: function getPropertyConfig(prop) {
      if (prop.type.isDocumentClass) {
        return {
          linkedClass: prop.type.modelName
        };
      }

      if (prop.options && prop.options.ref) {
        return {
          linkedClass: prop.options.ref
        };
      }

      return {};
    }
  }]);

  return Linked;
})(_RID3['default']);

exports['default'] = Linked;
module.exports = exports['default'];