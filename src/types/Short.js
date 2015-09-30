import { Types } from 'livia';

export default class ShortType extends Types.Number {
  static toString() {
    return 'Short';
  }

  static getDbType() {
    return 'SHORT';
  }
}
