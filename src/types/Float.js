import { Types } from 'livia';

export default class FloatType extends Types.Number {
  static toString() {
    return 'Float';
  }

  static getDbType() {
    return 'FLOAT';
  }
}
