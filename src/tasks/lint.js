import eslint from 'gulp-eslint';
import {logError} from '../utility';

// files to watch
const files = [
  'src/**/*.js',
  'test/**/*.js',
  'gulpfile.babel.js'
];

// default task
export default function(gulp, config) {
  // Lint a set of files
  return gulp.src(files)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError())
    .on('error', logError);
};
