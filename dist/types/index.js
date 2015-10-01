'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _livia = require('livia');

var _RID = require('./RID');

var _RID2 = _interopRequireDefault(_RID);

var _Double = require('./Double');

var _Double2 = _interopRequireDefault(_Double);

var _Float = require('./Float');

var _Float2 = _interopRequireDefault(_Float);

var _Byte = require('./Byte');

var _Byte2 = _interopRequireDefault(_Byte);

var _Short = require('./Short');

var _Short2 = _interopRequireDefault(_Short);

var _Integer = require('./Integer');

var _Integer2 = _interopRequireDefault(_Integer);

var _Long = require('./Long');

var _Long2 = _interopRequireDefault(_Long);

var _Linked = require('./Linked');

var _Linked2 = _interopRequireDefault(_Linked);

_livia.Types.RID = _RID2['default'];
_livia.Types.Linked = _Linked2['default'];
_livia.Types.ObjectId = _Linked2['default'];
_livia.Types.Double = _Double2['default'];
_livia.Types.Float = _Float2['default'];
_livia.Types.Byte = _Byte2['default'];
_livia.Types.Short = _Short2['default'];
_livia.Types.Integer = _Integer2['default'];
_livia.Types.Long = _Long2['default'];

exports['default'] = _livia.Types;
module.exports = exports['default'];