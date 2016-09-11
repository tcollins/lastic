#!/usr/bin/env node

'use strict';

var chalk = require('chalk');

module.exports = {
  info: chalk.cyan,
  success: chalk.bold.green,
  error: chalk.bold.red,
  errorLoud: chalk.bold.bgRed.white,
  request: chalk.blue.bold,
  header: chalk.bold.white,
  cell: chalk.white,
  muted: chalk.gray,
  statusPositive: chalk.green,
  statusNeutral: chalk.yellow,
  statusNegative: chalk.red
};
