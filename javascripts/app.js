(function(window) {
	'use strict';

	window.app = angular.module('Matinee', [])

	.directive('backImg', function(){
		return function(scope, element, attrs){
		    var url = attrs.backImg;
		    if (url) {
		    	element.css({
            		'background': 'url(' + url +') no-repeat center top'
	        	});
		    }
		};
	})
	.directive('infiniteScroll', function() {
		return function(scope, element, attrs){
			var raw = element[0];

			element.bind('scroll', function() {
				if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
					scope.$apply(attr.infiniteScroll);
				}
			});
		};
	})
	.service('movieService', ['$http', function($http) {
		var apiBaseURL = '//api.themoviedb.org/3/';
		var apiKey = '?api_key=9a29077a49eefb6a7f081a3e86818d13';

		this.getData = function(endPoint, params) {
			var params = params || "";
			return $http.get(apiBaseURL + endPoint + apiKey + '&' + params);
		}
	}])
	.controller('MainCtrl', ['$scope', '$log', 'movieService', function($scope, $log, movieService) {
		var self = this;
		self.title = 'Matinee';

		self.page = 1;
		self.maxPage = 1;

		var conf = {};
		$scope.error;
		$scope.movies = [];
		$scope.baseImageURL;

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
				movieService.getData('movie/' + movie.id + '/credits')
				.success(function(data) {
					movie.cast = data.cast;
					movie.avgAge = 0;
					var totalAges = 0;
					var totalCastWithAge = 0; // keep track of how many birthdays we can actually use for the average
					angular.forEach(movie.cast, function(person) {
						movieService.getData('person/' + person.id).success(function(data) {
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
			var page = 'page=' + self.page;
			var movieData = movieService.getData('movie/now_playing', page);
			movieData.success(function(data) {
				$scope.movies = data.results;
				self.maxPage = data.total_pages;
				loadCast($scope.movies);
			}).error(function(error) {
				$log.warn(error);
				$scope.error = error;
			});
		};

		$scope.next = function() {
			self.page++;
			loadMovies();
			window.scrollTo(0, 0);
		};

		var loadConfiguration = function() {
			var configuration = movieService.getData('configuration');
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

	}])

})(window)