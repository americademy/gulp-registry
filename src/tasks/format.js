import fs from 'fs';
import path from 'path';
import gStatus from 'g-status';
import { prompt } from 'enquirer';
import cp from 'child_process';

// TODO: This should probably be published as a separate microlib. ¯\_(ツ)_/¯ — ELLIOTTCABLE

function preciseCommits(done) {
  const process = cp.spawn('precise-commits', { stdio: 'inherit' });
  return process.on('exit', code => {
    if (code === 0) {
      return done();
    }
    return done(code);
  });
}

function checkGitRepo(done) {
  gStatus({ workingTree: 'MD' }).then(modifiedFiles => {
    if (modifiedFiles.length === 0) {
      // The user's working-directory is clean of unstaged changes
      return preciseCommits(done);
    } else {
      // The user has any changed files that haven't been staged
      console.error(
        '@codeverse/gulp-registry: You have dirty (non-staged) chages that `precise-\n' +
          '    commits` might overwrite! It may be advisable to stage those changes, so\n' +
          '    you can see exactly what reformats Prettier applies.',
      );

      return prompt({
        type: 'toggle',
        name: 'continue',
        message: 'Are you sure you want to overwrite your changes without staging them?',
      }).then(response => {
        if (response.continue) {
          return preciseCommits(done);
        } else {
          return done(new Error('User denied formatting'));
        }
      });
    }
  });
}

// default task
export default function(gulp, config, done) {
  const prettierrc = path.join(process.cwd(), '.prettierrc.js'),
    prettierrc_default = path.resolve(__filename, '../../../.prettierrc.js');

  // If the prettierrc doesn't exist, copy it from the root of this project
  return fs.copyFile(prettierrc_default, prettierrc, fs.constants.COPYFILE_EXCL, err => {
    if (err && err.code === 'EEXIST') {
      // If .prettierrc.js exists, we can continue and invoke precise-commits
      return checkGitRepo(done);
    } else if (err) {
      // If there's any other error, throw it
      throw err;
    } else {
      // If the file was successfully copied, report as much to the user, and invoke precise-commits
      console.warn(
        "@codeverse/gulp-registry: I've added a default .prettierrc.js; make sure to commit it!",
      );
      return checkGitRepo(done);
    }
  });
}
