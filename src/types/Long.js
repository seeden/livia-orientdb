import { Types } from 'livia';

/*
  Javascript long has support for 53bits only
  http://www.w3schools.com/js/js_numbers.asp
*/

export default class LongType extends Types.Type {
  _serialize(value) {
    return Number(value);
  }

  _deserialize(value) {
    return value;
  }

  static toString() {
    return 'Long';
  }

  static getDbType() {
    return 'LONG';
  }
}
