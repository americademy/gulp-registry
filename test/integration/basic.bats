#!/usr/bin/env bats
load ../setup/bats_helpers

ensure_npm

setup() {
  eval_once_on_setup 'setup_single_directory'
  export TDIR="$(get_single_directory)"

  eval_once_on_setup 'copy_node_modules'
  eval_once_on_setup 'install_this_module'

  cd "$TDIR"
  pute "Test directory: '$TDIR'"
  setup_gulpfile
}

setup_gulpfile() {
  cat <<'GULPFILE' >gulpfile.js
const gulp = require('gulp');
const codeverseTasks = require('@codeverse/gulp-registry');

gulp.registry(codeverseTasks);

GULPFILE
}


@test "... test setup ..." {
  [ -d node_modules ]
  [ -f gulpfile.js ]

  run gulp --version
  [ $status -eq 0 ]

  echo "$output"
  [[ "$output" == *"CLI version"* ]]
  [[ "$output" == *"Local version"* ]]
}

@test "adds some Gulp tasks" {
  run gulp --tasks-simple
  echo "$output"
  task_count="$(echo "$output" | wc -l)"
  echo "$task_count"
  [ "$task_count" -gt 1 ]
}
