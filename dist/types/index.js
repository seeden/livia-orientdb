'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Type = require('livia');

var _RID = require('./RID');

var _RID2 = _interopRequireWildcard(_RID);

var _Double = require('./Double');

var _Double2 = _interopRequireWildcard(_Double);

var _Long = require('./Long');

var _Long2 = _interopRequireWildcard(_Long);

var _Linked = require('./Linked');

var _Linked2 = _interopRequireWildcard(_Linked);

_Type.Type.RID = _RID2['default'];
_Type.Type.Linked = _Linked2['default'];
_Type.Type.Double = _Double2['default'];
_Type.Type.Long = _Long2['default'];

exports['default'] = _Type.Type;
module.exports = exports['default'];