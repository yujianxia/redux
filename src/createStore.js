// createStore 是redux的核心API
// 功能是创建一个 Redux store（仓库） 来以存放应用中所有的 state。（生成全局状态机）
// ** 应用中应有且仅有一个 store **


// 共享状态 -> dispatch
// store统一管理 -> dispatch, getState
// 性能优化 --> reducer是一个纯函数（这样才能够通过对比前后的state是否相等，来决定是否re-render）
// 最终初始化整个reducer



import $$observable from './utils/symbol-observable'

import ActionTypes from './utils/actionTypes'
import isPlainObject from './utils/isPlainObject'
import { kindOf } from './utils/kindOf'

/**
 * Creates a Redux store that holds the state tree. 创建一个包含状态树的 Redux 存储。
 * The only way to change the data in the store is to call `dispatch()` on it. 改变存储中数据的唯一方法是调用`dispatch()`。
 *
 * There should only be a single store in your app. To specify how different 您的应用中应该只有一个商店。指定如何不同
 * parts of the state tree respond to actions, you may combine several reducers 部分状态树响应动作，你可以组合几个reducer
 * into a single reducer function by using `combineReducers`. 通过使用 `combineReducers` 将其转换为单个 reducer 函数。
 *
 * @param {Function} reducer A function that returns the next state tree, given 参数 返回下一个状态树的函数，给定
 * the current state tree and the action to handle. 当前状态树和要处理的动作。
 *
 * @param {any} [preloadedState] The initial state. You may optionally specify it 参数 初始状态。您可以选择指定它
 * to hydrate the state from the server in universal apps, or to restore a 在通用应用程序中从服务器中补充状态，或恢复
 * previously serialized user session. 在通用应用程序中从服务器中补充状态，
 * If you use `combineReducers` to produce the root reducer function, this must be  如果你使用 `combineReducers` 来生成根 reducer 函数，这必须是
 * an object with the same shape as `combineReducers` keys. 与 `combineReducers` 键具有相同形状的对象。
 *
 * @param {Function} [enhancer] The store enhancer. You may optionally specify it 参数 商店增强器。您可以选择指定它
 * to enhance the store with third-party capabilities such as middleware, 使用中间件等第三方功能增强商店，
 * time travel, persistence, etc. The only store enhancer that ships with Redux 时间旅行、持久性等。Redux 附带的唯一存储增强器
 * is `applyMiddleware()`. 是`applyMiddleware()`。
 *
 * @returns {Store} A Redux store that lets you read the state, dispatch actions 一个 Redux 存储，可以让你读取状态，调度动作
 * and subscribe to changes. 并订阅更改
 */

// self 函数createStore接受了三个参数（reducer、preloadedState、enhancer）
// self reducer 就是我们常用的处理数据的纯函数，reducer会根据传入的state和action，返回新的state。
// self preloadedState 就是初始状态
// self enhancer 的意思是增强器，其实就是增强redux功能的函数。
export default function createStore(reducer, preloadedState, enhancer) {
  if (
    (typeof preloadedState === 'function' && typeof enhancer === 'function') || // self preloadedState和enhancer同时为函数。报错
    (typeof enhancer === 'function' && typeof arguments[3] === 'function') // enhancer为函数，第四个参数也为函数。报错
  ) {
    throw new Error(
      'It looks like you are passing several store enhancers to ' +
        'createStore(). This is not supported. Instead, compose them ' +
        'together to a single function. See https://redux.js.org/tutorials/fundamentals/part-4-store#creating-a-store-with-enhancers for an example.'
    )
  }

  // self 如果第二个参数'preloadedState是个函数' 并且 第三个参数 'enhancer为undefined'，将 preloadedState 赋值给 enhancer 后置为 undefined （preloadedState代替enhancer的作用）
  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState
    preloadedState = undefined
  }

  if (typeof enhancer !== 'undefined') { // self 判断是否为空
    if (typeof enhancer !== 'function') { // self 判断是否为function，不是则throw错误
      throw new Error(
        `Expected the enhancer to be a function. Instead, received: '${kindOf(
          enhancer
        )}'`
      )
    }

    // self 当enhancer不为空且为函数时，就执行该函数，并return回去，作为creatStore的返回值。
    // self enhancer(createStore)(reducer, preloadedState)的写法等价于如下：
    // self function enhancer(createStore) {
    // self   return (reducer,preloadedState) => {
    // self        //逻辑代码
    // self      .......
    // self   }
    // self }
    return enhancer(createStore)(reducer, preloadedState)
  }

  if (typeof reducer !== 'function') {
    throw new Error(
      `Expected the root reducer to be a function. Instead, received: '${kindOf(
        reducer
      )}'`
    )
  }
  // self 初始化数据
  let currentReducer = reducer // self 把 reducer 赋值给 currentReducer
  let currentState = preloadedState // self 把 初始状态preloadedState 赋值给 currentState
  let currentListeners = [] // self 当前订阅者列表
  let nextListeners = currentListeners // self 新的订阅事件列表，在需要修改时复制出来修改为下次快照存储数据，不影响当前订阅
  let isDispatching = false // self 用于标记是否正在进行 dispatch，用于控制 dispatch 依次调用不冲突

  /**
   * This makes a shallow copy of currentListeners so we can use 这会生成 currentListeners 的浅表副本，因此我们可以使用
   * nextListeners as a temporary list while dispatching. nextListeners 作为调度时的临时列表。
   *
   * This prevents any bugs around consumers calling 这可以防止消费者调用的任何错误
   * subscribe/unsubscribe in the middle of a dispatch. 在调度过程中订阅/取消订阅。
   */
   // self 这个函数能够根据当前监听函数的列表生成新的下一个监听函数列表引用，确保可以改变 nextListeners。没有新的监听可以始终用同一个引用
  function ensureCanMutateNextListeners() {
    // self 如果nextListeners和currentListeners为同一个引用，那么就复制一份，利用currentListeners.slice()做一个浅拷贝
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice()
    }
  }

  /**
   * Reads the state tree managed by the store. 读取存储管理的状态树。
   *
   * @returns {any} The current state tree of your application. 应用程序的当前状态树。
   */
  // self 整个项目的currentState是处于一个闭包之中，因此能一直存在，getState会返回当前最新的state。
  // self 简单的说，getState就是相似于一个获取当前数据的方法，返回currentState的值。
  function getState() {
    // self 如果正在dispatch，则报错
    if (isDispatching) {
      throw new Error(
        'You may not call store.getState() while the reducer is executing. ' +
          'The reducer has already received the state as an argument. ' +
          'Pass it down from the top reducer instead of reading it from the store.'
      )
    }

    // self 返回的是当前稳定的状态树 State。（store 的最后一个 reducer 返回值）
    return currentState
  }



  /**
   * Adds a change listener. It will be called any time an action is dispatched, 添加一个更改监听器。任何时候调度一个动作时都会调用它，
   * and some part of the state tree may potentially have changed. You may then 并且状态树的某些部分可能已经改变。那么你可以
   * call `getState()` to read the current state tree inside the callback. 用 `getState()` 来读取回调中的当前状态树。
   *
   * You may call `dispatch()` from a change listener, with the following 您可以从更改侦听器调用 `dispatch()`，使用以下命令
   * caveats: 警告
   *
   * 1. The subscriptions are snapshotted just before every `dispatch()` call. 1. 订阅在每次`dispatch()`调用之前被快照。
   * If you subscribe or unsubscribe while the listeners are being invoked, this 如果您在调用侦听器时订阅或取消订阅，这
   * will not have any effect on the `dispatch()` that is currently in progress. 不会对当前正在进行的 `dispatch()` 产生任何影响。
   * However, the next `dispatch()` call, whether nested or not, will use a more 但是，下一个 `dispatch()` 调用，无论是否嵌套，都将使用更多
   * recent snapshot of the subscription list. 订阅列表的最新快照。
   *
   * 2. The listener should not expect to see all state changes, as the state 2. 监听器不应该期望看到所有的状态变化，因为状态
   * might have been updated multiple times during a nested `dispatch()` before 在嵌套的`dispatch()` 之前可能已经更新了多次
   * the listener is called. It is, however, guaranteed that all subscribers 监听器被调用。但是，我们保证所有订阅者
   * registered before the `dispatch()` started will be called with the latest 在 `dispatch()` 开始之前注册的将被调用最新的
   * state by the time it exits. 退出时的状态。
   *
   * @param {Function} listener A callback to be invoked on every dispatch. 参数 每次分派时调用的回调。
   * @returns {Function} A function to remove this change listener. 删除此更改侦听器的函数。
   */
  // self 给store添加监听函数。nextListeners储存了整个监听函数列表。
  // self subscribe的返回值是一个unsubscribe，是一个解绑函数，调用该解绑函数，会将已经添加的监听函数删除，
  // self 该监听函数处于一个闭包之中，会一直存在，因此在解绑函数中能删除该监听函数。
  function subscribe(listener) {
    if (typeof listener !== 'function') { // self listener是state变化的回调函数，所以必须是一个function
      throw new Error(
        `Expected the listener to be a function. Instead, received: '${kindOf(
          listener
        )}'`
      )
    }

    // self 如果是正在dispatch中，就报错。因为要确保state变化时，
    // self 监听器的队列也必须是最新的。所以监听器的注册要在计算新的state之前。
    if (isDispatching) {
      throw new Error(
        'You may not call store.subscribe() while the reducer is executing. ' +
          'If you would like to be notified after the store has been updated, subscribe from a ' +
          'component and invoke store.getState() in the callback to access the latest state. ' +
          'See https://redux.js.org/api/store#subscribelistener for more details.'
      )
    }
      
    let isSubscribed = true // self 标记有订阅的 listener

    // self 其实我们曾经在dispatch中做了const listeners = (currentListeners = nextListeners)的操作，那为什么这里又要去给他做浅拷贝，保存一份快照呢？
    // self 因为有这么一种的情况存在。当redux在通知所有订阅者的时候，此时又有一个新的订阅者加进来了。如果只用currentListeners的话，当新的订阅者插进来的时候，就会打乱原有的顺序，从而引发一些严重的问题。
    ensureCanMutateNextListeners() // self 保存一份快照，不影响当前订阅的 Listeners
    nextListeners.push(listener) // self 新的订阅列表中添加一个订阅函数（传入的listener）

    // self 返回一个取消订阅的函数
    // ** unsubscribe作为返回值而不是一个独立方法的好处：将 unsubscribe 作为返回值可以按需获取，不需要移除监听的可以不取值，需要移除监听也可以一一对应，代码层级清晰明确。**
    return function unsubscribe() {
      // self 如果已经执行了取消订阅的函数，就不再执行了
      if (!isSubscribed) {
        return
      }

      // self 如果是正在dispatch中，就报错。
      if (isDispatching) {
        throw new Error(
          'You may not unsubscribe from a store listener while the reducer is executing. ' +
            'See https://redux.js.org/api/store#subscribelistener for more details.'
        )
      }

      isSubscribed = false // self 取消订阅

      ensureCanMutateNextListeners() // self 保存一份快照，不影响当前订阅的 Listeners
      const index = nextListeners.indexOf(listener) // self 新的订阅列表中找到刚刚添加的listener
      nextListeners.splice(index, 1) // self 新的订阅列表中删除刚刚添加的listener
      currentListeners = null // 将当前订阅者列表全部清除，（为什么不直接清除nextListeners？因为nextListeners表示新加入的订阅列表，新的订阅进来之后还要继续执行）
    }
  }
  // self 分析下subscribe的操作：
  // self 1，首先标记正在订阅
  // self 2，保存了一份快照
  // self 3，将新的订阅者加入nextListeners中
  // self 4，返回一个取消订阅的函数


  /**
   * Dispatches an action. It is the only way to trigger a state change. 调度一个动作。这是触发状态更改的唯一方法。
   *
   * The `reducer` function, used to create the store, will be called with the 用于创建商店的 `reducer` 函数将被调用
   * current state tree and the given `action`. Its return value will 当前状态树和给定的 `action`。它的返回值将
   * be considered the **next** state of the tree, and the change listeners 被视为树的**下一个**状态，以及更改侦听器
   * will be notified. 将另行通知。
   *
   * The base implementation only supports plain object actions. If you want to 基本实现仅支持普通对象操作。如果你想
   * dispatch a Promise, an Observable, a thunk, or something else, you need to 发送一个 Promise、一个 Observable、一个 thunk 或其他东西，你需要
   * wrap your store creating function into the corresponding middleware. For 将您的商店创建功能包装到相应的中间件中。为了
   * example, see the documentation for the `redux-thunk` package. Even the 示例，请参阅 `redux-thunk` 包的文档。即便是
   * middleware will eventually dispatch plain object actions using this method. 中间件最终将使用此方法调度普通对象操作。
   *
   * @param {Object} action A plain object representing “what changed”. It is 参数 一个简单的对象，代表“发生了什么变化”。它是
   * a good idea to keep actions serializable so you can record and replay user 保持操作可序列化的好主意，这样您就可以记录和重播用户
   * sessions, or use the time travelling `redux-devtools`. An action must have 会话，或使用时间旅行 `redux-devtools`。一个动作必须有
   * a `type` property which may not be `undefined`. It is a good idea to use 一个 `type` 属性，它可能不是 `undefined`。使用是个好主意
   * string constants for action types. 动作类型的字符串常量。
   *
   * @returns {Object} For convenience, the same action object you dispatched. 为方便起见，与您分派的操作对象相同。
   *
   * Note that, if you use a custom middleware, it may wrap `dispatch()` to 请注意，如果您使用自定义中间件，它可能会将 `dispatch()` 包装到
   * return something else (for example, a Promise you can await). 返回其他内容（例如，您可以等待的 Promise）。
   */
  // self dispatch接收一个参数action。
  // self 代码会先调用createStore传入的参数reducer方法，reducer接收当前state和action，经过判断actionType，来作对应的操做，并返回最新的currentState。
  // self dispatch还会触发整个监听函数列表，因此最后整个监听函数列表都会按顺序执行一遍。
  // self dispatch返回值就是传入的action。
  function dispatch(action) {
    // self action要求是一个简单对象，而一个简单对象就是指通过对象字面量和new Object()创建的对象，如果不是就报错。
    if (!isPlainObject(action)) {
      throw new Error(
        `Actions must be plain objects. Instead, the actual type was: '${kindOf(
          action
        )}'. You may need to add middleware to your store setup to handle dispatching other values, such as 'redux-thunk' to handle dispatching functions. See https://redux.js.org/tutorials/fundamentals/part-4-store#middleware and https://redux.js.org/tutorials/fundamentals/part-6-async-logic#using-the-redux-thunk-middleware for examples.`
      )
    }

    // self reducer内部是根据action的type属性来switch-case，决定用什么逻辑来计算state的，所以type属性是必须的。不传会报错
    if (typeof action.type === 'undefined') {
      throw new Error(
        'Actions may not have an undefined "type" property. You may have misspelled an action type string constant.'
      )
    }

    // self 如果是已经在dispatch的，就报错，避免不一致
    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.')
    }

    // self 调用 currentReducer 计算新的state，并赋值给currentState
    try {
      isDispatching = true
      currentState = currentReducer(currentState, action)
    } finally {
      isDispatching = false
    }

    // 浅拷贝新的订阅列表
    const listeners = (currentListeners = nextListeners)

    // self state更新后，将subscribe中注册的监听器的回调触发一遍
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i]
      listener()
    }

    // self 返回当前的action
    return action
  }
  // self 分析下dispach的操作：
  // self 1，将isDispatching置为true
  // self 2，根据reducer计算出新的state
  // self 3，得到新的state值，isDispatching置回false
  // self 4，一一通知订阅者state数据已经更新了


  /**
   * Replaces the reducer currently used by the store to calculate the state. 替换store当前用来计算状态的reducer。
   *
   * You might need this if your app implements code splitting and you want to 如果您的应用程序实现代码拆分并且您想要
   * load some of the reducers dynamically. You might also need this if you 动态加载一些减速器。 你可能也需要这个，如果你
   * implement a hot reloading mechanism for Redux. 为 Redux 实现热重载机制。
   *
   * @param {Function} nextReducer The reducer for the store to use instead. 参数 store 使用的 reducer。
   * @returns {void}
   */
  // self replaceReducer是替换当前的reducer的函数
  // self replaceReducer接收一个新的reducer，替换完成以后，会执行 dispatch({ type: ActionTypes.INIT }) ，用来初始化store的状态。
  // self 官方举出了三种replaceReducer的使用场景，分别是：
  // self 1，当你的程序要进行代码分割的时候
  // self 2，当你要动态的加载不一样的reducer的时候
  // self 3，当你要实现一个实时reloading机制的时候
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error(
        `Expected the nextReducer to be a function. Instead, received: '${kindOf(
          nextReducer
        )}`
      )
    }

    currentReducer = nextReducer

    // This action has a similiar effect to ActionTypes.INIT. 这个动作和 ActionTypes.INIT 有类似的效果。
    // Any reducers that existed in both the new and old rootReducer 新旧 rootReducer 中存在的任何 reducer
    // will receive the previous state. This effectively populates 将接收先前的状态。 这有效地填充
    // the new state tree with any relevant data from the old one. 包含旧状态树的任何相关数据的新状态树。
    dispatch({ type: ActionTypes.REPLACE })
  }

  /**
   * Interoperability point for observable/reactive libraries. 可观察/反应式库的互操作性点。
   * @returns {observable} A minimal observable of state changes. 状态变化的最小可观察值。
   * For more information, see the observable proposal:有关更多信息，请参阅 observable 提案：
   * https://github.com/tc39/proposal-observable
   */
  // self  Redux 内部没有用到这个方法，在测试代码 redux/test/createStore.spec.js 中有出现。

  function observable() {
    const outerSubscribe = subscribe // self 拿到订阅方法的函数
    return {
      /**
       * The minimal observable subscription method. 最小可观察订阅方法。
       * @param {Object} observer Any object that can be used as an observer. 参数 任何可以用作观察者的对象。
       * The observer object should have a `next` method. 观察者对象应该有一个 `next` 方法。
       * @returns {subscription} An object with an `unsubscribe` method that can 一个带有 `unsubscribe` 方法的对象，它可以
       * be used to unsubscribe the observable from the store, and prevent further 用于从 store 中取消订阅 observable，并防止进一步
       * emission of values from the observable. 从 observable 发射值。
       */
      // self 一个最小可观察订阅方法
      subscribe(observer) {
        // self 判断 observer 是一个对象
        if (typeof observer !== 'object' || observer === null) {
          throw new TypeError(
            `Expected the observer to be an object. Instead, received: '${kindOf(
              observer
            )}'`
          )
        }

        // self 观察者对象应该有一个 'next' 方法
        // self 观察者状态改变则获取当前 state 并调用 next 方法
        function observeState() {
          if (observer.next) {
            observer.next(getState())
          }
        }

        observeState()
        const unsubscribe = outerSubscribe(observeState)  // self 取消订阅的方法
        return { unsubscribe }
      },

      // self 返回为对象的私有属性，一般不暴露给开发者使用
      [$$observable]() {
        return this
      },
    }
  }

  // When a store is created, an "INIT" action is dispatched so that every 当一个商店被创建时，一个“INIT”动作被调度，这样每个
  // reducer returns their initial state. This effectively populates reducer 返回它们的初始状态。 这有效地填充
  // the initial state tree. 初始状态树。
  dispatch({ type: ActionTypes.INIT })

  return {
    dispatch,
    subscribe,
    getState,
    replaceReducer,
    [$$observable]: observable,
  }
}
