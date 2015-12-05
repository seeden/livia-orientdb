import { Adapter, Model, Index } from 'livia';
import Query from './Query';
import orientjs from 'orientjs';
import { waterfall, each } from 'async';
import debug from 'debug';

const log = debug('livia-orientdb:adapter');

export default class OrientDBAdapter extends Adapter {
  constructor(options, dbOptions) {
    super(options);

    this._dbOptions = typeof dbOptions === 'string'
      ? { name: dbOptions }
      : dbOptions;
  }

  get dbOptions() {
    return this._dbOptions;
  }

  createConnection(callback) {
    const server = orientjs(this.options);
    const db = server.use(this.dbOptions);

    callback(null, db);
  }

  query(model, options) {
    return new Query(model, options);
  }

  getIndexType(options) {
    let type = options.unique ? 'UNIQUE' : 'NOTUNIQUE';

    if (options.type === Index.DICTIONARY) {
      type = 'DICTIONARY';
    } else if (options.type === Index.FULLTEXT) {
      if (options.engine === 'lucene') {
        return 'FULLTEXT ENGINE LUCENE';
      }

      type = 'FULLTEXT';
    } else if (options.type === Index.SPATIAL) {
      return 'SPATIAL ENGINE LUCENE';
    }

    if (options.hash) {
      type += '_HASH_INDEX';
    }

    return type;
  }

  ensureIndex(model, OClass, callback) {
    const adapter = this;
    const db = this.native;
    const className = model.name;
    const schema = model.schema;

    waterfall([
      (cb) => {
        // todo speed up for each class is same
        db.index.list(true).then((indexes) => {
          // filter indexes for current class
          const filteredIndexes = indexes.filter((index) => {
            const def = index.definition;
            if (!def || def.className !== className) {
              return false;
            }

            return true;
          });

          cb(null, filteredIndexes);
        }, cb);
      },
      // remove unused indexes
      (indexes, cb) => {
        if (!model.options.dropUnusedIndexes) {
          return cb(null, indexes);
        }

        each(indexes, (index, cb2) => {
          const { name } = index;

          let schemaIndexName = name;
          const indexStartName = className + '.';
          if (schemaIndexName.indexOf(indexStartName) === 0 ) {
            schemaIndexName = schemaIndexName.substr(indexStartName.length);
          }

          if (schema.hasIndex(schemaIndexName)) {
            return cb2(null);
          }

          log('Deleting unused index: ' + name);

          db.index.drop(name).then(() => {
            cb2(null);
          }, cb2);
        }, (err) => {
          if (err) {
            return cb(err);
          }

          cb(null, indexes);
        });
      },
      // add non exists indexes
      (indexes, cb) => {
        const configs = [];

        each(schema.indexNames, (orientIndexName, cb3) => {
          const index = schema.getIndex(orientIndexName);

          // add class name to indexName
          const indexName = className + '.' + orientIndexName;

          const oIndex = indexes.find((index2) => {
            return index2.name === indexName;
          });

          if (oIndex) {
            return cb3(null);
          }

          let canCreate = true;
          Object.keys(index.properties).forEach((name) => {
            if (name.indexOf('.') !== -1) {
              canCreate = false;
            }

            log('Index for subschemas is not supported yet: ' + name);
          });

          if (!canCreate) {
            return cb3(null);
          }

          log('Creating index: ' + indexName);

          const config = {
            'class': className,
            name: indexName,
            properties: Object.keys(index.properties),
            type: adapter.getIndexType(index),
            metadata: index.metadata,
          };

          configs.push(config);

          db.index.create(config).then(() => {
            cb3(null);
          }, cb3);
        }, (err) => {
          if (err) {
            return cb(err);
          }

          cb(null, indexes);
        });
      },
    ], callback);
  }

  ensureClass(model, callback = () => {}) {
    const db = this.native;
    const schema = model.schema;
    const className = model.name;

    waterfall([
      // prepare base class
      (cb) => {
        db.class.get(className).then((OClass) => {
          cb(null, OClass);
        }, () => {
          db.class.create(className, schema.extendClassName, model.options.cluster, model.options.abstract).then((OClass) => {
            cb(null, OClass);
          }, cb);
        });
      },
      // retrive a current properties
      (OClass, cb) => {
        OClass.property.list().then((properties) => {
          cb(null, OClass, properties);
        }, cb);
      },
      // drop unused properties
      (OClass, oProperties, cb) => {
        if (!model.options.dropUnusedProperties) {
          return cb(null, OClass, oProperties);
        }

        each(oProperties, (prop, cb2) => {
          if (schema.has(prop.name)) {
            return cb2(null);
          }

          OClass.property.drop(prop.name).then(() => {
            cb2(null);
          }, cb2);
        }, (err) => {
          if (err) {
            return cb(err);
          }

          cb(null, OClass, oProperties);
        });
      },
      // add new properties
      (OClass, oProperties, cb) => {
        const properties = schema.propertyNames();

        each(properties, (propName, cb2) => {
          const prop = oProperties.find((p) => {
            return p.name === propName;
          });

          if (prop) {
            return cb2(null);
          }

          const schemaProp = schema.getPath(propName);
          const SchemaType = schema.getSchemaType(propName);

          const type = SchemaType.getDbType(schemaProp);

          if (schemaProp.options.metadata || schemaProp.options.ensure === false) {
            return cb2(null);
          }

          waterfall([
            // create LinkedClass for embedded documents
            (cb3) => {
              if (!SchemaType.isAbstract(schemaProp)) {
                return cb3(null, null);
              }

              const abstractClassName = SchemaType.computeAbstractClassName(className, propName);
              const embeddedSchema = SchemaType.getEmbeddedSchema(schemaProp);

              log(`Founded abstract class: ${abstractClassName} with schema: ` + !!embeddedSchema);

              if (!abstractClassName || !embeddedSchema) {
                return cb3(null, null);
              }

              return new Model(abstractClassName, embeddedSchema, model.connection, {
                'abstract': true,
              }, cb3);
            }, (model2, cb3) => {
              const options = schemaProp.options;
              const additionalConfig = SchemaType.getPropertyConfig(schemaProp);

              const config = {
                name: propName,
                type,
                mandatory: options.mandatory || options.required || false,
                min: typeof options.min !== 'undefined' ? options.min : null,
                max: typeof options.max !== 'undefined' ? options.max : null,
                collate: options.collate || 'default',
                notNull: options.notNull || false,
                readonly: options.readonly || false,
                ...additionalConfig,
              };

              if (model2) {
                config.linkedClass = model2.name;
              }

              if (config.linkedType && config.linkedClass) {
                delete config.linkedType;
              }

              OClass.property.create(config).then((oProperty) => {
                oProperties.push(oProperty);
                cb3(null);
              }, cb3);
            },
          ], cb2);
        }, (err) => {
          if (err) {
            return cb(err);
          }

          cb(null, OClass, oProperties);
        });
      },
      (OClass, oProperties, cb) => {
        this.ensureIndex(model, OClass, cb);
      },
    ], (err) => {
      if (err) {
        return callback(err);
      }

      callback(null, model);
    });
  }
}
