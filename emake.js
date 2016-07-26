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
  console.error('Watching\n  ' + [...deps.keys()].join('\n  '));
  watch(deps.keys(), debounce(function(modified) {
    const targets = new Set();
    for (const file of modified) {
      for (const target of (deps.get(file) || [])) {
        targets.add(target);
      }
    }
    console.error('Rebuilding ' + [...targets].join(' '));
    return make.make(targets).then(
      done => console.error('Done'),
      err => console.error('Failure: ' + err));
  }, 50));
}


// TODO(sdh): also kick off an initial make...?
// TODO(sdh): `make -pn` to find out phony targets
//   - expand them one level before anything else...
//   - that way 'emake all' only remakes what's needed.


Promise.all(process.argv.slice(2).map(make.getDeps)).then(results => {
  const /** !Map<string, !Set<string>> */ deps = new Map();
  for (let i = 0; i < results.length; i++) {
    for (const dep of results[i]) {
      deps.set(dep, deps.get(dep) || new Set());
      deps.get(dep).add(process.argv[i + 2]);
    }
  }
  start(deps);
}, err => {
  console.error(
      'Failed to get dependencies for ' + process.argv.slice(2).join(' '));
  process.exit(1);
});
