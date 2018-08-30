import fs from 'fs';
import util from 'util';
import path from 'path';
import defaults from './config';
import DefaultRegistry from 'undertaker-registry';


function CodeverseGulpRegistry() {
  DefaultRegistry.call(this);
}
util.inherits(CodeverseGulpRegistry, DefaultRegistry);

CodeverseGulpRegistry.prototype.init = function(gulp) {
  // get the local milk config file if it exists
  const configPath = `${process.cwd()}/milk.json`;
  let overrides = false;
  if (fs.existsSync(configPath)) {
    overrides = require(configPath);
  }

  // merge configuration if we have overrides
  const config = overrides ? Object.assign(defaults, overrides || {}) : defaults;

  // Grab all the tasks
  const tasks = fs
    .readdirSync(path.join(__dirname, 'tasks'))
    .map(function(file) {
      return file.replace('.js', '');
    });

  // Load all the tasks and pass in config
  tasks.forEach(function(name) {
    // require gulp task and extract and bind the task function
    const task = require('./tasks/' + name);
    const fn = task.default.bind(this, gulp, config);

    // create gulp task
    gulp.task(name, fn);
  });
};


export default new CodeverseGulpRegistry();
