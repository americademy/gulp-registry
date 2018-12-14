import _ from 'lodash';
import path  from 'path';
import camelCase from 'camelcase';
import parsePackageJsonName from 'parse-packagejson-name';
import nodeExternals from 'webpack-node-externals';
import {logError, error} from '../utility';

import MochaWebpack from 'mocha-webpack';
import mochaWebpackParseArgv from 'mocha-webpack/lib/cli/parseArgv';
import { ensureGlob, extensionsToGlob } from 'mocha-webpack/lib/util/glob';
import { existsFileSync } from 'mocha-webpack/lib/util/exists';

function resolve(mod) {
  const absolute = existsFileSync(mod) || existsFileSync(`${mod}.js`);
  const file = absolute ? path.resolve(mod) : mod;
  return file;
}

// NOTE: Most of this is copied, verbatim, from `mocha-webpack/lib/cli/index.js`. This is *very*
//       tightly coupled to mocha-webpack's (non-)API, at the moment; here's hoping they clean their
//       interface up a bit before releasing v2.0.0 for real! — ELLIOTTCABLE
function invokeMochaWebpack(configOptions = {}) {
  // If no `--` is found, we assume something like `['node', 'gulp', 'test', ...]`. This will break
  // if there's more than one task passed, but in that case, you should really be using `--`.
  const separatorIndex = process.argv.indexOf('--');
  const argv = process.argv.slice(separatorIndex !== -1 ? separatorIndex : 3);

  console.log(process.argv)
  console.log(argv)

  const cliOptions = mochaWebpackParseArgv(argv, /* ignoreDefaults: */true)
    , defaultOptions = mochaWebpackParseArgv([])
    , options = _.defaults({}, cliOptions, configOptions, defaultOptions)
    , mochaWebpack = new MochaWebpack();

  if (null == options.glob) {
    const extensions = _.get(options.webpackConfig, 'resolve.extensions', ['.js']);
    options.glob = extensionsToGlob(extensions);
  }

  console.log('Testing files matching:', options.files);

  options.require.forEach((mod) => require(resolve(mod)));
  options.include.forEach((f) => mochaWebpack.addInclude(resolve(f)));
  options.files.forEach((f) => mochaWebpack.addEntry(ensureGlob(f, options.recursive, options.glob)));

  mochaWebpack.cwd(process.cwd());
  mochaWebpack.webpackConfig(options.webpackConfig);
  mochaWebpack.bail(options.bail);
  mochaWebpack.reporter(options.reporter, options.reporterOptions);
  mochaWebpack.ui(options.ui);
  mochaWebpack.interactive(options.interactive);

  if (options.fgrep) { mochaWebpack.fgrep(options.fgrep); }
  if (options.grep) { mochaWebpack.grep(options.grep); }
  if (options.invert) { mochaWebpack.invert(); }
  if (options.checkLeaks) { mochaWebpack.ignoreLeaks(false); }
  if (options.fullTrace) { mochaWebpack.fullStackTrace(); }
  if (options.quiet) { mochaWebpack.quiet(); }

  mochaWebpack.useColors(options.colors);
  mochaWebpack.useInlineDiffs(options.inlineDiffs);
  mochaWebpack.timeout(options.timeout);

  if (options.retries) { mochaWebpack.retries(options.retries); }

  mochaWebpack.slow(options.slow);

  if (options.asyncOnly) { mochaWebpack.asyncOnly(); }
  if (options.delay) { mochaWebpack.delay(); }
  if (options.growl) { mochaWebpack.growl(); }

  return new Promise(resolve => setTimeout(function() {
    resolve(options.watch ? mochaWebpack.watch() : mochaWebpack.run())
  }, 2500));
}


export default function(gulp, pkg) {
  const { directories: dirs, config } = pkg;

  // Configure defaults based on the usual contents of `package.json`
  const shortPkgName = parsePackageJsonName(pkg.name).fullName
      , libraryName = config.build.libraryName || camelCase(shortPkgName, {pascalCase: true});

  // Provide 'all' as a short form of Webpack's default `_entry_return_` behaviour.
  //
  // See: <https://webpack.js.org/configuration/output/#output-libraryexport>
  const libraryExport = config.build.libraryExport === 'all'
    ? '_entry_return_'
    : config.build.libraryExport;

  // choose the destination folder
  const destinationFolder = dirs.dist;

  // determine the initial source file
  const sourceEntryPath = config.build.entryFile
    ? path.join(dirs.lib, config.build.entryFile)
    : pkg.main;

  const sourceEntryFilename = path.basename(sourceEntryPath);

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
      cacheDirectory: path.join(process.cwd(), dirs.tmp),
    }

  }]

  // webpack options
  let options = {
    mode: 'development',

    // Tell Webpack to compile for Node.js (and thus Mocha); and to ignore node_modules.
    // See: <http://zinserjan.github.io/mocha-webpack/docs/installation/webpack-configuration.html>
    target: 'node',

    // FIXME: This is currently not working; maybe I don't understand the purpose. See:
    //        zinserjan/mocha-webpack#296.
    // externals: [nodeExternals({
    //   whitelist: [/^@codeverse/]
    // })],

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

  return invokeMochaWebpack({
    files: [dirs.test],
    recursive: true,
    webpackConfig: options
  })
};
