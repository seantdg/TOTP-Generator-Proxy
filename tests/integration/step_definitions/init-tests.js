/* jshint node:true */
'use strict';

var apickli = require('apickli');

// set the url and base path for your API endpoint on Apigee edge
var url = '(org)-(env).apigee.net/mgmt/v1';

var env = process.env.NODE_ENV || 'dev';
// debug
console.log('running on ' + env + ' environment');

module.exports = function() {
    // cleanup before every scenario
    this.Before(function(scenario, callback) {
        this.apickli = new apickli.Apickli('https', url);
		this.apickli.storeValueInScenarioScope('robotUsername', 'devadmin+(orgname)@apigee.com');
		this.apickli.storeValueInScenarioScope('robotPassword', '(robotpassword)');
		this.apickli.storeValueInScenarioScope('humanUsername', '(realperson)@example.com');
		this.apickli.storeValueInScenarioScope('humanPassword', '(realpassword)');
		this.apickli.storeValueInScenarioScope('incorrectUsername', 'something@example.com');
		this.apickli.storeValueInScenarioScope('incorrectPassword', 'something');
		this.apickli.storeValueInScenarioScope('orgName', '(orgname)');
        callback();
    });
};
