#!/usr/bin/env node

'use strict';

var pkginfo = require('pkginfo')(module, 'version');
var program = require('commander');
var service = require('./lib/service');
var style = require('./lib/style');
var version = module.exports.version;

var cmdValue;

program._name = 'lastic';

var desc = [];
desc.push('Lastic Commands:\n');
desc.push('\n');
desc.push('    get            :  GET request                 : lastic get -p /users/user/1\n');
desc.push('    post           :  POST request                : lastic post -p /users/user/_search -f ~/query.json\n');
desc.push('    save-defaults  :  Save default flag values    : lastic save-defaults -h localhost -s http --aws4\n');

program
  .version(version)
  .usage('<cmd>')
  .arguments('<cmd>')
  .description(desc.join(''))
  .option('-h, --host <host>', 'The host - ex: -h search-es-mcy2xwa.us-east-1.es.amazonaws.com')
  .option('-p, --path <path>', 'The path - ex: -p /users/user/_search')
  .option('-s, --scheme <scheme>', 'The scheme - ex: -s https')
  .option('-b, --body <body>', 'Inline content body - ex: -b "{\\"query\\": {\\"match\\": {\\"body\\": \\"coffee\\"}}}" ')
  .option('-f, --file <file>', 'Path to file that contains the content body - ex: -f ~/my-query.json')
  .option('-o, --output <output>', 'Output format to use. Allowed values: default, raw, table')
  .option('-c, --columns <columns>', 'Comma separated list of field names to use for the table output')
  .option('-a, --aws4', 'Include this flag if the request should be signed using AWS Signature Version 4.')
  .action(function (cmd) {
     cmdValue = cmd;
  });

program.parse(process.argv);


function catchAndLogError(promise){
  promise
  .catch(function(err){
    console.log(' ');
    console.log(style.errorLoud('** ERROR **'));
    console.log(style.error(err.message));
    console.log(' ');
    process.exit(1);
  });
}

function buildArgs(){
  var args = {};
  var props = ['host', 'path', 'scheme', 'body', 'file', 'output', 'columns', 'aws4'];
  var bools = ['aws4'];

  props.forEach(function(prop) {
    if(program[prop]){
      args[prop] = program[prop];
    }
	});

  return args;
}

if (typeof cmdValue === 'undefined') {
   console.log(' ');
   console.log(style.error('  You must provide a command!'));
   program.help();
   process.exit(1);
}


switch(cmdValue) {
    case 'get':
        catchAndLogError(service.get(buildArgs()));
        break;
    case 'post':
        catchAndLogError(service.post(buildArgs()));
        break;
    case 'start':
      //  catchAndLogError(service.start(cmdArgs));
        break;
    default:
        console.log(' ');
        console.log(style.error('  Invalid command!    "' + cmdValue + '" is not a valid command'));
        console.log(' ');
        program.help();
        process.exit(1);
}
