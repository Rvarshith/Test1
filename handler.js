'use strict';
const Serverless = require("serverless-http");
const app = require("./app");
module.exports.ebsp = Serverless(app);