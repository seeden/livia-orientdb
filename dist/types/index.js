"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var Type = require("livia").Type;

var RID = _interopRequire(require("./RID"));

var Double = _interopRequire(require("./Double"));

var Long = _interopRequire(require("./Long"));

var Linked = _interopRequire(require("./Linked"));

Type.RID = RID;
Type.Linked = Linked;

module.exports = Type;