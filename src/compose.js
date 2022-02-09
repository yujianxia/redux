// 当需要使用多个redux中间件 依次执行的时候，需要用到它。

/**
 * Composes single-argument functions from right to left. The rightmost 从右到左组成单参数函数。 最右边
 * function can take multiple arguments as it provides the signature for 函数可以接受多个参数，因为它为
 * the resulting composite function. 得到的复合函数。
 *
 * @param {...Function} funcs The functions to compose. 参数 要组合的函数。
 * @returns {Function} A function obtained by composing the argument functions 组合参数函数得到的函数
 * from right to left. For example, compose(f, g, h) is identical to doing 从右到左。 例如，compose(f, g, h) 等同于做(...args) => f(g(h(...args)))
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
  // self funcs的执行顺序为’右->左‘  好比将b(...args)的执行结果，传入a中做为参数继续执行。 
  return funcs.reduce((a, b) => (...args) => a(b(...args)))
}
