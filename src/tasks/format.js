import cp from 'child_process';

// default task
export default function(gulp, config) {
  // Lint a set of files
  return cp.spawn("precise-commits", { stdio: 'inherit' });
};
