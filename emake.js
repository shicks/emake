#!/usr/bin/env node

/**
 * @fileoverview Main entry point for emake utility.
 */

'use strict';

const make = require('./make');
const {debounce} = require('./debounce');
const {watch} = require('./watch');


//// TODO - for some reason, we're getting two modified events
//// for each touch...?!?

////  --- it appears that a second 'change' event is coming in?!?
////  --- we could check the modtime and/or keep a checksum...

////  -- keep a cache of modtimes in Watch


/**
 * @param {!Map<string, !Set<string>>} deps
 */
function start(deps) {
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
