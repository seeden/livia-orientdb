'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _RID2 = require('./RID');

var _RID3 = _interopRequireWildcard(_RID2);

var _import = require('lodash');

var _import2 = _interopRequireWildcard(_import);

var _Document = require('livia');

var Linked = (function (_RID) {
	function Linked() {
		_classCallCheck(this, Linked);

		if (_RID != null) {
			_RID.apply(this, arguments);
		}
	}

	_inherits(Linked, _RID);

	_createClass(Linked, [{
		key: '_serialize',
		value: function _serialize(value) {
			if (_import2['default'].isPlainObject(value)) {
				var doc = this._value = this._value instanceof _Document.Document ? this._value : new this.options.type({});

				doc.set(value);
				return doc;
			}

			return _get(Object.getPrototypeOf(Linked.prototype), '_serialize', this).call(this, value);
		}
	}, {
		key: 'toJSON',
		value: function toJSON(options) {
			var value = this.value;
			if (value instanceof _Document.Document) {
				return value.toJSON(options);
			}

			return _get(Object.getPrototypeOf(Linked.prototype), 'toJSON', this).call(this, options);
		}
	}, {
		key: 'toObject',
		value: function toObject(options) {
			var value = this.value;
			if (value instanceof _Document.Document) {
				return value.toObject(options);
			}

			return _get(Object.getPrototypeOf(Linked.prototype), 'toObject', this).call(this, options);
		}
	}, {
		key: 'isModified',
		get: function () {
			if (this._value instanceof _Document.Document) {
				var isModified = false;

				this._value.forEach(true, function (prop) {
					if (prop.isModified) {
						isModified = true;
					}
				});

				return isModified;
			}

			return _get(Object.getPrototypeOf(Linked.prototype), 'isModified', this);
		}
	}, {
		key: 'linkedClass',
		get: function () {
			var type = this.options.type;
			return type.modelName ? type.modelName : null;
		}
	}]);

	return Linked;
})(_RID3['default']);

exports['default'] = Linked;
;
module.exports = exports['default'];