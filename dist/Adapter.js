'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Adapter$Model$Index = require('livia');

var _Query = require('./Query');

var _Query2 = _interopRequireWildcard(_Query);

var _orientjs = require('orientjs');

var _orientjs2 = _interopRequireWildcard(_orientjs);

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
      dbOptions = {
        name: dbOptions
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
    key: 'native',
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
      this._server = _orientjs2['default'](this.options);
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

      if (options.type === _Adapter$Model$Index.Index.DICTIONARY) {
        type = 'DICTIONARY';
      } else if (options.type === _Adapter$Model$Index.Index.FULLTEXT) {
        if (options.engine === 'lucene') {
          return 'FULLTEXT ENGINE LUCENE';
        }

        type = 'FULLTEXT';
      } else if (options.type === _Adapter$Model$Index.Index.SPATIAL) {
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
      var db = this.native;
      var className = model.name;
      var schema = model.schema;

      _waterfall$each.waterfall([function (cb) {
        // todo speed up for each class is same
        db.index.list(true).then(function (indexes) {
          // filter indexes for current class
          indexes = indexes.filter(function (index) {
            var def = index.definition;
            if (!def || def.className !== className) {
              return false;
            }

            return true;
          });

          cb(null, indexes);
        }, cb);
      },
      // remove unused indexes
      function (indexes, cb) {
        if (!model.options.dropUnusedIndexes) {
          return cb(null, indexes);
        }

        _waterfall$each.each(indexes, function (index, cb2) {
          var name = index.name;

          var schemaIndexName = name;
          var indexStartName = className + '.';
          if (schemaIndexName.indexOf(indexStartName) === 0) {
            schemaIndexName = schemaIndexName.substr(indexStartName.length);
          }

          if (schema.hasIndex(schemaIndexName)) {
            return cb2(null);
          }

          log('Deleting unused index: ' + name);

          db.index.drop(name).then(function () {
            cb2(null);
          }, cb2);
        }, function (err) {
          if (err) {
            return cb(err);
          }

          cb(null, indexes);
        });
      },
      // add non exists indexes
      function (indexes, cb) {
        var configs = [];

        _waterfall$each.each(schema.indexNames, function (indexName, cb3) {
          var index = schema.getIndex(indexName);

          // add class name to indexName
          indexName = className + '.' + indexName;

          var oIndex = indexes.find(function (index2) {
            return index2.name === indexName;
          });

          if (oIndex) {
            return cb3(null);
          }

          var canCreate = true;
          Object.keys(index.properties).forEach(function (name) {
            if (name.indexOf('.') !== -1) {
              canCreate = false;
            }

            log('Index for subschemas is not supported yet: ' + name);
          });

          if (!canCreate) {
            return cb3(null);
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
            cb3(null);
          }, cb3);
        }, function (err) {
          if (err) {
            return cb(err);
          }

          cb(null, indexes);
        });
      }], callback);
    }
  }, {
    key: 'ensureClass',
    value: function ensureClass(model) {
      var _this = this;

      var callback = arguments[1] === undefined ? function () {} : arguments[1];

      var db = this.native;
      var schema = model.schema;
      var className = model.name;

      _waterfall$each.waterfall([
      // prepare base class
      function (cb) {
        db['class'].get(className).then(function (OClass) {
          cb(null, OClass);
        }, function () {
          db['class'].create(className, schema.extendClassName, model.options.cluster, model.options.abstract).then(function (OClass) {
            cb(null, OClass);
          }, cb);
        });
      },
      // retrive a current properties
      function (OClass, cb) {
        OClass.property.list().then(function (properties) {
          cb(null, OClass, properties);
        }, cb);
      },
      // drop unused properties
      function (OClass, oProperties, cb) {
        if (!model.options.dropUnusedProperties) {
          return cb(null, OClass, oProperties);
        }

        _waterfall$each.each(oProperties, function (prop, cb2) {
          if (schema.has(prop.name)) {
            return cb2(null);
          }

          OClass.property.drop(prop.name).then(function () {
            cb2(null);
          }, cb2);
        }, function (err) {
          if (err) {
            return cb(err);
          }

          cb(null, OClass, oProperties);
        });
      },
      // add new properties
      function (OClass, oProperties, cb) {
        var properties = schema.propertyNames();

        _waterfall$each.each(properties, function (propName, cb2) {
          var prop = oProperties.find(function (p) {
            return p.name === propName;
          });

          if (prop) {
            return cb2(null);
          }

          var schemaProp = schema.getPath(propName);
          var SchemaType = schema.getSchemaType(propName);
          var type = SchemaType.getDbType(schemaProp);

          if (schemaProp.options.metadata || schemaProp.options.ensure === false) {
            return cb2(null);
          }

          _waterfall$each.waterfall([
          // create LinkedClass for embedded documents
          function (cb3) {
            if (!SchemaType.isAbstract(schemaProp)) {
              return cb3(null, null);
            }

            var abstractClassName = SchemaType.computeAbstractClassName(className, propName);
            var embeddedSchema = SchemaType.getEmbeddedSchema(schemaProp);

            log('Founded abstract class: ' + abstractClassName + ' with schema: ' + !!embeddedSchema);

            if (!abstractClassName || !embeddedSchema) {
              return cb3(null, null);
            }

            return new _Adapter$Model$Index.Model(abstractClassName, embeddedSchema, model.connection, {
              abstract: true
            }, cb3);
          }, function (model2, cb3) {
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

            var additionalConfig = SchemaType.getPropertyConfig(schemaProp);
            _extend2['default'](config, additionalConfig);

            if (model2) {
              config.linkedClass = model2.name;
            }

            if (config.linkedType && config.linkedClass) {
              delete config.linkedType;
            }

            OClass.property.create(config).then(function (oProperty) {
              oProperties.push(oProperty);
              cb3(null);
            }, cb3);
          }], cb2);
        }, function (err) {
          if (err) {
            return cb(err);
          }

          cb(null, OClass, oProperties);
        });
      }, function (OClass, oProperties, cb) {
        _this.ensureIndex(model, OClass, cb);
      }], function (err) {
        if (err) {
          return callback(err);
        }

        callback(null, model);
      });
    }
  }]);

  return OrientDBAdapter;
})(_Adapter$Model$Index.Adapter);

exports['default'] = OrientDBAdapter;
module.exports = exports['default'];