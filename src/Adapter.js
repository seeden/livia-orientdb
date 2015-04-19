import _ from 'lodash';
import { Adapter, Model, Index } from 'livia';
import Query from './Query';
import Oriento from 'oriento';
import { waterfall, each } from 'async';
import extend from 'node.extend';
import debug from 'debug';

const log = debug('livia-orientdb:adapter');

export default class OrientDBAdapter extends Adapter {
	constructor(options, dbOptions) {
		super(options);

		if(typeof dbOptions === 'string') {
			var dbName = dbOptions;
			dbOptions = {
				name: dbName
			};
		}

		this._dbOptions = dbOptions;
	}

	get dbOptions() {
		return this._dbOptions;
	}

	get db() {
		return this._db;
	}

	get server() {
		return this._server;
	}	

	connect(callback) {
		this._server = Oriento(this.options);
		this._db = this._server.use(this.dbOptions);

		callback();
	}

	query (model, options) {
		return new Query(model, options);
	}

	getIndexType(options) {
		var type = options.unique ? 'UNIQUE' : 'NOTUNIQUE';

		if(options.type === Index.DICTIONARY) {
			type = 'DICTIONARY';
		} else if(options.type === Index.FULLTEXT) {
			if(options.lucene) {
				return 'FULLTEXT ENGINE LUCENE';
			}

			type = 'FULLTEXT';
		} else if(options.type === Index.SPATIAL) {
			return 'SPATIAL ENGINE LUCENE';
		} 

		if(options.hash) {
			type += '_HASH_INDEX';
		}

		return type;
	}

	ensureIndex(model, OClass, callback) {
		var adapter = this;
		var db = this.db;
		var className = model.name;
		var schema = model.schema;

		waterfall([
			function(callback) {
				//todo speeed up for each class is same
				db.index.list(true).then(function(indexes) {
					//filter indexes for current class
					indexes = indexes.filter(function(index) {
						var def = index.definition;
						if(!def || def.className !== className) {
							return false;
						}

						return true;
					});

					callback(null, indexes);
				}, callback);
			}, 
			//remove unused indexes
			function(indexes, callback) {
				if(!model.options.dropUnusedIndexes) {
					return callback(null, indexes);
				}

				each(indexes, function(index, callback) {
					var { definition, type, name } = index;

					var schemaIndexName = name;
					var indexStartName = className + '.';
					if(schemaIndexName.indexOf(indexStartName) === 0 ) {
						schemaIndexName = schemaIndexName.substr(indexStartName.length);
					}

					if(schema.hasIndex(schemaIndexName)) {
						return callback(null);
					}

					log('Deleting unused index: ' + name);

					db.index.drop(name).then(function(droped) {
						callback(null);
					}, callback);
				}, function(err) {
					if(err) {
						return callback(err);
					}

					callback(null, indexes);
				});
			},
			//add non exists indexes
			function(indexes, callback) {
				var configs = [];

				each(schema.indexNames, function(indexName, callback) {
					var index = schema.getIndex(indexName);

					//add class name to indexName
					indexName = className + '.' + indexName;

					var oIndex = indexes.find(function(index) {
						return index.name === indexName;
					});

					if(oIndex) {
						return callback(null);
					}

					log('Creating index: ' + indexName);

					var config = {
						'class'    : className, 
						name       : indexName,
						properties : Object.keys(index.properties),
						type       : adapter.getIndexType(index)
					};

					configs.push(config);

					db.index.create(config).then(function() {
						callback(null);
					}, callback);
				}, function(err) {
					if(err) {
						return callback(err);
					}

					callback(null, indexes);
				});
			},			
		], callback);
	}

	ensureClass(model, callback) {
		var db = this.db;
		var schema = model.schema;
		var className = model.name;

		callback = callback || function() {};

		waterfall([
			//prepare base class
			function(callback) {
				db.class.get(className).then(function(OClass) {
					callback(null, OClass);
				}, function(err) {
					db.class.create(className, schema.extendClassName, model.options.cluster, model.options.abstract).then(function(OClass) {
						callback(null, OClass);
					}, callback);
				});
			},
			//retrive a current properties
			function(OClass, callback) {
				OClass.property.list().then(function(properties) {
					callback(null, OClass, properties);
				}, callback);
			},
			//drop unused properties
			function(OClass, oProperties, callback) {
				if(!model.options.dropUnusedProperties) {
					return callback(null, OClass, oProperties);
				}

				each(oProperties, function(prop, callback) {
					if(schema.has(prop.name)) {
						return callback(null);
					}

					OClass.property.drop(prop.name).then(function() {
						callback(null);
					}, callback);
				}, function(err) {
					if(err) {
						return callback(err);
					}

					callback(null, OClass, oProperties);
				});
			},
			//add new properties
			function(OClass, oProperties, callback) {
				var properties = schema.propertyNames();

				each(properties, function(propName, callback) {
					var prop = oProperties.find(function(p) {
						return p.name === propName;
					});

					if(prop)  {
						return callback(null);
					}

					var schemaProp = schema.getPath(propName);
					var schemaType = schema.getSchemaType(propName);
					var type = schemaType.getDbType(schemaProp.options);

					if(schemaProp.options.metadata || schemaProp.options.ensure === false) {
						return callback(null);
					}

					waterfall([
						//create LinkedClass for embedded documents
						function(callback) { 
							if(type === 'EMBEDDED' && schemaType.isObject) {
								var modelName = className + 'A' + _.capitalize(propName);

								return new Model(modelName, schemaProp.type, model.connection, {
									abstract: true
								}, callback);
							} else if(type === 'EMBEDDEDLIST' && schemaType.isArray && schemaProp.item) {
								var item = schemaProp.item;
								if(item.schemaType.isObject) {
									var modelName = className + 'A' + _.capitalize(propName);

									return new Model(modelName, item.type, model.connection, {
										abstract: true
									}, callback);
								}
							}

							if(schemaProp.options.type.currentModel) {
								return callback(null, schemaProp.options.type.currentModel);
							}

							callback(null, null);
						}, function(model, callback) {
							var options = schemaProp.options;

							var config = {
								name: propName,
								type: type,
								mandatory: options.mandatory || options.required || false,
								min: typeof options.min !== 'undefined' ? options.min : null,
								max: typeof options.max !== 'undefined' ? options.max : null,
								collate: options.collate || 'default',
								notNull: options.notNull || false,
								readonly : options.readonly  || false
							};

							var additionalConfig = schemaType.getPropertyConfig(schemaProp);
							extend(config, additionalConfig);

							if(model) {
								config.linkedClass = model.name;
							}

							if(config.linkedType && config.linkedClass) {
								delete config.linkedType;
							}

							OClass.property.create(config).then(function(oProperty) {
								oProperties.push(oProperty);
								callback(null);
							}, callback);
						}
					], callback);
				}, function(err) {
					if(err) {
						return callback(err);
					}

					callback(null, OClass, oProperties);
				});
			},
			(OClass, oProperties, callback) => {
				this.ensureIndex(model, OClass, callback);
			}
		], (err) => {
			if(err) {
				return callback(err);
			}

			callback(null, model);
		});
	}
};