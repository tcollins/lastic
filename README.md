# Lastic

### A command line tool for Elasticsearch with AWS support

### What's Lastic?

Lastic is a command line tool that allows you to make Elasticsearch API calls.  

### Why does this exist?  Why not just use curl?

Lastic exists to make it easy to send curl like requests to the AWS Elasticsearch service which requires AWS Signature Version 4 to authenticate. Also, since this tool is Elasticsearch specific it includes some specific features to make working with Elasticsearch easier.

### Usage

```sh
# install it (globally)
$ npm install lastic -g

# show the help
$ lastic --help

# config it
$ lastic save-defaults -m GET -h search-es-87sdgf8s.us-east-1.es.amazonaws.com -s https -a

# use it
$ lastic -p /users/user/_search?q=name:fred -o table -f name,email,age

```


### AWS credentials

Lastic uses your same AWS credentials that the AWS CLI uses. It will look for your Access Key ID and Secret Access Key located at ``~/.aws/credentials``.  If you are already using the AWS CLI, then you shouldn't need to do anything additional.

You can read more about how to set this up in the [AWS CLI Getting Started Guide](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html)


> **Pro Tip!**  
>    Include the ``-a`` flag to have this request signed for AWS.




<br/>

[![NPM](https://nodei.co/npm/lastic.png?downloads=true)](https://www.npmjs.com/package/lastic)
