import glob from 'glob';
import webpack from 'webpack';
import connect from 'gulp-connect';
import livereload from 'gulp-livereload';
import webpackStream from 'webpack-stream';

import buildTask from './build.js';


// default task
export default function testBrowser(gulp, pkg) {
  const build = buildTask.bind(this, gulp, pkg);

  const { directories: dirs, config } = pkg;
  const watchFiles = [dirs.src+'/**/*', dirs.test+'/**/*', 'package.json', '**/.eslintrc.json'];

  // Our testing bundle is made up of our unit tests, which
  // should individually load up pieces of our application.
  // We also include the browser setup file.
  const unitTestFiles = glob.sync(`./${dirs.test}/unit/**/*.js`);
  const manualTestFiles = glob.sync(`./${dirs.test}/manual/**/*.js`);
  const allFiles = [`./${dirs.test}/setup/browser.js`, `./${dirs.test}/setup/manual.js`].concat(manualTestFiles).concat(unitTestFiles);
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
      mode: 'development',
      devtool: 'eval-source-map',
      output: {
        filename: '__spec-build.js',
      },
      module: {
        rules: [
          // These are processed bottom-to-top; and if the 'inline' feature is to be used with
          // worker-loader, Babel must have already run; thus this must come *before* babel-loader.
          {
            test: /\.worker\/.js$/,
            loader: 'worker-loader',
            options: { inline: true },
          },
          {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
          },
        ]
      },
      plugins: [
        // By default, webpack does `n=>n` compilation with entry files. This concatenates
        // them into a single chunk.
        new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 })
      ]
    }, webpack, function cb() {
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
    .pipe(gulp.dest(dirs.tmp));
}
