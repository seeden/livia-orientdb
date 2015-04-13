import OrientSchema, { prepareSchema } from './Schema';
import { Schema } from 'livia';
import RIDType from '../types/RID';

const BASE_EDGE_CLASS = 'E';

export default class Edge extends Schema.Edge {
	constructor(props, options) {
		options = options || {};
		options.extend = options.extend || BASE_EDGE_CLASS;

		super(props, options);

		prepareSchema(this);

		//add default properties
		this.add({
			'in'  : { type: RIDType, required: true, notNull: true }, //from
			'out' : { type: RIDType, required: true, notNull: true }  //to
		});

		if(options.unique) {
			this.index({ 
				'in'  : 1, 
				'out' : 1  
			}, { unique: true });
		}
	}

	getSubdocumentSchemaConstructor() {
		return OrientSchema;
	}
}