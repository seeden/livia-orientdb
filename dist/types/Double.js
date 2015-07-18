'use strict';

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Type = require('livia');

/*
  Javascript long has support for 53bits only
  http://www.w3schools.com/js/js_numbers.asp
*/

var DoubleType = (function (_Type$Type) {
  function DoubleType() {
    _classCallCheck(this, DoubleType);

    if (_Type$Type != null) {
      _Type$Type.apply(this, arguments);
    }
  }

  _inherits(DoubleType, _Type$Type);

  _createClass(DoubleType, [{
    key: '_serialize',
    value: function _serialize(value) {
      return Number(value);
    }
  }, {
    key: '_deserialize',
    value: function _deserialize(value) {
      return value;
    }
  }], [{
    key: 'toString',
    value: function toString() {
      return 'Double';
    }
  }, {
    key: 'getDbType',
    value: function getDbType() {
      return 'DOUBLE';
    }
  }]);

  return DoubleType;
})(_Type.Type.Type);

exports['default'] = DoubleType;
module.exports = exports['default'];