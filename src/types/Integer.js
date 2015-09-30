import { Types } from 'livia';

export default class IntegerType extends Types.Number {
  static toString() {
    return 'Integer';
  }

  static getDbType() {
    return 'INTEGER';
  }
}
