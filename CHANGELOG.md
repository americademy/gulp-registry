Changelog
=========
I really should be generating this programmatically.


#### HEAD

 - (new) [Prettier][] support

    The Prettier configuration exposed by our organization configuration is supported by the
    linting tasks provided herein. There's also a new `format` task, that uses
    [`precise-commits`][precise] to apply Prettier to *only those parts of the codebase* that
    you've changed in your working-directory, to help reduce diff-noise during large
    style-refactors.

 - (new config) Adding an ES5-compatible `lib/` build-product

    The previous Webpack-powered `build` behaviour of producing a rolled-up, Web-facing
    `dist/PROJECT.js` has been renamed to `build-dist`; and a new `build-lib` has been added that
    invokes Babel directly (with no Webpack) to transparently compile, module-by-module, an
    ES5-only build of the project into `lib/`. This is intended to be shipped to npm, but *not*
    committed to Git.

    ```diff
    --- a/package.json
    +++ b/package.json
    @@ -8,6 +8,7 @@
       "main": "src/index.js",
       "files": [
         "dist/**/*",
    +    "lib/**/*",
         "src/**/*"
       ],
    ```

    Notably, `directories.lib` in the `package.json` has been deprecated in favour of
    `directories.src` (for the previous meaning thereof) and `directories.lib` (for the naming of
    the ES5-only `lib/`-analogous directory.)

 - (new) Support for building statically-typed languages

    This behaviour is opt-in; nothing needs to be changed until TypeScript or ML sources are added
    to a project. Details of the usage are presented [in the README](./README.md)!

  [Prettier]: <https://prettier.io/>
  [precise]: <https://github.com/nrwl/precise-commits>


#### v0.100

Breaking changes include further updating of developer tools, and a new config format:

 - (new) Upgrading from Babel v6 era to v7 era tools

    See: <https://babeljs.io/docs/en/next/v7-migration>; notably, `.babelrc` files may need to be
    updated as follows, after replacing the `babel-preset-env` package with the scoped
    `@babel/preset-env` package:

    ```diff
    diff --git a/.babelrc b/.babelrc
    --- a/.babelrc
    +++ b/.babelrc
    @@ -1,3 +1,3 @@
     {
    -  "presets": ["env"]
    +  "presets": ["@babel/env"]
     }
    ```

 - (new dep) Upgrading from Webpack v3 -> v4

   See: <https://webpack.js.org/migrate/4/>

   Webpack no longer builds minified builds side-by-side. This will require some thought in the
   future; but for now, I've enabled the new `'production'` mode for our builds. This means, for
   instance, that `dist/fooProject.min.js` is now just `dist/fooProject.js`

 - (new dep) Detecting webworkers with a more general pattern

   Instead of matching specifically `src/worker.js` (tightly-coupled to `physics-engine`), now any
   file in `directories.src` with an extension of `*.worker.js` will be passed thru `worker-loader`.

 - (new config) Replace milk.json with package.json for config

   Most of the tasks as-written didn't actually *use* the configuration that the README previously
   claimed you could use, and none of our internal projects seem to actually use these options.
   Nonetheless, configuration is now done via the standard `package.json` fields.

   One particular breaking change with the configuration, is that the package-name is now used
   (after camelCasing) as the default variable under which to expose the entry package — for
   instance, what was previously `new global['physics-engine'].Creator(...)` will now be exposed as
   `new PhysicsEngine.Creator(...)`.


#### v0.99

First release. Migrates the Gulp used in the legacy `milk-carton` to Gulp `v4`; see below for
migration instructions.


### Migrating from Milk Carton `~v0.0.x` to @codeverse/gulp-registry `>=v0.100.0`
Gulp 4.0.0 fundamentally changed the architecture of Gulp tasks, in such a way as to make a
"forked-gulp" CLI tool infeasible. If a project's current npm `"scripts"` use `milk` commands, you
can upgrade to Gulp 4 as follows:

1. Switch to this project:

        npm uninstall milk-carton
        npm install --save-dev gulp@4 @codeverse/gulp-registry
        npm install --save-dev @babel/preset-env
        npm install --global gulp-cli # If you haven't done so previously

2. Add a bare Gulpfile with contents analogous to the following:

        // Gulpfile.babel.js
        import gulp from 'gulp';
        import codeverseTasks from '@codeverse/gulp-registry';

        gulp.registry(codeverseTasks);

        // Set up some sort of default task; as an example,
        export default gulp.series('lint', 'build');

3. Add at least a skeletal `.babelrc` to allow the Gulpfile to be written in modern syntax:

        {
          "presets": ["@babel/env"]
        }

4. Replace the npm scripts in `package.json`; `milk X` can simply become `gulp X`.
