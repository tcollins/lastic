#!/usr/bin/env node

'use strict';

var config = require('../lib/config');
var style = require('../lib/style');
var BBPromise = require('bluebird');
var fs = require('fs');

var rp = require('request-promise');
var aws4  = require('aws4');
var AWS = require('aws-sdk');

var tab = require('table-master');

tab.setDefaults({
   indent  : 1, // indentation at the begin of each line
   rowSpace: 2  // spacing between the columns
});


function get(args){
  return _getOrPost('GET', args)
  .then(_displayResultsToConsole);
}

function post(args){
  return _getOrPost('POST', args)
  .then(_displayResultsToConsole);
}


function _getOrPost(method, args){

  args.method = method;

  return _mergeArgs(args)
  .then(_buildRequestOptions)
  .then(_aws4SignRequestIfNeeded)
  .then(_makeRequest);
}


function _mergeArgs(args){
  return new BBPromise(function(resolve, reject) {
    try{
      if(args){
        var mergedArgs = Object.assign({}, config.data, args);
        resolve(mergedArgs);
      }else{
        reject(new Error('merging args'));
      }
    }catch(err){
      reject(err);
    }
  });
}


function _buildRequestOptions(mergedArgs){
  return new BBPromise(function(resolve, reject) {
    try{
      if(mergedArgs){

        var opts = {
            json: true,
            headers: {
              'User-Agent': 'lastic'
            }
        };

        opts.method=mergedArgs.method;
        opts.scheme = mergedArgs.scheme;
        opts.host = mergedArgs.host;
        opts.path = mergedArgs.path;
        opts.uri = opts.scheme + '://' + opts.host + opts.path;

        if(mergedArgs.body){
          opts.body = mergedArgs.body;
        }else if(mergedArgs.file){
          var fileContent = fs.readFileSync(mergedArgs.file, 'utf8');
          if(fileContent){
            opts.body = fileContent;
          }
        }

        resolve({mergedArgs:mergedArgs, requestOpts:opts});
      }else{
        reject(new Error('building request options'));
      }
    }catch(err){
      reject(err);
    }
  });
}


function _aws4SignRequestIfNeeded(obj){
  return new BBPromise(function(resolve, reject) {
    try{
      if(obj && obj.mergedArgs){
        if(obj.mergedArgs.aws4){
          // sign
          var chain = new AWS.CredentialProviderChain();
          chain.resolve(function(err, creds){
            var signedOpts = aws4.sign(obj.requestOpts, {accessKeyId: creds.accessKeyId, secretAccessKey: creds.secretAccessKey});
            resolve(obj);
          });
        }else{
          resolve(obj);
        }
      }else{
        reject(new Error('empty merged args in aws4 sign request if needed'));
      }
    }catch(err){
      reject(err);
    }
  });
}

function _makeRequest(obj){

  return rp(obj.requestOpts)
      .then(function (data) {
          obj.response = data;
          return obj;
      });
}

function _displayResultsToConsole(obj){

  return new BBPromise(function(resolve, reject) {
    try{
      if(obj && obj.mergedArgs && obj.response){

        if(obj.mergedArgs.output === 'raw'){
          _displayResultsRaw(obj);
        }else if(obj.mergedArgs.output === 'table'){
          _displayResultsTable(obj);
        }else{
          _displayResultsDefault(obj);
        }

        resolve(obj);
      }else{
        reject(new Error('empty merged args and response in displat results to console'));
      }
    }catch(err){
      reject(err);
    }
  });
}


function _displayResultsDefault(obj){
  var res = obj.response;
  var hits = res.hits.hits;

  console.log(style.success(res.hits.total + " results in " + res.took + " milliseconds with a max score of " + res.hits.max_score));

  hits.forEach(function(hit) {
    console.log(style.info('_id:'+hit._id + ', _score:' + hit._score));
    console.log(hit._source);
  });

}

function _displayResultsRaw(obj){
  console.log(JSON.stringify(obj.response, null, '  '));
}

function _displayResultsTable(obj){

  var res = obj.response;
  var hits = res.hits.hits;

  console.log(style.success(res.hits.total + " results in " + res.took + " milliseconds with a max score of " + res.hits.max_score));

  var table = [];
  var fields = ['_id'];
  if(obj.mergedArgs.columns){
    fields = obj.mergedArgs.columns.split(',');
  }

  var getProp = function(o,i){
    return o[i];
  };

  hits.forEach(function(hit) {
    var row = {};
    fields.forEach(function(field){
      row[field] = field.split('.').reduce(getProp, hit._source) || hit[field] || '';
    });
    table.push(row);

  });

  console.table(table);

}

/*
var chain = new AWS.CredentialProviderChain();
chain.resolve(function(err, creds){
  //buildOpts(creds);
});


function buildOpts(creds){

  var options = {
      json: true,
      headers: {
        'User-Agent': 'lastic'
      }
  };


  // path | body, [host], [method],
  options.uri = 'https://search-reputation-dev-es-uclmcymrwa4gxh5rlkpm42fttu.us-east-1.es.amazonaws.com/';
  options.host='search-reputation-dev-es-uclmcymrwa4gxh5rlkpm42fttu.us-east-1.es.amazonaws.com';
  options.method='GET';
  //options.path="reviews/review/1";
  options.path="/reviews/review/_search";

  options.uri = 'https://' + options.host + options.path;

  options.body='{"query": {"match": {"body": "coffee"}}}';


node index.js get -h api.github.com -p /users/tcollins -s https
node index.js get -h search-reputation-dev-es-uclmcymrwa4gxh5rlkpm42fttu.us-east-1.es.amazonaws.com -p /reviews/review/1 -s https -a

node index.js get -h search-reputation-dev-es-uclmcymrwa4gxh5rlkpm42fttu.us-east-1.es.amazonaws.com -p /reviews/review/_search -s https -a -b "{\"query\": {\"match\": {\"body\": \"coffee\"}}}"


  var signedOpts = aws4.sign(options, {accessKeyId: creds.accessKeyId, secretAccessKey: creds.secretAccessKey});

  console.log(creds.accessKeyId);
  //console.log(creds.secretAccessKey);
  console.log(signedOpts);

  rp(signedOpts)
      .then(function (data) {
          console.log(data);
      })
      .catch(function (err) {
          console.log(err.error);
      });

}
*/

module.exports = {
  get: get,
  post: post
};
