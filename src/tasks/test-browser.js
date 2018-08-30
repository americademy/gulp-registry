import glob from 'glob';
import webpack from 'webpack';
import connect from 'gulp-connect';
import livereload from 'gulp-livereload';
import webpackStream from 'webpack-stream';

import buildTask from './build.js';


// dependencies will be run prior to the default task
export let dependencies = [];

// default task
export default function(gulp, config) {
  const build = buildTask.bind(this, gulp, config);

  const { paths } = config;
  const watchFiles = [paths.src+'/**/*', paths.tests+'/**/*', 'package.json', '**/.eslintrc.json'];

  // Our testing bundle is made up of our unit tests, which
  // should individually load up pieces of our application.
  // We also include the browser setup file.
  const unitTestFiles = glob.sync(`./${paths.tests}/unit/**/*.js`);
  const manualTestFiles = glob.sync(`./${paths.tests}/manual/**/*.js`);
  const allFiles = [`./${paths.tests}/setup/browser.js`, `./${paths.tests}/setup/manual.js`].concat(manualTestFiles).concat(unitTestFiles);
  console.log('Test-files loaded:', allFiles.length);
  console.log('Test-files:', allFiles);

  // Lets us differentiate between the first build and subsequent builds
  let firstBuild = true;

  // This empty stream might seem like a hack, but we need to specify all of our files through
  // the `entry` option of webpack. Otherwise, it ignores whatever file(s) are placed in here.
  return gulp.src('this-file-doesnt-exist.js', { allowEmpty: true })
    .pipe(webpackStream({
      watch: true,
      entry: allFiles,
      output: {
        filename: '__spec-build.js',
      },
      module: {
        loaders: [
          // This is what allows us to author in future JavaScript
          { test: /\.js$/, exclude: /(node_modules|src\/workers)/, loader: 'babel-loader' },
          // This allows the test setup scripts to load `package.json`
          { test: /\.json$/, exclude: /node_modules/, loader: 'json-loader' },
          // This allows the test setup scripts to load `package.json`
          { test: /src\/workers\/.js$/, exclude: /node_modules/, loader: 'worker-loader' }
        ]
      },
      plugins: [
        // By default, webpack does `n=>n` compilation with entry files. This concatenates
        // them into a single chunk.
        new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 })
      ],
      devtool: 'inline-source-map'
    }, null, function() {
      if (firstBuild) {
        livereload.listen({port: 35729, host: 'localhost', start: true});
        gulp.watch(watchFiles).on('all', build);
      } else {
        setTimeout(function() {
          livereload.reload('./tmp/__spec-build.js');
        }, 1000);
      }
      firstBuild = false;
    }))
    .pipe(gulp.dest('./tmp'));
}
