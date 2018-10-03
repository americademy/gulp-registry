import connect from 'gulp-connect';

// Lets us differentiate between the first build and subsequent builds
let firstBuild = true;

// default task
export default function startServer(gulp, config) {

  // configuration based on initial build or not
  let startOrReload = firstBuild ? 'server' : 'reload';
  let options = firstBuild ? {
    root: process.cwd(),
    debug: true,
    livereload: true
  } : null;

  // start or reload the server
  connect[startOrReload](options);

  // no longer the first build
  firstBuild = false;

};
