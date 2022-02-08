/**
 * @param {any} obj The object to inspect. 参数obj是要检查的对象
 * @returns {boolean} True if the argument appears to be a plain object. 如果参数是一个普通的对象，返回true
 */


// self 这个方法判断传入参数的原型是否等于Object.prototype换句话说，判断参数的父类是不是Object。
export default function isPlainObject(obj) {
  if (typeof obj !== 'object' || obj === null) return false

  let proto = obj
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto)
  }

  return Object.getPrototypeOf(obj) === proto
}
