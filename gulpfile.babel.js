import gulp from 'gulp';
import codeverseTasks from './src/registry.js';

gulp.registry(codeverseTasks);

export default gulp.series('lint', 'build', 'test');
