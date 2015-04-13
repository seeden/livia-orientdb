import OrientSchema, { prepareSchema } from './Schema';
import { Schema } from 'livia';

export default class Vertex extends Schema.Vertex {
	constructor(props, options) {
		options = options || {};
		options.extend = options.extend || 'V';

		super(props, options);

		prepareSchema(this);
	}

	getSubdocumentSchemaConstructor() {
		return OrientSchema;
	}
}