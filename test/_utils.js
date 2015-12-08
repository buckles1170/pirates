/* (c) 2015 Ari Porad (@ariporad) <http://ariporad.com>. License: ariporad.mit-license.org */
/* eslint no-var:0, prefer-const: 0, vars-on-top: 0 */
// This is not ES6, AVA doesn't transpile it.
var path = require('path');
var mock = require('mock-fs');

var availFilenames = ['foo', 'bar', 'baz', 'qux'];

function fileToMockedFile(filename) {
  filename = filename + '.js';
  filename = path.resolve(__dirname, 'fixture', filename);
  filename = path.relative(process.cwd(), filename);
  return filename;
}

function mockFiles(files) {
  if (Array.isArray(files)) {
    var fileNames = availFilenames.slice();
    files = files.reduce(function assignName(newFiles, value) {
      newFiles[fileNames.shift()] = value;
      return newFiles;
    }, {});
  }
  var mocks = {};
  Object.keys(files).forEach(function processFilename(filename) {
    var content = files[filename];
    if (content.indexOf('exports') === -1) content = 'module.exports = ' + content;
    mocks[fileToMockedFile(filename)] = content;
  });
  return mock(mocks);
}

function assertModule(t, _filename, expected) {
  var filename = fileToMockedFile(_filename);
  // The path nonsense is to make it an absolute paths
  delete require.cache[path.resolve(process.cwd(), filename)];
  return t.same(require('./fixture/' + _filename + '.js'), expected);
}

/**
 * This basically abstracts away all the test boilerplate
 * @param t - The test object AVA provides
 * @param files {String[]|Object} - Either an object of filename/content mappings, or a list of file contents, which
 *                                  will be assigned names. Names example: 'foo' => 'fixture/foo.js'.
 *                                  `module.exports =` will be prepended if needed.
 * @param hooks {Array[]} - An array of list of arguments for pirates.addHook
 * @param expectations - Same as files, but instead of content, expected exports.
 */
function doTest(t, files, hooks, expectations) {
  delete require.cache[path.resolve(__dirname, '..', 'lib', 'index.js')];
  var pirates = require('..');

  mockFiles(files);

  hooks.forEach(function registerHook(args) {
    pirates.addHook.apply(pirates, args);
  });

  if (Array.isArray(expectations)) {
    var filenames = availFilenames.slice();
    expectations = expectations.reduce(function assignFilename(newExpectations, expectation) {
      // FIXME: this should really be linked better with the array processing above.
      newExpectations[filenames.shift()] = expectation;
      return newExpectations;
    }, {});
  }
  Object.keys(expectations).forEach(function assertExpectation(filename) {
    assertModule(t, filename, expectations[filename]);
  });

  mock.restore();
}

function makeTest(files, hooks, expectations) {
  var args = Array.prototype.slice.apply(arguments);
  return function (t) {
    return doTest.apply(this, [t].concat(args));
  }
}

module.exports = { mockFiles, assertModule, doTest, makeTests };
