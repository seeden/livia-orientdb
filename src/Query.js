import { Query, Schema, Document } from 'livia';
import OrientjsQuery from 'orientjs/lib/db/query';
import debug from 'debug';
import _ from 'lodash';

const log = debug('livia-orientdb:query');
const Operation = Query.Operation;

function stripslashes(str) {
  return (str + '')
    .replace(/\\(.?)/g, function(s, n1) {
      switch (n1) {
        case '\\':
          return '\\';
        case '0':
          return '\u0000';
        case '':
          return '';
        default:
          return n1;
      }
    });
}

export default class OrientDBQuery extends Query {
  constructor(model) {
    super(model);

    this._increment = [];
    this._addToSet = [];
  }

  prepareValue(value) {
    if (value && value instanceof Document && value.get('@rid')) {
      return value.get('@rid');
    }

    return super.prepareValue(value);
  }

  scalar(useScalar, castFn) {
    if (typeof castFn === 'undefined') {
      castFn = Number;
    }

    return super.scalar(useScalar, castFn);
  }

  options(options = {}) {
    if (options.new) {
      options.return = 'AFTER @this';
      delete options['new'];

      if (options.upsert) {
        options.scalar = false;
        options.first = true;
      }
    }

    return super.options(options);
  }

  increment(prop, value) {
    this._increment.push({ prop, value });
  }

  addToSet(prop, value) {
    this._addToSet.push({ prop, value });
  }

  set(doc) {
    if (doc.$inc) {
      const inc = doc.$inc;
      delete doc.$inc;

      Object.keys(inc).forEach((propName) => {
        this.increment(propName, inc[propName]);
      });
    }

    if (doc.$addToSet) {
      const addToSet = doc.$addToSet;
      delete doc.$addToSet;

      Object.keys(addToSet).forEach((propName) => {
        this.addToSet(propName, addToSet[propName]);
      });
    }

    return super.set(doc);
  }

  // fix contains for collections
  queryLanguage(conditions, parentPath) {
    const model = this.model;

    if (typeof !model === 'undefined') {
      return super.queryLanguage(conditions, parentPath);
    }

    const schema = model.schema;

    Object.keys(conditions).forEach(propertyName => {
      const pos = propertyName.indexOf('.');
      if (pos === -1) {
        return;
      }

      const value = conditions[propertyName];
      const parent = propertyName.substr(0, pos);
      const child = propertyName.substr(pos + 1);

      const currentPath = parentPath
        ? parentPath + '.' + parent
        : parent;

      const prop = schema.getPath(currentPath);
      if (!prop || !prop.SchemaType || !prop.SchemaType.isArray) {
        return;
      }

      // replace condition
      delete conditions[propertyName];

      let subConditions = conditions[parent] || {};
      if (!_.isPlainObject(subConditions)) {
        subConditions = {
          $eq: subConditions
        };
      }

      if (!subConditions.$contains) {
        subConditions.$contains = {};
      }

      if (subConditions.$contains[child]) {
        throw new Error(`Condition already exists for ${child}`);
      }

      subConditions.$contains[child] = value;

      conditions[parent] = subConditions;
    });

    return super.queryLanguage(conditions, parentPath);
  }

  fixRecord(record) {
    const options = this.model.connection.adapter.options;
    if (options.fixEmbeddedEscape) {
      record = this.fixEmbeddedEscape(record);
    }

    return record;
  }

  fixEmbeddedEscape(record, isChild) {
    if (!_.isObject(record)) {
      return record;
    }

    Object.keys(record).forEach(key => {
      const value = record[key];

      if (_.isObject(value)) {
        record[key] = this.fixEmbeddedEscape(value, true);
        return;
      }

      if (typeof value === 'string' && isChild) {
        record[key] = stripslashes(value);
      }
    });

    return record;
  }

  native() {
    return new OrientjsQuery(this.model.native);
  }

  exec(callback = function() {}) {
    const model = this.model;
    const schema = model.schema;
    const operation = this._operation;
    if (!operation) {
      throw new Error('Operation is not defined');
    }

    let query = this.native();
    const q = query;

    let target = this._target;
    if (target instanceof Document) {
      target = target.get('@rid');
      if (!target) {
        throw new Error('Target is document but his RID is not defined');
      }
    }

    const select = this._select || '*';

    const isGraph = schema instanceof Schema.Graph;
    if (isGraph) {
      const graphType = schema instanceof Schema.Edge ? 'EDGE' : 'VERTEX';

      if (operation === Operation.INSERT) {
        query = query.create(graphType, target);
      } else if (operation === Operation.DELETE) {
        query = query.delete(graphType, target);
      } else if (operation === Operation.SELECT) {
        query = query.select(select).from(target);
      } else {
        query = query.update(target);
      }
    } else {
      if (operation === Operation.INSERT) {
        query = query.insert().into(target);
      } else if (operation === Operation.DELETE) {
        query = query.delete().from(target);
      } else if (operation === Operation.SELECT) {
        query = query.select(select).from(target);
      } else {
        query = query.update(target);
      }
    }

    if (this._from) {
      let from = this._from;
      if (from instanceof Document) {
        from = from.get('@rid');
        if (!from) {
          throw new Error('From is document but his rid is not defined');
        }
      }
      query.from(from);
    }

    if (this._to) {
      let to = this._to;
      if (to instanceof Document) {
        to = to.get('@rid');
        if (!to) {
          throw new Error('To is document but his rid is not defined');
        }
      }
      query.to(to);
    }

    if (this._set) {
      if (operation === Operation.INSERT) {
        if (this._set['@type']) {
          delete this._set['@type'];
        }
        if (this._set['@class']) {
          delete this._set['@class'];
        }
      }

      query.set(this._set);
    }

    if (this._increment.length) {
      this._increment.forEach(function(item) {
        query.increment(item.prop, item.value);
      });
    }

    if (this._addToSet.length) {
      this._addToSet.forEach(function(item) {
        query.add(item.prop, item.value);
      });
    }

    if (this._upsert) {
      query.upsert();
    }

    this._operators.forEach(function(operator) {
      query = query[operator.type](operator.query);
    });

    query.addParams(this._params);

    if (!this._scalar && (operation === Operation.SELECT || operation === Operation.INSERT || this._return)) {
      query = query.transform(record => {
        record = this.fixRecord(record);

        return model.createDocument(record);
      });
    }

    if (this._limit) {
      query = query.limit(this._limit);
    }

    if (this._skip) {
      query = query.skip(this._skip);
    }

    if (this._populate.length) {
      // transform to fetch
      const fetch = this._populate.map(function(field) {
        return `${field}:0`;
      }).join(' ');

      this._fetchPlan = this._fetchPlan
        ? `${fetch} ${this._fetchPlan}`
        : fetch;
    }

    if (this._fetchPlan) {
      query = query.fetch(this._fetchPlan);
    }

    if (this._return) {
      query = query.return(this._return);
    }

    if (this._sort) {
      const order = {};

      Object.keys(this._sort).forEach(key => {
        const value = this._sort[key];
        order[key] = value === 'asc' || value === 'ascending' || value === 1
          ? 'ASC'
          : 'DESC';
      });

      query = query.order(order);
    }

    log(q.buildStatement(), q.buildOptions());

    return query.exec().then(results => {
      if (!results) {
        return callback(null, results);
      }

      if (this._first || this._scalar) {
        results = results[0];
      }

      if (this._scalar && results) {
        const keys = Object.keys(results).filter(function(item) {
          return item[0] !== '@';
        });

        if (keys.length) {
          results = results[keys[0]];

          if (this._scalarCast && results !== null && typeof results !== 'undefined') {
            results = this._scalarCast(results);
          }
        }
      }

      callback(null, results);
    }, function(err) {
      log('Error: ' + err.message);
      callback(err);
    });
  }
}
