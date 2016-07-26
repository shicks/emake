/**
 * @fileoverview Wraps fs.watch in a way that handles creates/deletes.
 */

'use strict';

const fs = require('fs');

class Watch {
  constructor(
      /** function(string) */ callback, /** !Iterable<string>} */ files) {
    this.callback = callback;
    this.missing = new Set(files);
    this.timeout = false;
    this.check(false);
  }

  handle(file, event) {
    if (event == 'change') {
      this.callback(file);
    } else if (event == 'rename') {
      this.missing.add(file);
      if (!this.timeout) {
        setTimeout(() => this.check(true), 1000);
        this.timeout = true;
      }
    }
  }

  check(fire) {
    this.timeout = false;
    const files = [...this.missing];
    this.missing.clear();
    for (const file of files) {
      try {
        fs.watch(file, (event) => this.handle(file, event));
        if (fire) this.callback(file);
      } catch (err) {
        this.missing.add(file);
      }
    }
    if (this.missing.size) {
      setTimeout(() => this.check(true), 1000);
      this.timeout = true;
    }
  }
}

function watch(files, callback) {
  new Watch(callback, files);
  // TODO(sdh): Return something we can kill?
}


module.exports = {watch};
