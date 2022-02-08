/**
 * Prints a warning in the console if it exists. 如果有警告信息就在控制台打印
 *
 * @param {String} message The warning message. 参数 警告信息
 * @returns {void}
 */
export default function warning(message) {
  /* eslint-disable no-console */
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error(message)
  }
  // self 下面是为了兼容ie8做的判断
  /* eslint-enable no-console */
  try {
    // This error was thrown as a convenience so that if you enable
    // "break on all exceptions" in your console,
    // it would pause the execution at this line.
    throw new Error(message)
  } catch (e) {} // eslint-disable-line no-empty
}
