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

function makeRequest(args){
  return _makeRequest(args)
  .then(_displayResultsToConsole);
}


function saveDefaults(args){
  return _mergeArgs(args)
  .then(function(mergedArgs){
    config.data.defaults = mergedArgs;
    config.save();

    console.log(style.success("Defaults saved!"));
    console.log(' ');
  });
}

function showDefaults(args){
  return _mergeArgs(args)
  .then(function(mergedArgs){
    console.log(style.success("Defaults from " + config.file));
    console.log(config.data.defaults);
    console.log(' ');
  });
}

function _makeRequest(args){
  return _mergeArgs(args)
  .then(_buildRequestOptions)
  .then(_aws4SignRequestIfNeeded)
  .then(_sendRequest);
}


function _mergeArgs(args){
  return new BBPromise(function(resolve, reject) {
    try{
      if(args){
        var mergedArgs = Object.assign({}, config.data.defaults, args);
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

function _sendRequest(obj){

  console.log(style.request(' ' + obj.requestOpts.method + ' ' + obj.requestOpts.uri));

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
        console.log(' ');

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

  if(res.hits){
    console.log(style.success(' ' + res.hits.total + " results in " + res.took + " milliseconds with a max score of " + res.hits.max_score));

    if(res.hits.hits){
      var hits = res.hits.hits;

      var fields;
      if(obj.mergedArgs.fields){
        fields = obj.mergedArgs.fields.split(',');
      }

      hits.forEach(function(hit) {
        console.log(style.info('_id:'+hit._id + ', _score:' + hit._score));
        if(fields){
          console.log(_buildObjFromFields(fields, hit));
        }else{
          console.log(hit._source);
        }
      });
    }

  }else{
    console.log(res);
  }

}

function _displayResultsRaw(obj){
  console.log(JSON.stringify(obj.response, null, '  '));
}

function _displayResultsTable(obj){

  var res = obj.response;

  if(res.hits){
    console.log(style.success(' ' + res.hits.total + " results in " + res.took + " milliseconds with a max score of " + res.hits.max_score));

    if(res.hits.hits){
      var hits = res.hits.hits;

      var table = [];
      var fields = ['_id'];
      if(obj.mergedArgs.fields){
        fields = obj.mergedArgs.fields.split(',');
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

  }else{
    console.log(res);
  }

}

function _buildObjFromFields(fields, hit){
  var obj = {};

  var getProp = function(o,i){
    return o[i];
  };

  fields.forEach(function(field){
    obj[field] = field.split('.').reduce(getProp, hit._source) || hit[field] || '';
  });
  return obj;
}


module.exports = {
  makeRequest: makeRequest,
  saveDefaults: saveDefaults,
  showDefaults: showDefaults
};
