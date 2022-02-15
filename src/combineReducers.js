//combineReducer 把传入的recuder函数们，合并成一个新的reducer函数，dispatch的时候，挨个执行每个reducer

import ActionTypes from './utils/actionTypes'
import warning from './utils/warning'
import isPlainObject from './utils/isPlainObject'
import { kindOf } from './utils/kindOf'

function getUnexpectedStateShapeWarningMessage(
  inputState,
  reducers,
  action,
  unexpectedKeyCache
) {
  const reducerKeys = Object.keys(reducers)
  const argumentName =
    action && action.type === ActionTypes.INIT
      ? 'preloadedState argument passed to createStore'
      : 'previous state received by the reducer'

  if (reducerKeys.length === 0) {
    return (
      'Store does not have a valid reducer. Make sure the argument passed ' +
      'to combineReducers is an object whose values are reducers.'
    )
  }

  if (!isPlainObject(inputState)) {
    return (
      `The ${argumentName} has unexpected type of "${kindOf(
        inputState
      )}". Expected argument to be an object with the following ` +
      `keys: "${reducerKeys.join('", "')}"`
    )
  }

  const unexpectedKeys = Object.keys(inputState).filter(
    (key) => !reducers.hasOwnProperty(key) && !unexpectedKeyCache[key]
  )

  unexpectedKeys.forEach((key) => {
    unexpectedKeyCache[key] = true
  })

  if (action && action.type === ActionTypes.REPLACE) return

  if (unexpectedKeys.length > 0) {
    return (
      `Unexpected ${unexpectedKeys.length > 1 ? 'keys' : 'key'} ` +
      `"${unexpectedKeys.join('", "')}" found in ${argumentName}. ` +
      `Expected to find one of the known reducer keys instead: ` +
      `"${reducerKeys.join('", "')}". Unexpected keys will be ignored.`
    )
  }
}

// 循环调用reducers循环遍历finalReducers，对每个reducer方法分别执行
// reducer(undefined, { type: ActionTypes.INIT })
// 和
// reducer(undefined, { type: ActionTypes.PROBE_UNKNOWN_ACTION(), })
// 且返回结果不能为undefined，否则抛出异常。（保证每个reducer都有默认的state）
function assertReducerShape(reducers) {
  Object.keys(reducers).forEach((key) => {
    const reducer = reducers[key]
    const initialState = reducer(undefined, { type: ActionTypes.INIT })

    if (typeof initialState === 'undefined') {
      throw new Error(
        `The slice reducer for key "${key}" returned undefined during initialization. ` +
          `If the state passed to the reducer is undefined, you must ` +
          `explicitly return the initial state. The initial state may ` +
          `not be undefined. If you don't want to set a value for this reducer, ` +
          `you can use null instead of undefined.`
      )
    }

    if (
      typeof reducer(undefined, {
        type: ActionTypes.PROBE_UNKNOWN_ACTION(),
      }) === 'undefined'
    ) {
      throw new Error(
        `The slice reducer for key "${key}" returned undefined when probed with a random type. ` +
          `Don't try to handle '${ActionTypes.INIT}' or other actions in "redux/*" ` +
          `namespace. They are considered private. Instead, you must return the ` +
          `current state for any unknown actions, unless it is undefined, ` +
          `in which case you must return the initial state, regardless of the ` +
          `action type. The initial state may not be undefined, but can be null.`
      )
    }
  })
}

/**
 * Turns an object whose values are different reducer functions, into a single 将值是不同reducer函数的对象转换为单个对象
 * reducer function. It will call every child reducer, and gather their results reducer函数 它将调用每个子reducer，并收集他们的结果
 * into a single state object, whose keys correspond to the keys of the passed 成单个状态对象，其键对应于传递的键reducer函数
 * reducer functions.
 *
 * @param {Object} reducers An object whose values correspond to different 参数 reducers 值对应不同的对象
 * reducer functions that need to be combined into one. One handy way to obtain 需要合二为一的reducer功能。 一种便捷的获取方式
 * it is to use ES6 `import * as reducers` syntax. The reducers may never return 它是使用 ES6 `import * as reducers` 语法。 reducer可能永远不会返回
 * undefined for any action. Instead, they should return their initial state 未定义任何动作。 相反，他们应该返回他们的初始状态
 * if the state passed to them was undefined, and the current state for any 如果传递给他们的状态是未定义的，并且任何的当前状态
 * unrecognized action. 无法识别的动作。
 *
 * @returns {Function} A reducer function that invokes every reducer inside the 一个reducer函数，它调用内部的每个reducer
 * passed object, and builds a state object with the same shape. 传递对象，并构建一个具有相同形状的状态对象。
 */
export default function combineReducers(reducers) {
  //self 105-121行 只是先过滤一遍 把非function的reducer过滤掉
  const reducerKeys = Object.keys(reducers)
  const finalReducers = {}
  for (let i = 0; i < reducerKeys.length; i++) {
    const key = reducerKeys[i]

    if (process.env.NODE_ENV !== 'production') {
      if (typeof reducers[key] === 'undefined') {
        warning(`No reducer provided for key "${key}"`)
      }
    }

    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key]
    }
  }
  // self 得到过滤后的reducer Key数组
  const finalReducerKeys = Object.keys(finalReducers)

  // This is used to make sure we don't warn about the same 这用于确保我们不会多次警告相同的键。
  // keys multiple times.
  let unexpectedKeyCache
  if (process.env.NODE_ENV !== 'production') {
    unexpectedKeyCache = {}
  }

  let shapeAssertionError
  try {
    // self 校验过滤后的每个reducer方法
    assertReducerShape(finalReducers)
  } catch (e) {
    shapeAssertionError = e
  }

  // self 做为creatStore方法的第一个参数，（在creatStore.js 里 dispatch()方法中的 currentState = currentReducer(currentState, action)处调用）
  // self 两个参数 state也就是createStore方法里面的preloadedState，action就是上面的ActionTypes.REPLACE
  return function combination(state = {}, action) {
    // self 抛出reducer方法的异常
    if (shapeAssertionError) {
      throw shapeAssertionError
    }

    // self 非生产环境 会执行getUnexpectedStateShapeWarningMessage进行警告处理
    if (process.env.NODE_ENV !== 'production') {
      const warningMessage = getUnexpectedStateShapeWarningMessage(
        state,
        finalReducers,
        action,
        unexpectedKeyCache
      )
      if (warningMessage) {
        warning(warningMessage)
      }
    }

    // self 165-196行 根据Key调用将所有的reducer，将他们的值合并在一起
    let hasChanged = false // self 标记state是否被改变过？
    const nextState = {} // self 保存更新之后的state
    for (let i = 0; i < finalReducerKeys.length; i++) {
      const key = finalReducerKeys[i]
      const reducer = finalReducers[key]
      // self 如果preloadedState（目前存在的state）存在和finalReducers（传入的reducer）对应的key，那么previousStateForKey就是改ruducer对应state的状态值
      const previousStateForKey = state[key] 
      // self 就用reducer[key]来处理，得到下一个状态。（如果previousStateForKey不为undefined，那么得到的nextStateForKey就是preloadedState里面的默认state）。
      const nextStateForKey = reducer(previousStateForKey, action) //（action为ActionTypes.REPLACE）
      if (typeof nextStateForKey === 'undefined') {
        // self previousStateForKey为undefined那么得到的nextStateForKey就是ruducer方法里面默认state，
        const actionType = action && action.type
        throw new Error(
          `When called with an action of type ${
            actionType ? `"${String(actionType)}"` : '(unknown type)'
          }, the slice reducer for key "${key}" returned undefined. ` +
            `To ignore an action, you must explicitly return the previous state. ` +
            `If you want this reducer to hold no value, you can return null instead of undefined.`
        )
      }
      // self 根据key更新store的值。就是把获得的默认state存到nextState中
      nextState[key] = nextStateForKey

      // self 执行ruducer得到的state不等于默认值里面的state，那么hasChanged为false，否则为true。
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey
    }
    // 如果finalReducerKeys里面的reducer和默认preloadedState（state）不一致那么hasChanged为true。
    hasChanged =
      hasChanged || finalReducerKeys.length !== Object.keys(state).length
      // 如果执行每个reducer得到的总state和默认preloadedState（state）值不一致，那么返回执行每个reducer得到的总的state，否则（整个循环都没有被更新过）返回默认状态preloadedState（state）。
    return hasChanged ? nextState : state
  }
}
