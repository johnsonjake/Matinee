(function(window) {
	'use strict';

	window.app = angular.module('Matinee', [])

	.directive('backImg', function(){
		return function(scope, element, attrs){
		    var url = attrs.backImg;
        	element.css({
            	'background': 'url(' + url +') no-repeat center top'
	        });
		};
	})
	.controller('MainCtrl', ['$scope', '$log', '$http', function($scope, $log, $http) {
		var self = this;
		self.title = 'Matinee';

		var apiBaseURL = '//api.themoviedb.org/3/';
		var apiKey = '?api_key=9a29077a49eefb6a7f081a3e86818d13';

		var conf = {};
		$scope.error;
		$scope.movies = [];
		$scope.baseImageURL;

		function getData(endPoint, params) {
			var params = params || "";
			return $http.get(apiBaseURL + endPoint + apiKey + '&' + params)
		};

		function calculateAge(dateString) {
			if (dateString) {
				var today = new Date();
			    var birthDate = new Date(dateString);
			    var age = today.getFullYear() - birthDate.getFullYear();
			    var m = today.getMonth() - birthDate.getMonth();
			    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
			        age--;
			    }
			    return age;
			} else {
				return 0;
			}
		};

		var loadCast = function(movies) {
			angular.forEach(movies, function(movie) {
				var castData = getData('movie/' + movie.id + '/credits')
				.success(function(data) {
					movie.cast = data.cast
					.filter(function(c) { return c.character; }); // only characters in the movie
					movie.avgAge = 0;
					var totalAges = 0;
					var totalCastWithAge = 0; // keep track of how many birthdays we can actually use for the average
					angular.forEach(movie.cast, function(person) {
						getData('person/' + person.id).success(function(data) {
							if (data.birthday) {
								var age = calculateAge(data.birthday);
								if (age > 0) totalCastWithAge++; 
								totalAges += age;
								movie.avgAge = ~~(totalAges / totalCastWithAge);
							}
						})
					});
				}).error(function(error) {
					$log.warn(error);
					$scope.error = error;
				})
			})
		};

		var loadMovies = function() {
			var movieData = getData('movie/now_playing');
			movieData.success(function(data) {
				$scope.movies = data.results
				.filter(function(m) {return m.poster_path});
				loadCast($scope.movies);
			}).error(function(error) {
				$log.warn(error);
				$scope.error = error;
			});
		};

		var loadConfiguration = function() {
			var configuration = getData('configuration');
			configuration.success(function(data) {
				conf = data;
				$scope.baseImageURL = conf.images.base_url + conf.images.poster_sizes[3] + '/';
				loadMovies();
			}).error(function(error) {
				$log.warn(error);
				$scope.error = error;
			});
		};

		loadConfiguration();

		// helpers

		$scope.hasAge = function() {
			return function(movie) {
				$log.info(movie);
				return movie.avgAge > 0
			}
		}

	}])

})(window)