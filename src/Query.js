import { Query, Schema, Document } from 'livia';
import OrientoQuery from 'oriento/lib/db/query';

const Operation = Query.Operation;

export default class OrientDBQuery extends Query {
	exec(callback) {
		callback = callback || function() {};

		var model = this.model;
		var schema = model.schema;
		var operation = this._operation;
		if(!operation) {
			throw new Error('Operation is not defined');
		}

		var query = new OrientoQuery(model.connection.db);
		var q = query;

		var target = this._target;
		if(target instanceof Document) {
			target = target.get('@rid');
			if(!target) {
				throw new Error('Target is document but his RID is not defined');
			}
		}

		var isGraph = schema instanceof Schema.Graph;
		if(isGraph) {
			var graphType = schema instanceof Schema.Edge ? 'EDGE' : 'VERTEX';

			if(operation === Operation.INSERT) {
				query = query.create(graphType, target);
			} else if(operation === Operation.DELETE) {
				query = query.delete(graphType, target);
			} else if(operation === Operation.SELECT) {
				query = query.select().from(target);
			} else {
				query = query.update(target);
			}
		} else {
			if(operation === Operation.INSERT) {
				query = query.insert().into(target);
			} else if(operation === Operation.DELETE) {
				query = query.delete().from(target);
			} else if(operation === Operation.SELECT) {
				query = query.select().from(target);
			} else {
				query = query.update(target);
			}			
		}	

		if(this._from) {
			var from = this._from;
			if(from instanceof Document) {
				from = from.get('@rid');
				if(!from) {
					throw new Error('From is document but his rid is not defined');
				}
			}
			query.from(from);
		}	

		if(this._to) {
			var to = this._to;
			if(to instanceof Document) {
				to = to.get('@rid');
				if(!to) {
					throw new Error('To is document but his rid is not defined');
				}
			}
			query.to(to);
		}			

		if(this._set) {
			query.set(this._set);
		}

		this._operators.forEach(function(operator) {
			query = query[operator.type](operator.query);
		});

		query.addParams(this._params);

		if(!this._scalar && (operation === Operation.SELECT || operation === Operation.INSERT)) {
			query = query.transform(function(record) {
				return model._createDocument(record);
			});
		}

		if(this._limit) {
			query = query.limit(this._limit);
		}

		if(this._skip) {
			query = query.skip(this._skip);
		}

		if(this._fetchPlan) {
			query = query.fetch(this._fetchPlan);
		}	

		if(this._return) {
			query = query.return(this._return);
		}		

		if(this._sort) {
			var order = {};

			Object.keys(this._sort).forEach(key => {
				var value = this._sort[key];
				order[key] = value === 'asc' || value === 'ascending' || value === 1
					? 'ASC' 
					: 'DESC';
			});

			query = query.order(order);
		}

		log(q.buildStatement(), q.buildOptions());

		return query.exec().then(results => {
			if(!results) {
				return callback(null, results);
			}

			if(this._first) {
				results = results[0];
			}

			if(this._scalar && results.length) {
				results = parseInt(results[0]);
			}

			callback(null, results);
		}, function(err) {
			log('Error: ' + err.message);
			callback(err);
		});
	}		
};