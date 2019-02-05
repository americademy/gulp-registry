Codeverse Gulp Registry
-----------------------
Company-wide test- and build-tooling.

Installation
============

To install for use in your project:

    npm install --save-dev @codeverse/gulp-registry

Usage
=====

Add these lines near the top of your `gulpfile`:

        var codeverseTasks = require('@codeverse/gulp-registry');
        gulp.registry(codeverseTasks);

        // You can define new tasks below here; for instance, adding a single task that runs
        // multiple other tasks:
        gulp.task('build');

### Configuration

The tasks contained herein are configured by entries in each project's `package.json`. See
[`src/config.json`](src/config.json) for example configuration options; although most will be
automatically deduced from the usual contents of `package.json`.

### Building JavaScript targets

Support for several compile-to-JS systems is included here. Babel and Webpack work together to
produce several builds of the library for each project:

- `src/`: Contains the hand-written source-code of the project. May be in multiple compile-to-JS
  languages, or expect multiple subsets of ESNext features in JavaScript sources.
- `lib/` (configurable as `directories.es5`): Will contain compiled, pure-JavaScript sources, at
  a predictable level of modern JavaScript functionality. Notably, will depend on CommonJS
  `require()`-style runtime inclusion, *not* modern ES6 compile-time-resolved modules.
- `dist/` (configurable as `directories.dist`): Will contain various compiled, web-packed JavaScript
  distributions, including sourcemapped and minified builds. By default, these will be
  UMD-wrapped, and thus may produce globals when included.

(TODO: Eventually, this may/should include an ES6-module build for Rollup/Webpack library-consumption.)

#### TypeScript

If your project includes TypeScript source-code, both the building tasks (`build-lib`,
`build-dist`, etc) and the `lint` task can be made TypeScript-aware.

Notably, we *do not* use TypeScript itself to do the compilation — the holistic, project-aware
compiler is notoriously slow; and that would add an extra tool to the already-complex build
toolchain. Instead, we simply allow Babel to *strip* TypeScript types, and thereafter treat
the result as plain JavaScript. This means *you will not get type-errors from TypeScript upon
build.* We make up for this by integrating the TypeScript compiler into ESlint, reporting
type-errors during linting. (It's also suggested that you add a TypeScript server into your local
developer setup, and integrate it with your editor; type-errors are much easier to handle in a
tight feedback loop!)

1. Install TypeScript, and add [`@babel/preset-typescript`][preset-ts] to the project's
   Babel configuration, as necessary:

   ```sh
   npm install --save-dev typescript @babel/preset-typescript
   ```

   ```diff
   --- a/.babelrc
   +++ b/.babelrc
   @@ -1,3 +1,6 @@
    {
   -  "presets": ["@babel/env"]
   +  "presets": [
   +    "@babel/env",
   +    "@babel/typescript"
   +  ]
    }
   ```

2. Commit a [`tsconfig.json`][tsconfig] to the project, extending from our organization-wide
   config, something like this:

   ```json5
   {
     "extends": "./node_modules/@codeverse/eslint-config/tsconfig.json",
     "include": [
       "src/**/*"
     ],
     "exclude": [
       "node_modules",
       "**/*.spec.ts"
     ]
   }
   ```

   (Note that there are a few `compilerOptions` you *should not override* when using these
   build-tasks: `moduleResolution` and `esModuleInterop` are necessary for the linter-integrated
   TypeScript, as well as your collaborator's editor-local tooling, to agree with the Babel
   build-system about what a particular module-import means; `noEmit` prevents TypeScript from
   being accidentally configured to try and produce compilation products; and finally,
   `isolatedModules` ensures TypeScript tooling doesn't pass any features that Babel can't
   understand or compile.)

3. Go forth and write typed code! Simply import a TypeScript module the same way you would a
   JavaScript file, with no extension:

   ```js
   // imports from ./blah.ts preferentially
   import Blah from './blah';
   ```

  [preset-ts]: <https://babeljs.io/docs/en/babel-preset-typescript>
  [tsconfig]: <https://www.typescriptlang.org/docs/handbook/tsconfig-json.html>

#### ML (OCaml, ReasonML)

For stricter typing, safer analysis, and more efficient compilation, you can write ML alongside
your JavaScript and TypeScript. This build-system will compile the ML thru [BuckleScript][].

1. Install BuckleScript, and add [`babel-plugin-bucklescript`][plugin-bs] to the project's
   Babel configuration, as necessary (note that it's a `"plugin"`, not a `"preset"` like the
   TypeScript above!):

   ```sh
   # To counter a bug in babel-plugin-bucklescript, this is currently pre-included in the
   # gulp-registry installation.
   #npm install --save-dev babel-plugin-bucklescript
   npm install --save-dev bs-platform

   # If you've never used ReasonML or BuckleScript before, you should probably consider install a
   # global copy of the editor-tooling, as well:
   npm install --global reason-cli
   ```

   ```diff
   --- a/.babelrc
   +++ b/.babelrc
   @@ -1,3 +1,6 @@
    {
      "presets": [
        "@babel/env"
   +  ],
   +  "plugins": [
   +    "bucklescript"
      ]
    }
   ```

2. As we've opted to have ML compiled in-place (to ensure that `src/` contains a complete copy, in
   *some* flavour of JavaScript, of each library), you should allow to be committed to the
   repository. However, you probably don't want generated JavaScript showing up in diffs and
   pull-requests, so you should update `.gitattributes` with the following:


   ```diff
   --- a/.gitattributes
   +++ b/.gitattributes
   @@ -1,4 +1,6 @@
    dist/**/*.js            linguist-generated -diff
    dist/**/*.map           linguist-generated -diff

   +src/**/*.bs.js          linguist-generated -diff
   +
    package-lock.json       linguist-generated -diff
   ```

   There's also a lot of cruft involved in the compilation of a native language like OCaml, so you
   should probably add some of that to the project's `.gitignore`:

   ```diff
   --- a/.gitignore
   +++ b/.gitignore
   @@ -25,6 +25,12 @@ testem.log
   .DS_Store
   *.sublime-workspace
   *.sublime-project
   +.vscode/
   +.merlin
   +.bsb.lock
   ```

   Your `.gitignore` should already contain `lib/` to use this build-system — but if it doesn't,
   you should at least add `lib/bs/`, in which BuckleScript produces a ton of intermediate
   build-products. Correspondingly, however, you should already be including `lib/` in the npm
   package-products; and `lib/bs/` should *not* be published to npm. Thus, add an exception to
   `package.json`'s `"files"` configuration:

   ```diff
   --- a/package.json
   +++ b/package.json
   @@ -9,6 +9,7 @@
      "files": [
        "dist/**/*",
        "lib/**/*",
   +    "!lib/bs",
        "src/**/*"
      ],
      "scripts": {
   ```

3. Now, add configuration for BuckleScript in [`bsconfig.json`][bsconfig]. Unfortunately, this is
   a little more complicated, and can't be inherited from an organization-wide config — I suggest
   reading [the docs][bs-configuration], and using the following as a starting-point:

   ```json5
   {
     "name": "@codeverse/SOMETHING",
     "version": "0.101.1",
     "sources": {
       "dir": "src",
       "subdirs": true
     },
     "package-specs": {
       "module": "es6",
       "in-source": true
     },
     "suffix": ".bs.js",
     "refmt": 3
   }
   ```

   **Crucially note** that the `"name"` and `"version"` must be kept in sync with the values in
   `package.json`.

4. Go write strongly-verified ML modules! Imports and exports are a little more complicated here;
   you can see [the BuckleScript import/export docs][importexport] for more details. Since we opt
   to produce committed JavaScript compilation-products, you can then import directly from those:

   ```js
   // import fom ./someModule.bs.js, which is produced from ./someModule.ml (or .re)
   import * as SomeModule from './someModule.bs';
   ```

  [BuckleScript]: <https://bucklescript.github.io/>
  [plugin-bs]: <https://github.com/mike-engel/babel-plugin-bucklescript>
  [bsconfig]: <https://bucklescript.github.io/bucklescript/docson/#build-schema.json>
  [bs-configuration]: <https://bucklescript.github.io/docs/en/build-configuration.html>
  [importexport]: <https://bucklescript.github.io/docs/en/import-export>

Contributors
============
This project is build by and for [Americademy, Inc](https://www.americademy.com/) for use in all products developed for [Codeverse](https://www.codeverse.com/)

* Americademy - [@americademy](https://github.com/americademy)
* Dave Arel - [@davearel](https://github.com/davearel)
* [@ELLIOTTCABLE](https://github.com/ELLIOTTCABLE)

License
=======

```js
/*
 *  The MIT License
 *
 *  Copyright (c) 2016-2018 Americademy, Inc. https://www.americademy.com
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */
```
