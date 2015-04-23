'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _import = require('lodash');

var _import2 = _interopRequireWildcard(_import);

var _Adapter$Model$Index$Type = require('livia');

var _Query = require('./Query');

var _Query2 = _interopRequireWildcard(_Query);

var _Oriento = require('oriento');

var _Oriento2 = _interopRequireWildcard(_Oriento);

var _waterfall$each = require('async');

var _extend = require('node.extend');

var _extend2 = _interopRequireWildcard(_extend);

var _debug = require('debug');

var _debug2 = _interopRequireWildcard(_debug);

var log = _debug2['default']('livia-orientdb:adapter');

var OrientDBAdapter = (function (_Adapter) {
	function OrientDBAdapter(options, dbOptions) {
		_classCallCheck(this, OrientDBAdapter);

		_get(Object.getPrototypeOf(OrientDBAdapter.prototype), 'constructor', this).call(this, options);

		if (typeof dbOptions === 'string') {
			var dbName = dbOptions;
			dbOptions = {
				name: dbName
			};
		}

		this._dbOptions = dbOptions;
	}

	_inherits(OrientDBAdapter, _Adapter);

	_createClass(OrientDBAdapter, [{
		key: 'dbOptions',
		get: function () {
			return this._dbOptions;
		}
	}, {
		key: 'db',
		get: function () {
			return this._db;
		}
	}, {
		key: 'server',
		get: function () {
			return this._server;
		}
	}, {
		key: 'connect',
		value: function connect(callback) {
			this._server = _Oriento2['default'](this.options);
			this._db = this._server.use(this.dbOptions);

			callback();
		}
	}, {
		key: 'query',
		value: function query(model, options) {
			return new _Query2['default'](model, options);
		}
	}, {
		key: 'getIndexType',
		value: function getIndexType(options) {
			var type = options.unique ? 'UNIQUE' : 'NOTUNIQUE';

			if (options.type === _Adapter$Model$Index$Type.Index.DICTIONARY) {
				type = 'DICTIONARY';
			} else if (options.type === _Adapter$Model$Index$Type.Index.FULLTEXT) {
				if (options.engine === 'lucene') {
					return 'FULLTEXT ENGINE LUCENE';
				}

				type = 'FULLTEXT';
			} else if (options.type === _Adapter$Model$Index$Type.Index.SPATIAL) {
				return 'SPATIAL ENGINE LUCENE';
			}

			if (options.hash) {
				type += '_HASH_INDEX';
			}

			return type;
		}
	}, {
		key: 'ensureIndex',
		value: function ensureIndex(model, OClass, callback) {
			var adapter = this;
			var db = this.db;
			var className = model.name;
			var schema = model.schema;

			_waterfall$each.waterfall([function (callback) {
				//todo speeed up for each class is same
				db.index.list(true).then(function (indexes) {
					//filter indexes for current class
					indexes = indexes.filter(function (index) {
						var def = index.definition;
						if (!def || def.className !== className) {
							return false;
						}

						return true;
					});

					callback(null, indexes);
				}, callback);
			},
			//remove unused indexes
			function (indexes, callback) {
				if (!model.options.dropUnusedIndexes) {
					return callback(null, indexes);
				}

				_waterfall$each.each(indexes, function (index, callback) {
					var definition = index.definition;
					var type = index.type;
					var name = index.name;

					var schemaIndexName = name;
					var indexStartName = className + '.';
					if (schemaIndexName.indexOf(indexStartName) === 0) {
						schemaIndexName = schemaIndexName.substr(indexStartName.length);
					}

					if (schema.hasIndex(schemaIndexName)) {
						return callback(null);
					}

					log('Deleting unused index: ' + name);

					db.index.drop(name).then(function (droped) {
						callback(null);
					}, callback);
				}, function (err) {
					if (err) {
						return callback(err);
					}

					callback(null, indexes);
				});
			},
			//add non exists indexes
			function (indexes, callback) {
				var configs = [];

				_waterfall$each.each(schema.indexNames, function (indexName, callback) {
					var index = schema.getIndex(indexName);

					//add class name to indexName
					indexName = className + '.' + indexName;

					var oIndex = indexes.find(function (index) {
						return index.name === indexName;
					});

					if (oIndex) {
						return callback(null);
					}

					log('Creating index: ' + indexName);

					var config = {
						'class': className,
						name: indexName,
						properties: Object.keys(index.properties),
						type: adapter.getIndexType(index)
					};

					configs.push(config);

					db.index.create(config).then(function () {
						callback(null);
					}, callback);
				}, function (err) {
					if (err) {
						return callback(err);
					}

					callback(null, indexes);
				});
			}], callback);
		}
	}, {
		key: 'ensureClass',
		value: function ensureClass(model, callback) {
			var _this = this;

			var db = this.db;
			var schema = model.schema;
			var className = model.name;

			callback = callback || function () {};

			_waterfall$each.waterfall([
			//prepare base class
			function (callback) {
				db['class'].get(className).then(function (OClass) {
					callback(null, OClass);
				}, function (err) {
					db['class'].create(className, schema.extendClassName, model.options.cluster, model.options.abstract).then(function (OClass) {
						callback(null, OClass);
					}, callback);
				});
			},
			//retrive a current properties
			function (OClass, callback) {
				OClass.property.list().then(function (properties) {
					callback(null, OClass, properties);
				}, callback);
			},
			//drop unused properties
			function (OClass, oProperties, callback) {
				if (!model.options.dropUnusedProperties) {
					return callback(null, OClass, oProperties);
				}

				_waterfall$each.each(oProperties, function (prop, callback) {
					if (schema.has(prop.name)) {
						return callback(null);
					}

					OClass.property.drop(prop.name).then(function () {
						callback(null);
					}, callback);
				}, function (err) {
					if (err) {
						return callback(err);
					}

					callback(null, OClass, oProperties);
				});
			},
			//add new properties
			function (OClass, oProperties, callback) {
				var properties = schema.propertyNames();

				_waterfall$each.each(properties, function (propName, callback) {
					var prop = oProperties.find(function (p) {
						return p.name === propName;
					});

					if (prop) {
						return callback(null);
					}

					var schemaProp = schema.getPath(propName);
					var schemaType = schema.getSchemaType(propName);
					var type = schemaType.getDbType(schemaProp);

					if (schemaProp.options.metadata || schemaProp.options.ensure === false) {
						return callback(null);
					}

					_waterfall$each.waterfall([
					//create LinkedClass for embedded documents
					function (callback) {
						if (!schemaType.isAbstract(schemaProp)) {
							return callback(null, null);
						}

						var abstractClassName = schemaType.computeAbstractClassName(className, propName);
						var embeddedSchema = schemaType.getEmbeddedSchema(schemaProp);

						log('Founded abstract class: ' + abstractClassName + ' with schema: ' + !!embeddedSchema);

						if (!abstractClassName || !embeddedSchema) {
							return callback(null, null);
						}

						return new _Adapter$Model$Index$Type.Model(abstractClassName, embeddedSchema, model.connection, {
							abstract: true
						}, callback);
					}, function (model, callback) {
						var options = schemaProp.options;

						var config = {
							name: propName,
							type: type,
							mandatory: options.mandatory || options.required || false,
							min: typeof options.min !== 'undefined' ? options.min : null,
							max: typeof options.max !== 'undefined' ? options.max : null,
							collate: options.collate || 'default',
							notNull: options.notNull || false,
							readonly: options.readonly || false
						};

						var additionalConfig = schemaType.getPropertyConfig(schemaProp);
						_extend2['default'](config, additionalConfig);

						if (model) {
							config.linkedClass = model.name;
						}

						if (config.linkedType && config.linkedClass) {
							delete config.linkedType;
						}

						OClass.property.create(config).then(function (oProperty) {
							oProperties.push(oProperty);
							callback(null);
						}, callback);
					}], callback);
				}, function (err) {
					if (err) {
						return callback(err);
					}

					callback(null, OClass, oProperties);
				});
			}, function (OClass, oProperties, callback) {
				_this.ensureIndex(model, OClass, callback);
			}], function (err) {
				if (err) {
					return callback(err);
				}

				callback(null, model);
			});
		}
	}]);

	return OrientDBAdapter;
})(_Adapter$Model$Index$Type.Adapter);

exports['default'] = OrientDBAdapter;
;
module.exports = exports['default'];