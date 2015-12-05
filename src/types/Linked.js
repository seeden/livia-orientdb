import RID from './RID';
import _ from 'lodash';
import { Document } from 'livia';

export default class Linked extends RID {
  // START - copy from livia linked
  _serialize(value) {
    if (value instanceof Document) {
      return value;
    } else if (_.isPlainObject(value)) {
      const Doc = this.getDocumentClass();
      if (!Doc) {
        throw new Error(`Document is not defined for property ${this.name}`);
      }

      return new Doc(value);
    }

    return super._serialize(value);
  }

  get(path) {
    if (this._value instanceof Document) {
      return this._value.get(path);
    }

    return super.get(path);
  }

  set(path, value, setAsOriginal) {
    if (this._value instanceof Document) {
      return this._value.set(path, value, setAsOriginal);
    }

    return super.set(path, value, setAsOriginal);
  }

  isModified(path) {
    if (this._value instanceof Document) {
      return this._value.isModified(path);
    }

    return super.isModified(path);
  }

  setAsOriginal() {
    super.setAsOriginal();

    if (this._value instanceof Document) {
      return this._value.setAsOriginal(true);
    }

    return this;
  }

  // END - copy from livia linked
  toJSON(options = {}) {
    return this._preDeserialize((value) => {
      if (value instanceof Document) {
        if ((options.update || options.create) && value.get('@rid')) {
          const rid = value.get('@rid');

          return rid && rid.toString
            ? rid.toString()
            : rid;
        }

        return value.toJSON(options);
      }

      return super.toJSON(options);
    }, options.disableDefault);
  }

  toObject(options = {}) {
    return this._preDeserialize((value) => {
      if (value instanceof Document) {
        if ((options.update || options.create) && value.get('@rid')) {
          return value.get('@rid');
        }

        return value.toObject(options);
      }

      return super.toObject(options);
    }, options.disableDefault);
  }

  static getPropertyConfig(prop) {
    if (prop.type.isDocumentClass) {
      return {
        linkedClass: prop.type.modelName,
      };
    }

    if (prop.options && prop.options.ref) {
      return {
        linkedClass: prop.options.ref,
      };
    }

    return {};
  }
}
