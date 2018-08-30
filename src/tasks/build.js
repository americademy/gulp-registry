import fs  from 'fs';
import path  from 'path';
import filter from 'gulp-filter';
import rename from 'gulp-rename';
import uglify from 'gulp-uglify';
import sourcemaps from 'gulp-sourcemaps';
import webpackStream from 'webpack-stream';
import {logError, error} from '../utility';

// dependencies will be run prior to the default task
export let dependencies = [];

// default task
export default function(gulp, config) {

  // Choose a different version of webpack
  // otherwise null will use included version
  let wpVersion = config.wpVersion || null;

  // choose the destination folder
  let destinationFolder = path.dirname(config.mainFile);

  // determine the initial source file
  let sourceFile = path.join(config.paths.src, config.entryFileName + '.js');

  // webpack rules
  let rules = [{

    // all javascript files
    test: /\.js$/,

    // don't include node modules or bower components
    exclude: /(node_modules|bower_components)/,

    // use babel to compile for all js files
    loader: 'babel-loader',

    // optimize by caching
    options: {
      cacheDirectory: `${process.cwd()}/tmp`,
      presets: ["env"]
    }

  }, {

    // all json files for configuration
    test: /\.json$/,

    // exclude node modules or bower components
    exclude: /(node_modules|bower_components)/,

    // https://github.com/webpack-contrib/json-loader
    loader: 'json-loader'

  }]

  // append custom rules
  .concat(config.rules);

  // webpack options
  let options = {

    output: {

      // output paths
      path: `/${config.paths.build}/`,
      publicPath: `/${config.paths.build}/`,

      // destination file name
      filename: config.exportFileName + '.js',

      // configure the output library type
      libraryTarget: config.libraryTarget,

      // will name the AMD module of the UMD build
      umdNamedDefine: true,

      // configure the output variable
      library: config.mainVarName,

      // prefix module filename to avoid duplicates among many of our projects
      devtoolModuleFilenameTemplate: `webpack:///${config.mainVarName}[resource-path]`

    },

    // rules
    module: { rules },

    // enable source-maps
    devtool: 'source-map'

  };

  // plumbing error
  function errorHandler(error, stats) {
    logError(error);
    this.emit('end');
  };

  return gulp.src(sourceFile)

    // stream webpack build
    .pipe(webpackStream(options, wpVersion))

    // add compiled output to the destination folder
    .pipe(gulp.dest(destinationFolder))

    // create minified and map sources
    .pipe(filter(['*', '!**/*.js.map']))
    .pipe(rename(config.exportFileName + '.min.js'))
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(destinationFolder));
};
