import { Types } from 'livia';
import { RecordID } from 'orientjs';

export default class RIDType extends Types.Type {
  _serialize(value) {
    const record = new RecordID(value);
    if (!record) {
      throw new Error('Problem with parsing of RID: ' + value);
    }

    return record;
  }

  _deserialize(value) {
    return value;
  }

  toObject() {
    return this.value;
  }

  toJSON() {
    return this.value ? this.value.toString() : this.value;
  }

  static toString() {
    return 'String';
  }

  static getDbType() {
    return 'LINK';
  }
}
