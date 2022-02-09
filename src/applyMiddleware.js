// self applyMiddleware主要作用：
// self 就是允许我们在调用原始dispatch之后，到达reducer之前。重写dispatch方法，中间件通过链式执行新的dispatch方法，最后再将数据返回到原始dispatch方法中。来实现异步等操作。

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

// self 参数 ** middlewares（中间件）主要是包装store的dispatch方法 **。可以同时传入多个middleWare组合到一起使用，形成 middleware链。
// self 每个middleware接受Store的dispatch和getState 函数作为命名参数，并返回一个以createStore为参数的函数。

export default function applyMiddleware(...middlewares) {
  // self applyMiddleware的使用方法： 
  // self const store = createStore( reducer, applyMiddleware([...中间件]))。
  // self applyMiddleware([...中间件]) 的返回值是一个以createStore为参数的函数，实际上这个函数会在 createStore.js 中执行 ** enhancer(createStore)(reducer, preloadedState) **)，
  return (createStore) => (...args) => {
    // self 原始的store 此时的dispatch 就是原始的dispatch（和createStore.js中的createStore方法一样）
    const store = createStore(...args)
    
    // self 声明了一个原始的dispatch，如果在中间件的调用过程中出现了错误，则抛出错误
    let dispatch = () => {
      throw new Error(
        'Dispatching while constructing your middleware is not allowed. ' +
          'Other middleware would not be applied to this dispatch.'
      )
    }

    // self 在返回store以前，中间件将最重要的两个方法 getState/dispatch 整合出来，并传递给中间件使用
    const middlewareAPI = {
      getState: store.getState,
      dispatch: (...args) => dispatch(...args),
    }
    /*
      中间件标准格式(所以middlewareAPI必须包含两个方法):
      let logger1 = ({ dispatch, getState }) => next => action => {
        ...     
        let result = next(action)
        ...
        return result
      }
    */

    /*
      middleware(middlewareAPI)之后是这样的格式 
      let m =  next => action => {
        ...     
        let result = next(action)
        ...
        return result
      }
    */

    // self 把middlewareAPI依次传递给 middleware（中间件），让它们有控制权，并且返回一个如上格式的数组 [m,m1,m2,...]
    const chain = middlewares.map((middleware) => middleware(middlewareAPI))

    // self compose(...chain)(store.dispatch)中 chain参数：中间件的调用链  store.dispatch参数：原始的dispatch函数。等到chain中的链式调用完成之后调用
    // self 通过compose的包装chain（链），生成一个新的dispatch方法（原dispatch返回active，新dispatch返回）
    // self 中间件调用的dispatch就是这新的dispatch方法 中间件就会一个一个执行完逻辑后, 将执行权给下一个, 直到原始的store.dispacth, 最后计算出新的state。（这就是中间件实现异步的核心）
    dispatch = compose(...chain)(store.dispatch)

    // self 中间件处理完以后，返回一个新的store，只是重写了dispatch方法。
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
