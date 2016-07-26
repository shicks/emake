/**
 * @fileoverview Defines an API for 'make'.
 */

'use strict';

const {exec} = require('child_process');


/**
 * Invokes make.
 * @param {!Iterable<string>} targets
 * @return {!Promise}
 */
function make(targets) {
  return new Promise((resolve, reject) => {
    const quoted = [...targets].map(target => target.replace("'", "'\\''"));
    exec("make '" + quoted.join("' '") + "'",
         (err, stdout, stderr) => {
           err ? reject(new Error('Make failed: ' + err)) : resolve();
         });
  });
}


/**
 * Returns a list of all final prerequisites of a given target.
 * This is useful for figuring out which targets are not
 * actually generated.  Omits generated targets.
 * @param {string} target
 * @return {!Promise<!Set<string>>}
 */
function getDeps(target) {
  const final = new Set();
  const seen = new Set();
  return tryGetDeps(target).then(deps => {
    const promises = [];
    for (const dep of deps) {
      if (seen.has(dep)) continue;
      seen.add(dep);
      promises.push(tryGetDeps(dep).then(more => more.size ? null : dep));
    }
    return Promise.all(promises).then(all => all.filter(x => x));
  });
}


/**
 * Returns a list of all final prerequisites of a given target.
 * This is useful for figuring out which targets are not
 * actually generated.  Attempts to omit generated targets.
 * @param {string} target
 * @return {!Promise<!Set<string>>}
 */
function tryGetDeps(target) {
  return new Promise((resolve, reject) => {
    exec("make -dn '" + target.replace("'", "'\\''") + "'",
         (err, stdout, stderr) => {
           if (err) {
             reject(new Error('Failure: ' + err));
           } else {
             resolve(findTargets(target, stdout));
           }
         });
  });
};


/**
 * @param {string} target
 * @param {string} stream
 * @return {!Set<string>}
 */
function findTargets(target, stream) {
  let started = false;
  let depth = 0;
  let lastTarget = '';
  const deps = new Set();
  for (const line of stream.split('\n')) {
    if (line.includes('Considering target file `' + target + "'.")) {
      started = true;
    } else if (started) {
      const match = /(\s*)Considering target file `(.*)'./.exec(line);
      if (match) {
        const thisDepth = match[1].length;
        if (thisDepth <= depth) deps.add(lastTarget);
        depth = thisDepth;
        lastTarget = match[2];
      }
    }
  }
  if (lastTarget) deps.add(lastTarget);
  return deps;
}


module.exports = {getDeps, make};
