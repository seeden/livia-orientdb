"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Type = require("livia").Type;

/*
	Javascript long has support for 53bits only
	http://www.w3schools.com/js/js_numbers.asp
*/

var DoubleType = (function (_Type) {
	function DoubleType() {
		_classCallCheck(this, DoubleType);

		if (_Type != null) {
			_Type.apply(this, arguments);
		}
	}

	_inherits(DoubleType, _Type);

	_createClass(DoubleType, {
		_serialize: {
			value: function _serialize(value) {
				return Number(value);
			}
		},
		_deserialize: {
			value: function _deserialize(value) {
				return value;
			}
		}
	}, {
		toString: {
			value: function toString() {
				return "Double";
			}
		},
		getDbType: {
			value: function getDbType(options) {
				return "DOUBLE";
			}
		}
	});

	return DoubleType;
})(Type);

module.exports = DoubleType;