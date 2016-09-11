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
desc.push('    save-defaults  :  Save default flag values    : lastic save-defaults -h localhost -s http --aws4\n');
desc.push('\n\n');
desc.push('  Examples:\n');
desc.push('\n');
desc.push('    lastic save-defaults -m GET -h search-es-87sdgf8s.us-east-1.es.amazonaws.com -s https -a\n');
desc.push('    lastic -p /users/user/_search?q=name:fred -o table -f name,email,age \n');
desc.push('    lastic -p /users/user/_search -b "{\\"query\\": {\\"match\\": {\\"name\\": \\"fred\\"}}}" \n');
desc.push('    lastic -p /users/user/_search -F ~/my-query.json \n');


program
  .version(version)
  .usage('[cmd]')
  .arguments('[cmd]')
  .description(desc.join(''))
  .option('-m, --method <method>', 'The method - ex: -m GET')
  .option('-h, --host <host>', 'The host - ex: -h search-es-mcy2xwa.us-east-1.es.amazonaws.com')
  .option('-p, --path <path>', 'The path - ex: -p /users/user/_search')
  .option('-s, --scheme <scheme>', 'The scheme - ex: -s https')
  .option('-b, --body <body>', 'Inline content body - ex: -b "{\\"query\\": {\\"match\\": {\\"body\\": \\"coffee\\"}}}" ')
  .option('-F, --file <file>', 'Path to file that contains the content body - ex: -F ~/my-query.json')
  .option('-o, --output <output>', 'Output format to use. Allowed values: default, raw, table')
  .option('-f, --fields <fields>', 'Comma separated list of field names to use for the output, works with default and table')
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
    program.help();
    process.exit(1);
  });
}

function buildArgs(){
  var args = {};
  var props = ['method', 'host', 'path', 'scheme', 'body', 'file', 'output', 'fields', 'aws4'];
  var bools = ['aws4'];

  props.forEach(function(prop) {
    if(program[prop]){
      args[prop] = program[prop];
    }
	});

  return args;
}

if (typeof cmdValue === 'undefined') {
   cmdValue = 'makeRequest';
}

console.log(' ');

switch(cmdValue) {
    case 'makeRequest':
        catchAndLogError(service.makeRequest(buildArgs()));
        break;
    case 'save-defaults':
        catchAndLogError(service.saveDefaults(buildArgs()));
        break;
    default:
        console.log(' ');
        console.log(style.error('  Invalid command!    "' + cmdValue + '" is not a valid command'));
        console.log(' ');
        program.help();
        process.exit(1);
}
