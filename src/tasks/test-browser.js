import glob from 'glob';
import webpack from 'webpack';
import connect from 'gulp-connect';
import webpackStream from 'webpack-stream';

// dependencies will be run prior to the default task
export let dependencies = [];

// default task
export default function(gulp, config) {
  // Our testing bundle is made up of our unit tests, which
  // should individually load up pieces of our application.
  // We also include the browser setup file.
  const unitTestFiles = glob.sync('./test/unit/**/*.js');
  const manualTestFiles = glob.sync('./test/manual/**/*.js');
  const allFiles = ['./test/setup/browser.js', './test/setup/manual.js'].concat(manualTestFiles).concat(unitTestFiles)

  // This empty stream might seem like a hack, but we need to specify all of our files through
  // the `entry` option of webpack. Otherwise, it ignores whatever file(s) are placed in here.
  return gulp.src('')
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
    }, null))
    .pipe(gulp.dest('./tmp'));
}
