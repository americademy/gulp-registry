// files to watch
const watchFiles = [
  './src/**/*',
  './objects/**/*.js',
  './test/**/*',
  './package.json',
  './gulpfile.babel.js',
  './**/.eslintrc',

  // ignore
  '!./src/objects.js'
];

// default task
export default function(gulp, config) {
  // return gulp.watch(watchFiles, ['test']);
  return gulp.watch(watchFiles, ['build']);
};
