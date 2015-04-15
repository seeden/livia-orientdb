"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var Adapter = _interopRequire(require("./Adapter"));

var Schema = _interopRequire(require("./schemas/Schema"));

var Edge = _interopRequire(require("./schemas/Edge"));

var Vertex = _interopRequire(require("./schemas/Vertex"));

var Type = _interopRequire(require("./types/index"));

Schema.Edge = Edge;
Schema.Vertex = Vertex;
Schema.ObjectId = Type.RID;

Adapter.Schema = Schema;
Adapter.Type = Type;

module.exports = Adapter;