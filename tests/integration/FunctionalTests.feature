Feature: As a Robot User, I want to be able to make management calls without using Multi-factor Authentication so that existing integrations with Continuous Integration and Developer Portal tools continues to funtion.
@Sean
Scenario: A robot can successfully make a Management API request using username and password only
	Given I have basic authentication credentials `robotUsername` and `robotPassword` 
	When I GET /o/`orgName`
	Then response code should be 200

Scenario: A real client fails to make a Management API request using username and password only
	Given I have basic authentication credentials `humanUsername` and `humanPassword`
	When I GET /o/`orgName`
	Then response code should not be 200

Scenario: A robot fails to make a Management API request with incorrect credentials
	Given I have basic authentication credentials `incorrectUsername` and `incorrectPassword`
	When I GET /o/`orgName`
	Then response code should not be 200

Scenario: A robot fails to make a Management API request with missing credentials
	When I GET /o/`orgName`
	Then response code should not be 200

	
