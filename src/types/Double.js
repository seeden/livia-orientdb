import { Types } from 'livia';

/*
  Javascript long has support for 53bits only
  http://www.w3schools.com/js/js_numbers.asp
*/

export default class DoubleType extends Types.Number {
  static toString() {
    return 'Double';
  }

  static getDbType() {
    return 'DOUBLE';
  }
}
