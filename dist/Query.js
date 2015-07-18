'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Query$Schema$Document = require('livia');

var _OrientoQuery = require('oriento/lib/db/query');

var _OrientoQuery2 = _interopRequireWildcard(_OrientoQuery);

var _debug = require('debug');

var _debug2 = _interopRequireWildcard(_debug);

var _import = require('lodash');

var _import2 = _interopRequireWildcard(_import);

var log = _debug2['default']('livia-orientdb:query');
var Operation = _Query$Schema$Document.Query.Operation;

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
  function OrientDBQuery() {
    _classCallCheck(this, OrientDBQuery);

    if (_Query != null) {
      _Query.apply(this, arguments);
    }
  }

  _inherits(OrientDBQuery, _Query);

  _createClass(OrientDBQuery, [{
    key: 'scalar',
    value: function scalar(useScalar, castFn) {
      if (typeof castFn === 'undefined') {
        castFn = Number;
      }

      return _get(Object.getPrototypeOf(OrientDBQuery.prototype), 'scalar', this).call(this, useScalar, castFn);
    }
  }, {
    key: 'queryLanguage',

    // fix contains for collections
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
        if (!prop || !prop.schemaType || !prop.schemaType.isArray) {
          return;
        }

        // replace condition
        delete conditions[propertyName];

        var subConditions = conditions[parent] || {};
        if (!_import2['default'].isPlainObject(subConditions)) {
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
        record = this.fixEmbeddedEscape(record);
      }

      return record;
    }
  }, {
    key: 'fixEmbeddedEscape',
    value: function fixEmbeddedEscape(record, isChild) {
      var _this = this;

      if (!_import2['default'].isObject(record)) {
        return record;
      }

      Object.keys(record).forEach(function (key) {
        var value = record[key];

        if (_import2['default'].isObject(value)) {
          record[key] = _this.fixEmbeddedEscape(value, true);
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
      return new _OrientoQuery2['default'](this.model.native);
    }
  }, {
    key: 'exec',
    value: function exec() {
      var _this2 = this;

      var callback = arguments[0] === undefined ? function () {} : arguments[0];

      var model = this.model;
      var schema = model.schema;
      var operation = this._operation;
      if (!operation) {
        throw new Error('Operation is not defined');
      }

      var query = this.native();
      var q = query;

      var target = this._target;
      if (target instanceof _Query$Schema$Document.Document) {
        target = target.get('@rid');
        if (!target) {
          throw new Error('Target is document but his RID is not defined');
        }
      }

      var select = this._select || '*';

      var isGraph = schema instanceof _Query$Schema$Document.Schema.Graph;
      if (isGraph) {
        var graphType = schema instanceof _Query$Schema$Document.Schema.Edge ? 'EDGE' : 'VERTEX';

        if (operation === Operation.INSERT) {
          query = query.create(graphType, target);
        } else if (operation === Operation.DELETE) {
          query = query['delete'](graphType, target);
        } else if (operation === Operation.SELECT) {
          query = query.select(select).from(target);
        } else {
          query = query.update(target);
        }
      } else {
        if (operation === Operation.INSERT) {
          query = query.insert().into(target);
        } else if (operation === Operation.DELETE) {
          query = query['delete']().from(target);
        } else if (operation === Operation.SELECT) {
          query = query.select(select).from(target);
        } else {
          query = query.update(target);
        }
      }

      if (this._from) {
        var from = this._from;
        if (from instanceof _Query$Schema$Document.Document) {
          from = from.get('@rid');
          if (!from) {
            throw new Error('From is document but his rid is not defined');
          }
        }
        query.from(from);
      }

      if (this._to) {
        var to = this._to;
        if (to instanceof _Query$Schema$Document.Document) {
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

      this._operators.forEach(function (operator) {
        query = query[operator.type](operator.query);
      });

      query.addParams(this._params);

      if (!this._scalar && (operation === Operation.SELECT || operation === Operation.INSERT)) {
        query = query.transform(function (record) {
          record = _this2.fixRecord(record);

          return model.createDocument(record);
        });
      }

      if (this._limit) {
        query = query.limit(this._limit);
      }

      if (this._skip) {
        query = query.skip(this._skip);
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

          Object.keys(_this2._sort).forEach(function (key) {
            var value = _this2._sort[key];
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

        if (_this2._first || _this2._scalar) {
          results = results[0];
        }

        if (_this2._scalar && results) {
          var keys = Object.keys(results).filter(function (item) {
            return item[0] !== '@';
          });

          if (keys.length) {
            results = results[keys[0]];

            if (_this2._scalarCast && results !== null && typeof results !== 'undefined') {
              results = _this2._scalarCast(results);
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
})(_Query$Schema$Document.Query);

exports['default'] = OrientDBQuery;
module.exports = exports['default'];