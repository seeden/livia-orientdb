"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _livia = require("livia");

var Query = _livia.Query;
var Schema = _livia.Schema;
var Document = _livia.Document;

var OrientoQuery = _interopRequire(require("oriento/lib/db/query"));

var debug = _interopRequire(require("debug"));

var log = debug("livia-orientdb:query");
var Operation = Query.Operation;

var OrientDBQuery = (function (_Query) {
	function OrientDBQuery() {
		_classCallCheck(this, OrientDBQuery);

		if (_Query != null) {
			_Query.apply(this, arguments);
		}
	}

	_inherits(OrientDBQuery, _Query);

	_createClass(OrientDBQuery, {
		exec: {
			value: function exec(callback) {
				var _this = this;

				callback = callback || function () {};

				var model = this.model;
				var schema = model.schema;
				var operation = this._operation;
				if (!operation) {
					throw new Error("Operation is not defined");
				}

				var query = new OrientoQuery(model.connection.adapter.db);
				var q = query;

				var target = this._target;
				if (target instanceof Document) {
					target = target.get("@rid");
					if (!target) {
						throw new Error("Target is document but his RID is not defined");
					}
				}

				var isGraph = schema instanceof Schema.Graph;
				if (isGraph) {
					var graphType = schema instanceof Schema.Edge ? "EDGE" : "VERTEX";

					if (operation === Operation.INSERT) {
						query = query.create(graphType, target);
					} else if (operation === Operation.DELETE) {
						query = query["delete"](graphType, target);
					} else if (operation === Operation.SELECT) {
						query = query.select().from(target);
					} else {
						query = query.update(target);
					}
				} else {
					if (operation === Operation.INSERT) {
						query = query.insert().into(target);
					} else if (operation === Operation.DELETE) {
						query = query["delete"]().from(target);
					} else if (operation === Operation.SELECT) {
						query = query.select().from(target);
					} else {
						query = query.update(target);
					}
				}

				if (this._from) {
					var from = this._from;
					if (from instanceof Document) {
						from = from.get("@rid");
						if (!from) {
							throw new Error("From is document but his rid is not defined");
						}
					}
					query.from(from);
				}

				if (this._to) {
					var to = this._to;
					if (to instanceof Document) {
						to = to.get("@rid");
						if (!to) {
							throw new Error("To is document but his rid is not defined");
						}
					}
					query.to(to);
				}

				if (this._set) {
					query.set(this._set);
				}

				this._operators.forEach(function (operator) {
					query = query[operator.type](operator.query);
				});

				query.addParams(this._params);

				if (!this._scalar && (operation === Operation.SELECT || operation === Operation.INSERT)) {
					query = query.transform(function (record) {
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
					query = query["return"](this._return);
				}

				if (this._sort) {
					var order = {};

					Object.keys(this._sort).forEach(function (key) {
						var value = _this._sort[key];
						order[key] = value === "asc" || value === "ascending" || value === 1 ? "ASC" : "DESC";
					});

					query = query.order(order);
				}

				log(q.buildStatement(), q.buildOptions());

				return query.exec().then(function (results) {
					if (!results) {
						return callback(null, results);
					}

					if (_this._first) {
						results = results[0];
					}

					if (_this._scalar && results.length) {
						results = parseInt(results[0]);
					}

					callback(null, results);
				}, function (err) {
					log("Error: " + err.message);
					callback(err);
				});
			}
		}
	});

	return OrientDBQuery;
})(Query);

module.exports = OrientDBQuery;