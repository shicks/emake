/**
 * @fileoverview Basic debouncing functionality.
 */

'use strict';

/**
 * @param {function(!Set<T>): (?Promise|undefined)} callback
 * @param {number} delay
 * @return {function(T)}
 */
function debounce(callback, delay) {
  let timeout = false;
  let items = new Set();

  function trigger() {
    items = new Set();
    (callback(items) || Promise.resolve()).then(() => { timeout = false; });
  }

  return function(item) {
    items.add(item);
    if (!timeout) {
      timeout = true;
      setTimeout(trigger, delay);
    }
  }
}


module.exports = {debounce};
