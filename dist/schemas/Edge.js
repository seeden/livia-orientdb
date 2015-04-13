"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _Schema = require("./Schema");

var OrientSchema = _interopRequire(_Schema);

var prepareSchema = _Schema.prepareSchema;

var Schema = require("livia").Schema;

var RIDType = _interopRequire(require("../types/RID"));

var BASE_EDGE_CLASS = "E";

var Edge = (function (_Schema$Edge) {
	function Edge(props, options) {
		_classCallCheck(this, Edge);

		options = options || {};
		options.extend = options.extend || BASE_EDGE_CLASS;

		_get(Object.getPrototypeOf(Edge.prototype), "constructor", this).call(this, props, options);

		prepareSchema(this);

		//add default properties
		this.add({
			"in": { type: RIDType, required: true, notNull: true }, //from
			out: { type: RIDType, required: true, notNull: true } //to
		});

		if (options.unique) {
			this.index({
				"in": 1,
				out: 1
			}, { unique: true });
		}
	}

	_inherits(Edge, _Schema$Edge);

	_createClass(Edge, {
		getSubdocumentSchemaConstructor: {
			value: function getSubdocumentSchemaConstructor() {
				return OrientSchema;
			}
		}
	});

	return Edge;
})(Schema.Edge);

module.exports = Edge;