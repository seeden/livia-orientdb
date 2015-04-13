import { Schema } from 'livia';
import RIDType from '../types/RID';

function getDefaultClassName() {
	return this._className;
}

export function prepareSchema(schema) {
	schema.add({
		'@type'    : { type: String, readonly: true, metadata: true, query: true, default: 'document' },
		'@class'   : { type: String, readonly: true, metadata: true, query: true, default: getDefaultClassName},
		'@rid'     : { type: RIDType, readonly: true, metadata: true },
		'@version' : { type: Number, readonly: true, metadata: true },
	});

	schema.virtual('rid', { metadata: true }).get(function() {
		return this.get('@rid');
	});

	schema.virtual('_id', { metadata: true }).get(function() {
		return this.get('@rid');
	});	
};

export default class OrientSchema extends Schema {
	constructor(props, options) {
		super(props, options);

		prepareSchema(this);
	}

	getSubdocumentSchemaConstructor() {
		return OrientSchema;
	}
};