/* (c) 2016 Ari Porad (@ariporad) <http://ariporad.com>. License: ariporad.mit-license.org */

// Cheap and dirty way to load .foo files as .js files.
require.extensions[".foojs"] = require.extensions[".js"];

// extensions-module.foojs is valid js, but exports the macro.
module.exports = "@@a " + require("./extensions-module.foojs");
