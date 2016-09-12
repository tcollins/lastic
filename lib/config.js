#!/usr/bin/env node

'use strict';

var fs = require('fs');
var jsonfile = require('jsonfile');
jsonfile.spaces = 4;


var defaultConfig = {
  defaults : {
    method: 'GET',
    host: 'localhost',
    path: '',
    scheme: 'http',
    body: null,
    file: null,
    output: 'default',
    fields: null,
    aws4: false
  }
};


// read the config from the user dir, it doesn't exist create it form the defaultConfig
var homeDir = (process.platform == 'win32'? process.env.USERPROFILE: process.env.HOME);
var userConfigFile = homeDir + '/.lastic.json';

var userConfig = defaultConfig;
try{
  userConfig = jsonfile.readFileSync(userConfigFile);
}catch(err){
  jsonfile.writeFileSync(userConfigFile, defaultConfig);
}

var config = {
  file: userConfigFile,
  data: userConfig,
  save: function(){
    jsonfile.writeFileSync(userConfigFile, this.data);
  }
};

module.exports = config;
