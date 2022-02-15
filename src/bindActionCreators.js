// bindActionCreators作用： 对disptach的一种封装，可以直接执行或者通过属性方法的调用隐式的调用dispatch,而不用显式调用dispacth
// 入参是函数，返回函数，入参是对象，返回对象。

/**  
 * bindActionCreators使用方式如下：
 let actionCreaters = {
  add: function (todo) { //添加
      return {
          type: 'add',
          todo
      }
  }, delete: function (id) {
      return {
          type: 'delete',
          id
      }
  }
}
// 传入对象
let boundActions = bindActionCreators(actionCreaters, store.dispatch)
boundActions.add({
  id: 12,
  content: '睡觉觉'
})

// 传入函数
let boundAdd = bindActionCreators(actionCreaters.add, store.dispatch)
boundAdd({
  id: 13,
  content: '打豆豆'
})
*/
import { kindOf } from './utils/kindOf'

/**
 * self 重点方法
 * @param {*} actionCreator 将要执行的函数（返回一个 action 的函数）
 * @param {*} dispatch 原生dispatch方法
 * @returns 返回一个执行dispatch的函数。外部可以直接调用，实现对dispatch的封装
 */
function bindActionCreator(actionCreator, dispatch) {
  return function () {
    return dispatch(actionCreator.apply(this, arguments))
  }
}



/**
 * Turns an object whose values are action creators, into an object with the 将其值为动作创建者的对象转换为具有
 * same keys, but with every function wrapped into a `dispatch` call so they 相同的键，但每个函数都包含在一个 `dispatch` 调用中，因此它们
 * may be invoked directly. This is just a convenience method, as you can call 可以直接调用。 这只是一种方便的方法，您可以调用
 * `store.dispatch(MyActionCreators.doSomething())` yourself just fine. ‘store.dispatch(MyActionCreators.doSomething())` 你自己就好了。
 *
 * For convenience, you can also pass an action creator as the first argument, 为方便起见，您还可以传递一个动作创建者作为第一个参数，
 * and get a dispatch wrapped function in return. 并获得一个调度包装函数作为回报。
 *
 * @param {Function|Object} actionCreators An object whose values are action 参数 一个对象，其值为 action
 * creator functions. One handy way to obtain it is to use ES6 `import * as` 创建者功能。 获得它的一种方便方法是使用 ES6 `import * as`
 * syntax. You may also pass a single function. 句法。 你也可以传递一个函数。
 *
 * @param {Function} dispatch The `dispatch` function available on your Redux  Redux store上可用的 `dispatch` 函数
 * store.
 *
 * @returns {Function|Object} The object mimicking the original object, but with 模仿原始对象的对象，但带有
 * every action creator wrapped into the `dispatch` call. If you passed a 每个动作创建者都包含在 `dispatch` 调用中。 如果你通过了
 * function as `actionCreators`, the return value will also be a single 作为 `actionCreators` 的函数，返回值也将是单个函数
 * function.
 */
export default function bindActionCreators(actionCreators, dispatch) {
  // self 如果第一个参数是函数，则调用bindActionCreator（）方法。 返回一个函数
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch)
  }

  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error(
      `bindActionCreators expected an object or a function, but instead received: '${kindOf(
        actionCreators
      )}'. ` +
        `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`
    )
  }

  // self 如果第一个参数是对象，则遍历该对象，依次调用bindActionCreator（）方法。 返回一个对象
  const boundActionCreators = {}
  for (const key in actionCreators) {
    const actionCreator = actionCreators[key]
    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)
    }
  }
  return boundActionCreators
}
