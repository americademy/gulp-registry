shopt -s expand_aliases
alias trace-on='set -x'
alias trace-off='{ set +x; } 2>/dev/null'
puts() { printf %s\\n "$@" ;}
pute() { printf %s\\n "~~ $*" >&2 ;}

TEST_FIXTURE="${BATS_TEST_FILENAME%.*}.fixtures/"


# Crash out if somebody tries to run these directly. Call from the root of a testfile.
ensure_npm() {
  if [[ -z "$npm_package_name" ]]; then
    pute 'These tests must be run via npm!'
    pute 'Ensure the `package.json` contains a `bats` invocation for "test", and then:'
    pute ''
    pute '   $ npm test'
    exit 1
  fi
}

# Yes. This uses `eval`. My kingdom for UNIX-shell lambdas. This is no safer than any other `eval`;
# call only with static strings. Call from within `setup()`.
eval_once_on_setup() {
  if [[ "$BATS_TEST_NUMBER" -eq 1 ]]; then
    eval "$1"
  fi
}


# When included in the `setup()` for a testfile, this creates a new directory for each test, copying
# the fixtures (if any) into that directory, and exports the path to that directory as `$TDIR`. Call
# within `setup()`.
setup_individual_directory() {
  filename="${BATS_TEST_FILENAME##*/}"
  TDIR="$BATS_TMPDIR/$filename-$BATS_TEST_NUMBER"
  pute "$TDIR"

  # First, wipe out the results of any previous runs,
  if [[ -e "$TDIR" ]]; then
    rm -rf "$TDIR" || exit 1
  fi

  # Then, either a fixture exists, which we can copy ...
  if [[ -d "$TEST_FIXTURE" ]]; then
    cp -r "$TEST_FIXTURE" "$TDIR" || exit 1
  fi

  # ... or we need to make the directory afresh.
  mkdir -p "$TDIR" || exit 1

  export TDIR
}

# This prints the path to the directory prepared by `setup_individual_directory`.
get_individual_directory() {
  filename="${BATS_TEST_FILENAME##*/}"
  TDIR="$BATS_TMPDIR/$filename"

  puts "$TDIR"
}

# When included in the `setup()` for a testfile, this creates a new directory for the entire
# testfile, copying the fixtures (if any) into that directory. Call via `eval_once_on_setup`.
setup_single_directory() {
  TDIR="$(get_single_directory)"

  # First, wipe out the results of any previous runs,
  if [[ -e "$TDIR" ]]; then
    rm -rf "$TDIR" || exit 1
  fi

  # Then, either a fixture exists, which we can copy ...
  if [[ -d "$TEST_FIXTURE" ]]; then
    cp -r "$TEST_FIXTURE" "$TDIR" || exit 1
  fi

  # ... or we need to make the directory afresh.
  mkdir -p "$TDIR" || exit 1
}

# This prints the path to the directory prepared by `setup_single_directory`.
get_single_directory() {
  filename="${BATS_TEST_FILENAME##*/}"
  TDIR="$BATS_TMPDIR/$filename"

  puts "$TDIR"
}


# Copy the parent-projects' dependencies into the test directory. Call in `setup()` (after
# `setup_individual_directory`), or via `eval_once_on_setup` (after `setup_single_directory`.)
copy_node_modules() {
  if [[ -d "$TDIR" ]]; then
    cp -r "$BATS_CWD/node_modules/" "$TDIR/node_modules"
  else
    pute 'copy_node_modules must be called after one of the directory-setup functions!'
    exit 1
  fi
}

install_this_module() {
  cd "$BATS_CWD"
  pack="$('ls' -- *"-$npm_package_version.tgz")"
  if [[ -z "$pack" ]] || [[ ! -f "$BATS_CWD/$pack" ]]; then
    puts ''
    pute 'These tests require that `npm pack` be run before the test-suite.'
    pute 'Consider adding it to your npm "scripts":'
    pute ''
    pute '   "scripts": {'
    pute '      ...,'
    pute '      "test": "npm pack && bats **/*.bats"'
    pute '   }'
    puts ''
    exit 1
  fi
  cd "$TDIR"
  npm install --no-audit --only=production "$BATS_CWD/$pack"
}
