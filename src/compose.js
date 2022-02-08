// 当需要使用多个redux中间件 依次执行的时候，需要用到它。

/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 *
 * @param {...Function} funcs The functions to compose.
 * @returns {Function} A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 */

// self compose做的事情就是上一个函数的返回结果 ，作为下一个函数的参数传入。
export default function compose(...funcs) {
  if (funcs.length === 0) {
    return (arg) => arg
  }

  if (funcs.length === 1) {
    return funcs[0]
  }
  // self 这里可以看出， funcs的执行顺序是，右——>左
  return funcs.reduce((a, b) => (...args) => a(b(...args)))
}
