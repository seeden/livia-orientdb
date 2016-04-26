'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _livia = require('livia');

var _Query = require('./Query');

var _Query2 = _interopRequireDefault(_Query);

var _orientjs = require('orientjs');

var _orientjs2 = _interopRequireDefault(_orientjs);

var _async = require('async');

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _constantsCollate = require('./constants/Collate');

var _constantsCollate2 = _interopRequireDefault(_constantsCollate);

var log = (0, _debug2['default'])('livia-orientdb:adapter');

var OrientDBAdapter = (function (_Adapter) {
  _inherits(OrientDBAdapter, _Adapter);

  function OrientDBAdapter(options, dbOptions) {
    _classCallCheck(this, OrientDBAdapter);

    _get(Object.getPrototypeOf(OrientDBAdapter.prototype), 'constructor', this).call(this, options);

    this._dbOptions = typeof dbOptions === 'string' ? { name: dbOptions } : dbOptions;
  }

  _createClass(OrientDBAdapter, [{
    key: 'createConnection',
    value: function createConnection(callback) {
      var server = (0, _orientjs2['default'])(this.options);
      var db = server.use(this.dbOptions);

      callback(null, db);
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

      if (options.type === _livia.Index.DICTIONARY) {
        type = 'DICTIONARY';
      } else if (options.type === _livia.Index.FULLTEXT) {
        if (options.engine === 'lucene') {
          return 'FULLTEXT ENGINE LUCENE';
        }

        type = 'FULLTEXT';
      } else if (options.type === _livia.Index.SPATIAL) {
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

      (0, _async.waterfall)([function (cb) {
        // todo speed up for each class is same
        db.index.list(true).then(function (indexes) {
          // filter indexes for current class
          var filteredIndexes = indexes.filter(function (index) {
            var def = index.definition;
            if (!def || def.className !== className) {
              return false;
            }

            return true;
          });

          cb(null, filteredIndexes);
        }, cb);
      },
      // remove unused indexes
      function (indexes, cb) {
        if (!model.options.dropUnusedIndexes) {
          return cb(null, indexes);
        }

        (0, _async.each)(indexes, function (index, cb2) {
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

        (0, _async.each)(schema.indexNames, function (orientIndexName, cb3) {
          var index = schema.getIndex(orientIndexName);

          // add class name to indexName
          var indexName = className + '.' + orientIndexName;

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
            type: adapter.getIndexType(index),
            metadata: index.metadata
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

      var callback = arguments.length <= 1 || arguments[1] === undefined ? function () {} : arguments[1];

      var db = this.native;
      var schema = model.schema;
      var className = model.name;

      (0, _async.waterfall)([
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

        (0, _async.each)(oProperties, function (prop, cb2) {
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

        (0, _async.each)(properties, function (propName, cb2) {
          var prop = oProperties.find(function (p) {
            return p.name === propName;
          });

          if (prop) {
            return cb2(null);
          }

          var schemaProp = schema.getPath(propName);
          var SchemaType = schema.getSchemaType(propName);
          if (SchemaType === _livia.Types.Mixed) {
            return cb2(null);
          }

          var type = SchemaType.getDbType(schemaProp);

          if (schemaProp.options.metadata || schemaProp.options.ensure === false) {
            return cb2(null);
          }

          (0, _async.waterfall)([
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

            return new _livia.Model(abstractClassName, embeddedSchema, model.connection, {
              'abstract': true
            }, cb3);
          }, function (model2, cb3) {
            var options = schemaProp.options;
            var additionalConfig = SchemaType.getPropertyConfig(schemaProp);

            var config = _extends({
              name: propName,
              type: type,
              mandatory: options.mandatory || options.required || false,
              min: typeof options.min !== 'undefined' ? options.min : null,
              max: typeof options.max !== 'undefined' ? options.max : null,
              collate: options.collate || _constantsCollate2['default'].DEFAULT,
              notNull: options.notNull || false,
              readonly: options.readonly || false
            }, additionalConfig);

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
  }, {
    key: 'dbOptions',
    get: function get() {
      return this._dbOptions;
    }
  }]);

  return OrientDBAdapter;
})(_livia.Adapter);

exports['default'] = OrientDBAdapter;
module.exports = exports['default'];