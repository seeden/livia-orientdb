import RID from './RID';
import _ from 'lodash';
import { Document } from 'livia';

export default class Linked extends RID {
  // START - copy from livia linked
  _serialize(value) {
    if (value instanceof Document) {
      return value;
    } else if (_.isPlainObject(value)) {
      return new this.options.type(value);
    }

    return super._serialize(value);
  }

  get(path) {
    if (this._value instanceof Document) {
      return this._value.get(path);
    }

    super.get(path);
  }

  set(path, value) {
    if (this._value instanceof Document) {
      return this._value.set(path, value);
    }

    super.set(path, value);
  }

  get isModified() {
    if (this._value instanceof Document) {
      return this._value.isModified();
    }

    return super.isModified;
  }
  // END - copy from livia linked

  toJSON(options = {}) {
    const value = this._value;

    if (value instanceof Document) {
      const json = value.toJSON(options);
      if ((options.update || options.create) && value.get('@rid')) {
        return json['@rid'];
      }

      return json;
    }

    return super.toJSON(options);
  }

  toObject(options = {}) {
    const value = this._value;

    if (value instanceof Document) {
      const obj = value.toObject(options);
      if ((options.update || options.create) && value.get('@rid')) {
        return obj['@rid'];
      }

      return obj;
    }

    return super.toObject(options);
  }

  static getPropertyConfig(prop) {
    if (prop.type.isDocumentClass) {
      return {
        linkedClass: prop.type.modelName
      };
    }

    if (prop.options && prop.options.ref) {
      return {
        linkedClass: prop.options.ref
      };
    }

    return {};
  }
}
