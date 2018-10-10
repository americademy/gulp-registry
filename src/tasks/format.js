import cp from 'child_process';

// default task
export default function(gulp, config) {
  return cp.spawn("precise-commits", { stdio: 'inherit' });
};
