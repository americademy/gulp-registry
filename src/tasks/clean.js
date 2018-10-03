import del from 'del';
import util from 'util';
import {log} from '../utility';

// default task
export default function(gulp, pkg, done) {
  const globs = pkg.config.clean || [pkg.directories.dist, pkg.directories.tmp];

  return del(globs).then((paths) => {
    log('Paths deleted:', util.inspect(paths, {colors: true}));
    if (paths.length >= globs.length) {
      done();
    };
  });
};
