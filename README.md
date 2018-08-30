# Milk Carton
Company-wide Gulp tasks for legacy projects.

## Installation

To install for use in your project:

    npm install --save-dev @codeverse/gulp-registry

## Usage

Add these lines near the top of your `gulpfile`:

        var codeverseTasks = require('@codeverse/gulp-registry');
        gulp.registry(codeverseTasks);

### Configuration

You can optionally include a `milk.json` file in the root of your project to over-ride any of milks
[default settings](src/config.js).

see [src/config.js](src/config.js) for all available options.

### Migrating from Milk Carton v0.0.x to @codeverse/gulp-registry v0.1
Gulp 4.0.0 fundamentally changed the architecture of Gulp tasks, in such a way as to make a
"forked-gulp" CLI tool infeasible. If a project's current npm `"scripts"` use `milk` commands, you
can upgrade to Gulp 4 as follows:

1. Switch to this project:

        npm uninstall milk-carton
        npm install --save-dev @codeverse/gulp-registry

2. Add a bare Gulpfile with contents analogous to the following:

        var gulp = require('gulp');
        var codeverseTasks = require('@codeverse/gulp-registry');
        
        gulp.registry(codeverseTasks);
        
        export default gulp.series('lint', 'build', 'test')

3. Replace the npm scripts in `package.json`; `milk X` can simply become `gulp X`.


## Contributors
This project is build by and for [Americademy, Inc](https://www.americademy.com/) for use in all products developed for [Codeverse](https://www.codeverse.com/)

* Americademy - [@americademy](https://github.com/americademy)
* Dave Arel - [@davearel](https://github.com/davearel)

## License

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
