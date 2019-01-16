// default task
export default function watch(gulp, pkg) {
  const { directories: dirs, config } = pkg;

  // files to watch
  const watchFiles = [
    `./${dirs.src }/**/*`,
    `./${dirs.test}/**/*`,
  ];

  // return gulp.watch(watchFiles, ['test']);
  return gulp.watch(watchFiles, ['build']);
};
