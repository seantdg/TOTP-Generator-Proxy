/* jshint node:true */
'use strict';

var apickli = require('apickli');

// set the url and base path for your API endpoint on Apigee edge
var url = 'seandavis-test.apigee.net/mgmt/v1';

var env = process.env.NODE_ENV || 'dev';
// debug
console.log('running on ' + env + ' environment');

module.exports = function() {
    // cleanup before every scenario
    this.Before(function(scenario, callback) {
        this.apickli = new apickli.Apickli('https', url);
		this.apickli.storeValueInScenarioScope('robotUsername', 'devadmin+seandavis@apigee.com');
		this.apickli.storeValueInScenarioScope('robotPassword', 'ReLGyK9Eo1T5OIqUTANH');
		this.apickli.storeValueInScenarioScope('humanUsername', 'sdavis+sso@apigee.com');
		this.apickli.storeValueInScenarioScope('humanPassword', 'Password123');
		this.apickli.storeValueInScenarioScope('incorrectUsername', 'something@apigee.com');
		this.apickli.storeValueInScenarioScope('incorrectPassword', 'something');
		this.apickli.storeValueInScenarioScope('orgName', 'seandavis');
        callback();
    });
};
