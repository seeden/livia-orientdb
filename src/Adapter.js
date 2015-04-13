import _ from 'lodash';
import { Adapter } from 'livia';
import Query from './Query';

export default class OrientDBAdapter extends Adapter {
	query (model, options) {
		return new Query(model, options);
	}

	ensureIndex(model, OClass, callback) {
		var db = model.db;
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
						type       : index.type
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
		var db = model.db;
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

			callback(null, this);
		});
	}
};