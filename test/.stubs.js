/**
 * 虚拟对象
 * Created by jcode on 2016-09-23.
 */

const require = function (module) { };
const exports = {};

const driver = {
    create: function () {
        return new Promise();
    }
};
const phantom = {
    exit: function () {},
    createPage: function () {
        return new Promise();
    }
};

const fterEach = function(title, fn) {};
const after = function(title, fn) {};
const beforeEach = function(title, fn) {};
const before = function(title, fn) {};
const describe = function(title, fn) {};
const it = function(title, fn) {};
const setup = function(title, fn) {};
const suiteSetup = function(title, fn) {};
const suiteTeardown = function(title, fn) {};
const suite = function(title, fn) {};
const teardown = function(title, fn) {};
const test = function(title, fn) {};
const run = function(title, fn) {};