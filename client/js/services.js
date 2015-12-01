'use strict';

angular.module('angular-client-side-auth')
.factory('Auth', function($http, $cookieStore,$window){

	//this is used to parse the profile
	function url_base64_decode(str) {
	  var output = str.replace('-', '+').replace('_', '/');
	  switch (output.length % 4) {
		case 0:
		  break;
		case 2:
		  output += '==';
		  break;
		case 3:
		  output += '=';
		  break;
		default:
		  throw 'Illegal base64url string!';
	  }
	  return window.atob(output); //polifyll https://github.com/davidchambers/Base64.js
	}

	var getUserFromToken = function() {
		if ($window.sessionStorage.token){
			var encodedProfile = $window.sessionStorage.token.split('.')[1];
			var user = JSON.parse(url_base64_decode(encodedProfile));
			return user;
		}else {
            return null;
		}

	}

    var accessLevels = routingConfig.accessLevels
        , userRoles = routingConfig.userRoles
        , currentUser = getUserFromToken() || { username: '', role: userRoles.public };

    delete $window.sessionStorage.token;

    function changeUser(user) {
        angular.extend(currentUser, user);
    }

    return {
        authorize: function(accessLevel, role) {
            if(role === undefined) {
                role = currentUser.role;
            }

            return accessLevel.bitMask & role.bitMask;
        },
        isLoggedIn: function(user) {
            if(user === undefined) {
                user = currentUser;
            }
            return user.role.title === userRoles.user.title || user.role.title === userRoles.admin.title;
        },
        register: function(user, success, error) {
            $http.post('/register', user).success(function(res) {
                changeUser(res);
                success();
            }).error(error);
        },
        login: function(user, success, error) {
            $http.post('/login', user).success(function(res){

				$window.sessionStorage.token = res.token;
				var encodedProfile = res.token.split('.')[1];
				var user = JSON.parse(url_base64_decode(encodedProfile));

                changeUser(user);
                success(user);
            }).error(function(){
					// Erase the token if the user fails to log in
					delete $window.sessionStorage.token;
					$scope.isAuthenticated = false;
					error();
				}				
			);
        },
        logout: function(success, error) {
            $http.post('/logout').success(function(){
                changeUser({
                    username: '',
                    role: userRoles.public
                });
                success();
            }).error(error);
        },
        accessLevels: accessLevels,
        userRoles: userRoles,
        user: currentUser
    };
});

angular.module('angular-client-side-auth')
.factory('Users', function($http) {
    return {
        getAll: function(success, error) {
            $http.get('/api/users').success(success).error(error);
        }
    };
});
