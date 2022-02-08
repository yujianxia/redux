// self 整个代码的入口文件

import createStore from './createStore'
import combineReducers from './combineReducers'
import bindActionCreators from './bindActionCreators'
import applyMiddleware from './applyMiddleware'
import compose from './compose'
import warning from './utils/warning'
import __DO_NOT_USE__ActionTypes from './utils/actionTypes'


// self 这里的 isCrushed 函数主要是为了验证在非生产环境下 redux 是否被压缩（默认状况下，isCrushed.name等于isCrushed，
// self 若是被压缩了，函数的名称会变短，通常会压缩成数字，那么 (isCrushed.name !== 'isCrushed') 就是 true），若是被压缩，就给开发者一个 warn 提示）。
/*
 * This is a dummy function to check if the function name has been altered by minification. 这是一个虚拟函数，用于检查函数名称是否已被缩小更改。
 * If the function has been minified and NODE_ENV !== 'production', warn the user. 如果函数已被缩小并且 NODE_ENV !== 'production'，警告用户。
 */
function isCrushed() {}

// self 在非生产环境并且代码被压缩，就会提示warning信息
if (
  process.env.NODE_ENV !== 'production' && // 不是生产环境
  typeof isCrushed.name === 'string' && // 函数名为string
  isCrushed.name !== 'isCrushed' // 函数名不等于 ‘isCrushed’
) {
  warning(
    'You are currently using minified code outside of NODE_ENV === "production". ' +
      'This means that you are running a slower development build of Redux. ' +
      'You can use loose-envify (https://github.com/zertosh/loose-envify) for browserify ' +
      'or setting mode to production in webpack (https://webpack.js.org/concepts/mode/) ' +
      'to ensure you have the correct code for your production build.'
  )
}

// self 暴露主要的API给开发者使用
export {
  createStore,
  combineReducers,
  bindActionCreators,
  applyMiddleware,
  compose,
  __DO_NOT_USE__ActionTypes,
}
