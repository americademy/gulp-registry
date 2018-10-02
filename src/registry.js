import fs from 'fs';
import util from 'util';
import path from 'path';
import _merge from 'lodash.merge';
import pkgDefaults from './config.json';
import DefaultRegistry from 'undertaker-registry';


function CodeverseGulpRegistry() {
  DefaultRegistry.call(this);
}
util.inherits(CodeverseGulpRegistry, DefaultRegistry);

CodeverseGulpRegistry.prototype.init = function(gulp) {
  const pkgPath = `${process.cwd()}/package.json`;
  if (!fs.existsSync(pkgPath)) {
    throw new Error('This project has no `package.json` yet!')
  }

  const overrides = require(pkgPath)
      , pkg = _merge(pkgDefaults, overrides);

  // Grab all the tasks
  const tasks = fs
    .readdirSync(path.join(__dirname, 'tasks'))
    .filter(function(file) {
      return path.extname(file) === '.js'
    })
    .map(function(file) {
      return file.replace('.js', '');
    });

  // Load all the tasks and pass in config
  tasks.forEach(function(name) {
    // require gulp task and extract and bind the task function
    const task = require('./tasks/' + name);
    const fn = task.default.bind(this, gulp, pkg);

    // create gulp task
    gulp.task(name, fn);
  });
};


export default new CodeverseGulpRegistry();
