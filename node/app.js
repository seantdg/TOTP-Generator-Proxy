// dependencies
var express = require('express');
var bodyParser = require('body-parser');
var apigee = require('apigee-access');
var request = require('request');
var totp = require('totp-generator');
var MyPromise = require('bluebird');

var app = express();
var debugEnabled = false;

// define supported routes
app.all('*', function(req, res) {
	debugLog("Request started");
	var params = {
		req:req,
		res:res
	};

	//parse config
	var mfaConfig = apigee.getVariable(params.req, 'custom.mfa.config');
	params.mfaConfig = JSON.parse(mfaConfig);
	debugLog("params:" + Object.keys(params));
	//check if username is in the KVM
	if(params.mfaConfig.devPortalUser !== apigee.getVariable(params.req, 'custom.username')) {
		debugLog("Username incorrect");
		res.status(403).json({"success":"false", "error":"forbidden"});
	}
	else {
		//check if cached token exists
		getMFATokenFromCache(params)
		//generate token if it is missing
		.then(generateTokenIfRequired)
		//continue with request but using bearer token
		.then(sendMgmtRequest);
	}
});

var getMFATokenFromCache = function(params) {
	debugLog("Entered getMFATokenFromCache");
	return new MyPromise(function(resolve, reject) {
		var cache = apigee.getCache('robotMgmtProxy');
		cache.get("mfaToken", function(err, data) {
			debugLog("Entered get mfaToken cache callback");
			if(err) {
				debugLog("Error in get mfaToken cache callback:" + err);
				params.err = err;
				reject(params);
			}
			else {
				debugLog("Success in get mfaToken cache callback:" + data);
				if(data) {
					params.accessToken = data;
				}
				resolve(params);
			}
		});
	});
};

var generateTokenIfRequired = function(params) {
	debugLog("Entered generateTokenIfRequired");
	if(params.accessToken) {
		debugLog("Using cached access token");
		return new MyPromise(function(resolve, reject) {
			resolve(params);
		});
	}
	else {
		debugLog("Generating new access token");
		return new MyPromise(function(resolve, reject) {
				//get users code
				var code = params.mfaConfig.totpKey;
				//generate totp
				params.totpToken = totp(code);
				//request access token
				requestAccessToken(params)
				//then cache it
				.then(cacheAccessToken)
				//finish
				.then(function(params) {
					resolve(params);
				});
		});
	}
};

var requestAccessToken = function(params) {
	debugLog("Entered requestAccessToken");
	return new MyPromise(function(resolve, reject) {
		var username = apigee.getVariable(params.req, 'custom.username');
		var password = apigee.getVariable(params.req, 'custom.password');
		var totpCreds = params.mfaConfig.totpCreds;
		request({
			uri:"https://login.apigee.com/oauth/token?mfa_token=" + params.totpToken,
			form:{
				grant_type: "password",
				username: username,
				password: password
			},
			headers:{
				"Accept":"application/json;charset=utf-8",
				"Authorization":"Basic " + totpCreds
			},
			method:"POST"
		},
		function(err, resp, body) {
			debugLog("Entered requestAccessToken request callback");
			if(err) {
				debugLog("Error in requestAccessToken request callback:" + err);
				params.err = err;
				reject(params);
			}
			else {
				debugLog("Success in requestAccessToken request callback:" + body);
				var bodyObj = JSON.parse(body);
				params.accessToken = bodyObj.access_token;
				resolve(params);
			}
		});
	});
};

var cacheAccessToken = function(params) {
	debugLog("Entered cacheAccessToken");
	return new MyPromise(function(resolve, reject) {
		var cache = apigee.getCache('robotMgmtProxy');
		cache.put('mfaToken', params.accessToken, function(err, data) {
			debugLog("Entered cacheAccessToken cache callback");
			if(err) {
				debugLog("Error in cacheAccessToken cache callback" + err);
				params.err = err;
				reject(params);
			}
		else {
				debugLog("Success in cacheAccessToken cache callback");
				resolve(params);
			}
		});
	});
};

var sendMgmtRequest = function(params) {
	debugLog("Entered sendMgmtRequest");
	return new MyPromise(function(resolve, reject) {
			var myHeaders = params.req.headers;
			myHeaders.authorization = "Bearer " + params.accessToken;
			delete myHeaders.host;
			var requestOpts = {
				uri: params.mfaConfig.mgmtUrl + params.req.originalUrl,
				method: params.req.method,
				headers: myHeaders
			};
			if(params.req.body) {	//body may be undefined, such as for a GET
				requestOpts.body = params.req.body;
			}
			debugLog("sendMgmtRequest requestOpts:" + JSON.stringify(requestOpts));
			request(requestOpts, function(error, response, body) {
				debugLog("Entered sendMgmtRequest callback");
				params
				.res
				.status(response.statusCode)
				.set(response.headers)
				.send(body);
			});
	});
};

MyPromise.onPossiblyUnhandledRejection(function(error) {
	throw error;
});

var debugLog = function(str) {
	if(debugEnabled) {
		console.log(str);
	}
};
// start node app
app.listen(3000);
console.log("Started on 3000");
