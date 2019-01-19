import fs  from 'fs';
import path  from 'path';
import camelCase from 'camelcase';
import parsePackageJsonName from 'parse-packagejson-name';
import filter from 'gulp-filter';
import rename from 'gulp-rename';
import uglify from 'gulp-uglify';
import sourcemaps from 'gulp-sourcemaps';
import webpack from 'webpack';
import webpackStream from 'webpack-stream';
import {logError, error} from '../utility';

// default task
export default function(gulp, pkg) {
  const { directories: dirs, config } = pkg;

  // Configure defaults based on the usual contents of `package.json`
  const shortPkgName = parsePackageJsonName(pkg.name).fullName,
    libraryName =
      config.build.libraryName || camelCase(shortPkgName, { pascalCase: true });

  // Provide 'all' as a short form of Webpack's default `_entry_return_` behaviour.
  //
  // See: <https://webpack.js.org/configuration/output/#output-libraryexport>,
  //      <https://github.com/webpack/webpack/issues/8180>
  const libraryExport =
    config.build.libraryExport === 'all' ? undefined : config.build.libraryExport;

  // choose the destination folder
  const destinationFolder = dirs.dist;

  // If not configured, we default to entering at the package's "main" file. If present, this will
  // be the ES6-module file under "module", preferentially. See:
  //   <https://github.com/dherman/defense-of-dot-js/blob/master/proposal.md#typical-usage>
  const sourceEntryPath = null != config.build.entryFile
    ? path.join(dirs.src, config.build.entryFile)
    : (null != pkg.module ? pkg.module : pkg.main);

  const sourceEntryFilename = path.basename(sourceEntryPath);

  // webpack rules
  let rules = [
    // These are processed bottom-to-top; and if the 'inline' feature is to be used with
    // worker-loader, Babel must have already run; thus this must come *before* babel-loader.
    {
      test: /\.worker\.(jsx?|tsx?)$/,
      loader: 'worker-loader',
      options: { inline: true },
    },
    {
      test: /\.(jsx?|tsx?)$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'babel-loader',
      options: {
        cacheDirectory: path.join(process.cwd(), dirs.tmp),
      }
    },
  ];

  // webpack options
  let options = {
    mode: 'development',

    resolve: { extensions: ['.wasm', '.ts', '.tsx', '.mjs', '.js', '.json'] },

    output: {

      // output paths
      path: `/${dirs.dist}/`,
      publicPath: `/${dirs.dist}/`,

      // destination file name
      filename: shortPkgName + '.js',

      // configure *how* to export our library
      libraryTarget: config.build.libraryTarget,

      // choose *which value* to export as our library
      libraryExport,

      // choose *what name* to export the above-selected value as
      library: libraryName,

      // will name the AMD module of the UMD build
      umdNamedDefine: true,

      // prefix module filename to avoid duplicates among many of our projects
      devtoolNamespace: shortPkgName

    },

    // rules
    module: { rules },

    // enable source-maps
    devtool: config.build.devtool

  };

  return gulp.src(sourceEntryPath)

    // stream webpack build
    .pipe(webpackStream(options, webpack))

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
