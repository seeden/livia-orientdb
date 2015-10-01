import { Schema } from 'livia';
import Types from '../types';

function getDefaultClassName() {
  return this._className;
}

function aggregatedFunction(fnName, field, conditions, callback) {
  if (typeof conditions === 'function') {
    callback = conditions;
    conditions = {};
  }

  if (typeof field === 'function') {
    callback = field;
    conditions = {};
    field = '*';
  }

  if (typeof field === 'undefined') {
    field = '*';
  }

  const query = this
    .find(conditions)
    .select(`${fnName}(${field})`)
    .scalar(true);

  return callback ? query.exec(callback) : query;
}

const mathFunctions = ['count', 'avg', 'sum', 'min', 'max', 'median', 'percentile', 'variance', 'stddev'];

export function prepareSchema(schema) {
  schema.add({
    '@type': {
      type: String,
      readonly: true,
      metadata: true,
      default: 'd',
      subCreate: true,
      subUpdate: true
    },
    '@class': {
      type: String,
      readonly: true,
      metadata: true,
      default: getDefaultClassName,
      subCreate: true,
      subUpdate: true
    },
    '@rid': {
      type: Types.RID,
      readonly: true,
      metadata: true,
      isRecordID: true
    },
    '@version': { type: Number, readonly: true, metadata: true },
    '@fieldTypes': { type: String, readonly: true, metadata: true }
  });

  schema.virtual('rid', { metadata: true }).get(function() {
    return this.get('@rid');
  });

  schema.virtual('_id', { metadata: true }).get(function() {
    return this.get('@rid');
  });

  schema.statics.aggregatedFunction = aggregatedFunction;

  mathFunctions.forEach(function(fnName) {
    schema.statics[fnName] = function(field, conditions, callback) {
      return this.aggregatedFunction(fnName, field, conditions, callback);
    };
  });
}

export default class OrientSchema extends Schema {
  constructor(props, options) {
    super(props, options);

    prepareSchema(this);
  }

  getSubdocumentSchemaConstructor() {
    return OrientSchema;
  }

  convertType(type, options = {}) {
    if (!type) {
      return super.convertType(type, options);
    }

    // todo it can be removed in next version
    if (type.isDocumentClass) {
      return Types.Linked;
    }

    if (type === Number) {
      if (options.integer) {
        return Types.Integer;
      } else if (options.long) {
        return Types.Long;
      } else if (options.float) {
        return Types.Float;
      } else if (options.short) {
        return Types.Short;
      } else if (options.byte) {
        return Types.Byte;
      }
    }

    return super.convertType(type, options);
  }
}
