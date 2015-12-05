'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x3, _x4, _x5) { var _again = true; _function: while (_again) { var object = _x3, property = _x4, receiver = _x5; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x3 = parent; _x4 = property; _x5 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _livia = require('livia');

var _orientjsLibDbQuery = require('orientjs/lib/db/query');

var _orientjsLibDbQuery2 = _interopRequireDefault(_orientjsLibDbQuery);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var log = (0, _debug2['default'])('livia-orientdb:query');
var Operation = _livia.Query.Operation;

function stripslashes(str) {
  return (str + '').replace(/\\(.?)/g, function (s, n1) {
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

var OrientDBQuery = (function (_Query) {
  _inherits(OrientDBQuery, _Query);

  function OrientDBQuery(model) {
    _classCallCheck(this, OrientDBQuery);

    _get(Object.getPrototypeOf(OrientDBQuery.prototype), 'constructor', this).call(this, model);

    this._increment = [];
    this._addToSet = [];
  }

  _createClass(OrientDBQuery, [{
    key: 'prepareValue',
    value: function prepareValue(value) {
      if (value && value instanceof _livia.Document && value.get('@rid')) {
        return value.get('@rid');
      }

      return _get(Object.getPrototypeOf(OrientDBQuery.prototype), 'prepareValue', this).call(this, value);
    }
  }, {
    key: 'scalar',
    value: function scalar(useScalar, castFn) {
      if (typeof castFn === 'undefined') {
        return _get(Object.getPrototypeOf(OrientDBQuery.prototype), 'scalar', this).call(this, useScalar, Number);
      }

      return _get(Object.getPrototypeOf(OrientDBQuery.prototype), 'scalar', this).call(this, useScalar, castFn);
    }
  }, {
    key: 'options',
    value: function options() {
      var _options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      if (_options['new']) {
        _options['return'] = 'AFTER @this';
        delete _options['new'];

        if (_options.upsert) {
          _options.scalar = false;
          _options.first = true;
        }
      }

      return _get(Object.getPrototypeOf(OrientDBQuery.prototype), 'options', this).call(this, _options);
    }
  }, {
    key: 'increment',
    value: function increment(prop, value) {
      this._increment.push({ prop: prop, value: value });
    }
  }, {
    key: 'addToSet',
    value: function addToSet(prop, value) {
      this._addToSet.push({ prop: prop, value: value });
    }
  }, {
    key: 'set',
    value: function set(doc) {
      var _this = this;

      if (doc.$inc) {
        (function () {
          var inc = doc.$inc;
          delete doc.$inc;

          Object.keys(inc).forEach(function (propName) {
            _this.increment(propName, inc[propName]);
          });
        })();
      }

      if (doc.$addToSet) {
        (function () {
          var addToSet = doc.$addToSet;
          delete doc.$addToSet;

          Object.keys(addToSet).forEach(function (propName) {
            _this.addToSet(propName, addToSet[propName]);
          });
        })();
      }

      return _get(Object.getPrototypeOf(OrientDBQuery.prototype), 'set', this).call(this, doc);
    }

    // fix contains for collections
  }, {
    key: 'queryLanguage',
    value: function queryLanguage(conditions, parentPath) {
      var model = this.model;

      if (typeof!model === 'undefined') {
        return _get(Object.getPrototypeOf(OrientDBQuery.prototype), 'queryLanguage', this).call(this, conditions, parentPath);
      }

      var schema = model.schema;

      Object.keys(conditions).forEach(function (propertyName) {
        var pos = propertyName.indexOf('.');
        if (pos === -1) {
          return;
        }

        var value = conditions[propertyName];
        var parent = propertyName.substr(0, pos);
        var child = propertyName.substr(pos + 1);

        var currentPath = parentPath ? parentPath + '.' + parent : parent;

        var prop = schema.getPath(currentPath);
        if (!prop || !prop.SchemaType || !prop.SchemaType.isArray) {
          return;
        }

        // replace condition
        delete conditions[propertyName];

        var subConditions = conditions[parent] || {};
        if (!_lodash2['default'].isPlainObject(subConditions)) {
          subConditions = {
            $eq: subConditions
          };
        }

        if (!subConditions.$contains) {
          subConditions.$contains = {};
        }

        if (subConditions.$contains[child]) {
          throw new Error('Condition already exists for ' + child);
        }

        subConditions.$contains[child] = value;

        conditions[parent] = subConditions;
      });

      return _get(Object.getPrototypeOf(OrientDBQuery.prototype), 'queryLanguage', this).call(this, conditions, parentPath);
    }
  }, {
    key: 'fixRecord',
    value: function fixRecord(record) {
      var options = this.model.connection.adapter.options;
      if (options.fixEmbeddedEscape) {
        return this.fixEmbeddedEscape(record);
      }

      return record;
    }
  }, {
    key: 'fixEmbeddedEscape',
    value: function fixEmbeddedEscape(record, isChild) {
      var _this2 = this;

      if (!_lodash2['default'].isObject(record)) {
        return record;
      }

      Object.keys(record).forEach(function (key) {
        var value = record[key];

        if (_lodash2['default'].isObject(value)) {
          record[key] = _this2.fixEmbeddedEscape(value, true);
          return;
        }

        if (typeof value === 'string' && isChild) {
          record[key] = stripslashes(value);
        }
      });

      return record;
    }
  }, {
    key: 'native',
    value: function native() {
      return new _orientjsLibDbQuery2['default'](this.model.native);
    }
  }, {
    key: 'exec',
    value: function exec() {
      var _this3 = this;

      var callback = arguments.length <= 0 || arguments[0] === undefined ? function () {} : arguments[0];

      var model = this.model;
      var schema = model.schema;
      var operation = this._operation;
      if (!operation) {
        throw new Error('Operation is not defined');
      }

      var query = this.native();
      var q = query;

      var target = this._target;
      if (target instanceof _livia.Document) {
        target = target.get('@rid');
        if (!target) {
          throw new Error('Target is document but his RID is not defined');
        }
      }

      var select = this._select || '*';
      var escapedTarget = typeof target === 'string' && target[0] !== '#' ? '`' + target + '`' : target;

      var isGraph = schema instanceof _livia.Schema.Graph;
      if (isGraph) {
        var graphType = schema instanceof _livia.Schema.Edge ? 'EDGE' : 'VERTEX';

        if (operation === Operation.INSERT) {
          query = query.create(graphType, escapedTarget);
        } else if (operation === Operation.DELETE) {
          query = query['delete'](graphType, escapedTarget);
        } else if (operation === Operation.SELECT) {
          query = query.select(select).from(escapedTarget);
        } else {
          query = query.update(target);
        }
      } else {
        if (operation === Operation.INSERT) {
          query = query.insert().into(escapedTarget);
        } else if (operation === Operation.DELETE) {
          query = query['delete']().from(escapedTarget);
        } else if (operation === Operation.SELECT) {
          query = query.select(select).from(escapedTarget);
        } else {
          query = query.update(escapedTarget);
        }
      }

      if (this._from) {
        var from = this._from;
        if (from instanceof _livia.Document) {
          from = from.get('@rid');
          if (!from) {
            throw new Error('From is document but his rid is not defined');
          }
        }
        query.from(from);
      }

      if (this._to) {
        var to = this._to;
        if (to instanceof _livia.Document) {
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

        if (Object.keys(this._set).length) {
          query.set(this._set);
        }
      }

      if (this._increment.length) {
        this._increment.forEach(function (item) {
          query.increment(item.prop, item.value);
        });
      }

      if (this._addToSet.length) {
        this._addToSet.forEach(function (item) {
          query.add(item.prop, item.value);
        });
      }

      if (this._upsert) {
        query.upsert();
      }

      this._operators.forEach(function (operator) {
        query = query[operator.type](operator.query);
      });

      query.addParams(this._params);

      if (!this._scalar && (operation === Operation.SELECT || operation === Operation.INSERT || this._return)) {
        query = query.transform(function (record) {
          record = _this3.fixRecord(record);

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
        var _fetch = this._populate.map(function (field) {
          return field + ':0';
        }).join(' ');

        this._fetchPlan = this._fetchPlan ? _fetch + ' ' + this._fetchPlan : _fetch;
      }

      if (this._fetchPlan) {
        query = query.fetch(this._fetchPlan);
      }

      if (this._return) {
        query = query['return'](this._return);
      }

      if (this._sort) {
        (function () {
          var order = {};

          Object.keys(_this3._sort).forEach(function (key) {
            var value = _this3._sort[key];
            order[key] = value === 'asc' || value === 'ascending' || value === 1 ? 'ASC' : 'DESC';
          });

          query = query.order(order);
        })();
      }

      log(q.buildStatement(), q.buildOptions());

      return query.exec().then(function (results) {
        if (!results) {
          return callback(null, results);
        }

        if (_this3._first || _this3._scalar) {
          results = results[0];
        }

        if (_this3._scalar && results) {
          var keys = Object.keys(results).filter(function (item) {
            return item[0] !== '@';
          });

          if (keys.length) {
            results = results[keys[0]];

            if (_this3._scalarCast && results !== null && typeof results !== 'undefined') {
              results = _this3._scalarCast(results);
            }
          }
        }

        callback(null, results);
      }, function (err) {
        log('Error: ' + err.message);
        callback(err);
      });
    }
  }]);

  return OrientDBQuery;
})(_livia.Query);

exports['default'] = OrientDBQuery;
module.exports = exports['default'];