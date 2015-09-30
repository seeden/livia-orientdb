import { Types } from 'livia';

export default class ByteType extends Types.Number {
  static toString() {
    return 'Byte';
  }

  static getDbType() {
    return 'BYTE';
  }
}
