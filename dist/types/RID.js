'use strict';

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Type = require('livia');

var _RecordID = require('oriento');

var RIDType = (function (_Type$Type) {
  function RIDType() {
    _classCallCheck(this, RIDType);

    if (_Type$Type != null) {
      _Type$Type.apply(this, arguments);
    }
  }

  _inherits(RIDType, _Type$Type);

  _createClass(RIDType, [{
    key: '_serialize',
    value: function _serialize(value) {
      var record = new _RecordID.RecordID(value);
      if (!record) {
        throw new Error('Problem with parsing of RID: ' + value);
      }

      return record;
    }
  }, {
    key: '_deserialize',
    value: function _deserialize(value) {
      return value;
    }
  }, {
    key: 'toObject',
    value: function toObject() {
      return this.value;
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      return this.value ? this.value.toString() : this.value;
    }
  }], [{
    key: 'toString',
    value: function toString() {
      return 'String';
    }
  }, {
    key: 'getDbType',
    value: function getDbType() {
      return 'LINK';
    }
  }]);

  return RIDType;
})(_Type.Type.Type);

exports['default'] = RIDType;
module.exports = exports['default'];