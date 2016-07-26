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
    (callback(items) || Promise.resolve()).then(() => {
      if (items.size) {
        setTimeout(trigger, delay);
      } else {
        timeout = false;
      }
    });
    items = new Set();
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
