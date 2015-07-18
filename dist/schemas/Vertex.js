'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _OrientSchema$prepareSchema = require('./Schema');

var _OrientSchema$prepareSchema2 = _interopRequireWildcard(_OrientSchema$prepareSchema);

var _Schema = require('livia');

var Vertex = (function (_Schema$Vertex) {
  function Vertex(props) {
    var options = arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, Vertex);

    options.extend = options.extend || 'V';

    _get(Object.getPrototypeOf(Vertex.prototype), 'constructor', this).call(this, props, options);

    _OrientSchema$prepareSchema.prepareSchema(this);
  }

  _inherits(Vertex, _Schema$Vertex);

  _createClass(Vertex, [{
    key: 'getSubdocumentSchemaConstructor',
    value: function getSubdocumentSchemaConstructor() {
      return _OrientSchema$prepareSchema2['default'];
    }
  }]);

  return Vertex;
})(_Schema.Schema.Vertex);

exports['default'] = Vertex;
module.exports = exports['default'];