import path from 'path';
import babel from 'gulp-babel';
import sourcemaps from 'gulp-sourcemaps';

export default function(gulp, pkg) {
  const { directories: dirs, config } = pkg;

  const inputs = config.build.transpileGlobs.map(g => `${dirs.src}/${g}`);

  // choose the destination folder
  const destinationFolder = dirs.es5;

  return gulp.src(inputs, { matchBase: true })
    .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(babel())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(destinationFolder));
}
