// 中间件middleware就是允许我们在dispatch action之后，到达reducer之前，搞点事情。

import compose from './compose'

/**
 * Creates a store enhancer that applies middleware to the dispatch method 创建一个store增强器，将中间件应用于调度方法Redux store的。 这对于各种任务都很方便，例如表达
 * of the Redux store. This is handy for a variety of tasks, such as expressing 
 * asynchronous actions in a concise manner, or logging every action payload. 以简洁的方式进行异步操作，或记录每个操作有效负载。
 *
 * See `redux-thunk` package as an example of the Redux middleware. 请参阅 `redux-thunk` 包作为 Redux 中间件的示例。
 *
 * Because middleware is potentially asynchronous, this should be the first 因为中间件可能是异步的，所以这应该是第一个
 * store enhancer in the composition chain. 将增强剂存储在合成链中。
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions 请注意，每个中间件都将被赋予 `dispatch` 和 `getState` 函数
 * as named arguments. 作为命名参数。
 *
 * @param {...Function} middlewares The middleware chain to be applied. 参数 要应用的中间件链。
 * @returns {Function} A store enhancer applying the middleware. 应用中间件的存储增强器。
 */

// self 参数 ** middlewares 主要是包装store的dispatch方法 **。可以同时传入多个middleWare组合到一起使用，形成 middleware链。
// self 每个middleware接受Store的dispatch和getState 函数作为命名参数，并返回一个函数。

export default function applyMiddleware(...middlewares) {
  return (createStore) => (...args) => {
    const store = createStore(...args) // 原始的store 此时的dispatch 就是原始的dispatch
    let dispatch = () => {
      throw new Error(
        'Dispatching while constructing your middleware is not allowed. ' +
          'Other middleware would not be applied to this dispatch.'
      )
    }

    const middlewareAPI = {
      getState: store.getState,
      dispatch: (...args) => dispatch(...args),
    }
    const chain = middlewares.map((middleware) => middleware(middlewareAPI))
    dispatch = compose(...chain)(store.dispatch)

    return {
      ...store,
      dispatch,
    }
  }
}

// self applyMiddleware执行的过程：
// 第一步：通过传入的createStore创建了一个store
// 第二步：声明了一个原始的dispatch，如果在中间件的调用过程中出现了错误，则抛出错误
// 第三步：定义middlewareAPI，有两个方法，一个是getState，另一个是dispatch，将其作为每个中间件调用的store的参数，整合出一个chain
// 第四步：通过compose的包装chain，并赋值给dispatch
// 第五步：将新的dispatch替换原先的store.dispatch
