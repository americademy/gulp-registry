import eslint from 'gulp-eslint';
import friendlyFormatter from 'eslint-formatter-friendly';
import { logError } from '../utility';

// default task
export default function(gulp, pkg) {
  const { config } = pkg;

  // Lint a set of files
  return gulp
    .src(config.lint)
    .pipe(eslint({ warnFileIgnored: true }))
    .pipe(eslint.format(friendlyFormatter))
    .pipe(eslint.failAfterError());
}
