/**
 * These are private action types reserved by Redux. 这些是 Redux 保留的私有操作类型。
 * For any unknown actions, you must return the current state. 对于任何未知的操作，您必须返回当前状态。 
 * If the current state is undefined, you must return the initial state. 如果当前状态未定义，则必须返回初始状态。
 * Do not reference these action types directly in your code. 不要在代码中直接引用这些操作类型。
 */

// self 转换成36进制字符串
const randomString = () =>
  Math.random().toString(36).substring(7).split('').join('.')

const ActionTypes = {
  INIT: `@@redux/INIT${randomString()}`,
  REPLACE: `@@redux/REPLACE${randomString()}`,
  PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${randomString()}`,
}

// self 这个文件返回了两个action的类型，两个类型的值都是通过一个随机数字转化成36进制的随机字符串拼接得到的。
export default ActionTypes
