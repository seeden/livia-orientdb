'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _Schema = require('./Schema');

var _Schema2 = _interopRequireDefault(_Schema);

var _livia = require('livia');

var _typesRID = require('../types/RID');

var _typesRID2 = _interopRequireDefault(_typesRID);

var BASE_EDGE_CLASS = 'E';

var Edge = (function (_Schema$Edge) {
  _inherits(Edge, _Schema$Edge);

  function Edge(props) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, Edge);

    options.extend = options.extend || BASE_EDGE_CLASS;

    _get(Object.getPrototypeOf(Edge.prototype), 'constructor', this).call(this, props, options);

    (0, _Schema.prepareSchema)(this);

    // add default properties
    this.add({
      'in': { type: _typesRID2['default'], required: true, notNull: true }, // from
      'out': { type: _typesRID2['default'], required: true, notNull: true } // to
    });

    if (options.unique) {
      this.index({
        'in': 1,
        'out': 1
      }, { unique: true });
    }
  }

  _createClass(Edge, [{
    key: 'getSubdocumentSchemaConstructor',
    value: function getSubdocumentSchemaConstructor() {
      return _Schema2['default'];
    }
  }]);

  return Edge;
})(_livia.Schema.Edge);

exports['default'] = Edge;
module.exports = exports['default'];