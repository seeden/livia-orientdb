'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Adapter = require('./Adapter');

var _Adapter2 = _interopRequireWildcard(_Adapter);

var _Schema = require('./schemas/Schema');

var _Schema2 = _interopRequireWildcard(_Schema);

var _Edge = require('./schemas/Edge');

var _Edge2 = _interopRequireWildcard(_Edge);

var _Vertex = require('./schemas/Vertex');

var _Vertex2 = _interopRequireWildcard(_Vertex);

var _Type = require('./types/index');

var _Type2 = _interopRequireWildcard(_Type);

var _Index = require('livia');

_Schema2['default'].Edge = _Edge2['default'];
_Schema2['default'].Vertex = _Vertex2['default'];
_Schema2['default'].ObjectId = _Type2['default'].RID;

_Adapter2['default'].Schema = _Schema2['default'];
_Adapter2['default'].Type = _Type2['default'];
_Adapter2['default'].Index = _Index.Index;

exports['default'] = _Adapter2['default'];
module.exports = exports['default'];