#!/usr/bin/env node

/**
 * @fileoverview Main entry point for emake utility.
 */

'use strict';

const make = require('./make');
const {debounce} = require('./debounce');
const {watch} = require('./watch');

/**
 * @param {!Map<string, !Set<string>>} deps
 */
function start(deps) {
  watch(deps.keys(), debounce(function(modified) {
    const targets = new Set();
    for (const file of modified) {
      for (target of (deps.get(file) || [])) {
        targets.add(target);
      }
    }
    return make.make(targets);
  }, 25));
}


Promise.all(process.argv.slice(2).map(make.getDeps)).then(results => {
  const /** !Map<string, !Set<string>> */ deps = new Map();
  for (let i = 0; i < results.length; i++) {
    for (const dep of results[i]) {
      deps.set(dep, deps.get(dep) || new Set());
      deps.get(dep).add(process.argv[i + 2]);
    }
  }
  start(deps);
});
