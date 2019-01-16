import path from 'path';
import print from 'gulp-print';
import tap from 'gulp-tap';
import merge from 'merge2';
import filter from 'gulp-filter';
import PluginError from 'plugin-error';

import babel from 'gulp-babel';
import sourcemaps from 'gulp-sourcemaps';

export default function(gulp, pkg) {
  const { directories: dirs, config } = pkg;
  let usingTypescript = false;

  // choose the destination folder
  const destinationFolder = dirs.es5;

  const inputs = config.build.transpileGlobs.map(g => {
    // Horribly hacky heuristic (*~ HHH ~*) to try and tell if I'm being told to transpile
    // TypeScript. lol. — ELLIOTTCABLE
    if ('!' !== g[0] && /\btsx?\b/.test(g)) {
      usingTypescript = true;
    }
    return `${dirs.src}/${g}`;
  });

  // We should probably use `gulp-typescript`'s `tsProject.src()` feature to obtain the paths of
  // TypeScript sources, to maintain a single source of truth ...
  const stream = gulp.src(inputs, { matchBase: true })
    .pipe(sourcemaps.init({ loadMaps: true }));

  if (!usingTypescript) {
    return stream
      .pipe(babel())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(destinationFolder));

  } else {
    let gulpTypescript;
    try {
      gulpTypescript = require('gulp-typescript');
    } catch (e) {
      throw new PluginError('@codeverse/gulp-registry',
        'The TypeScript peer-dependency is missing, and `tsx?` is present in' +
        '\n    `transpileGlobs`. Either add the former, or remove the latter.');
    }

    const typedStream = stream
      .pipe(filter('**/*.{ts,tsx}'))
      .pipe(gulpTypescript.createProject('tsconfig.json', {
        rootDir: dirs.src,
        outDir: destinationFolder,
        declaration: true,
        isolatedModules: false,
        noEmit: false,
        noEmitOnError: false,
      })());

    // FIXME: Second horrible hack, this time to discard the emitted output. Pending
    //        ivogabe/gulp-typescript#607.
    typedStream.js.emit('end');

    return merge(
      typedStream.dts
        .pipe(print(f => `dts: ${f}`))
        .pipe(gulp.dest(destinationFolder)),
      stream
        .pipe(babel())
        .pipe(print(f => `babel: ${f}`))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(destinationFolder))
    );
  }
}
