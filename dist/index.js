'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _Adapter = require('./Adapter');

var _Adapter2 = _interopRequireDefault(_Adapter);

var _schemasSchema = require('./schemas/Schema');

var _schemasSchema2 = _interopRequireDefault(_schemasSchema);

var _schemasEdge = require('./schemas/Edge');

var _schemasEdge2 = _interopRequireDefault(_schemasEdge);

var _schemasVertex = require('./schemas/Vertex');

var _schemasVertex2 = _interopRequireDefault(_schemasVertex);

var _typesIndex = require('./types/index');

var _typesIndex2 = _interopRequireDefault(_typesIndex);

var _livia = require('livia');

var _constantsCollate = require('./constants/Collate');

var _constantsCollate2 = _interopRequireDefault(_constantsCollate);

// deprecated
_schemasSchema2['default'].Edge = _schemasEdge2['default'];
_schemasSchema2['default'].Vertex = _schemasVertex2['default'];

//deprecated
exports['default'] = _Adapter2['default'];

//valid export
exports.Schema = _schemasSchema2['default'];
exports.Types = _typesIndex2['default'];
exports.Index = _livia.Index;
exports.Collate = _constantsCollate2['default'];
exports.Adapter = _Adapter2['default'];
exports.Vertex = _schemasVertex2['default'];
exports.Edge = _schemasEdge2['default'];