
var myAppModule = angular.module('myApp', ['ngRoute']);
myAppModule.config(function ($routeProvider) {
  $routeProvider
    .when('/',{ 
        templateUrl: 'partials/appointment.html'
    })
    .when('/appointment/new',{ 
        templateUrl: 'partials/addappointment.html'
    })
    .otherwise({
      redirectTo: '/'
    });
});


myAppModule.factory('appointmentFactory', function ($http) {
	var appointments = [];
	var factory = {};
	var current_user;

	factory.getAppointments = function (callback) {
		$http.get('/appointments').success(function (output) {
			appointments = output;
			callback(appointments);
		})
	}

	factory.addAppointment = function(info, callback) {
		$http.post('/appointments/new', info).success(function (output) {
			appointments.push(output);
			callback(output);
		});
	}

	factory.removeAppointment = function(appointment_id) {
		$http.post('/appointments/destroy', {id: appointment_id}).success();
	}

	factory.getCurrentUser = function() {
		return current_user;
	}
	
	factory.setCurrentUser = function(user) {
		current_user = user;
	}

	return factory;
})

myAppModule.controller('appointmentsController', function ($scope, $location, appointmentFactory) {

	$scope.appointments = [];
	$scope.current_user = appointmentFactory.getCurrentUser();
	
	if($scope.current_user == undefined) {
		$scope.current_user = prompt("What is your name?");

		appointmentFactory.setCurrentUser($scope.current_user);
	}

	
	appointmentFactory.getAppointments(function (data) {
		$scope.appointments = data;
	});

	$scope.addAppointment = function () {
		$scope.errorMessages = [];

		
		if($scope.newAppointment.date == undefined || $scope.newAppointment.time == undefined || $scope.newAppointment.complain == undefined || $scope.newAppointment.complain == '') {
			$scope.errorMessages.push("All three fields are requied!");
			return;
		}

		if($scope.newAppointment.complain.length < 10) {
			$scope.errorMessages.push("Complain must be at least 10 characters long!");
		}

		if($scope.newAppointment.date < new Date()) {
			$scope.errorMessages.push("You can only add a future appointment!");
		}

	
		if(8 > $scope.newAppointment.time.getHours() || $scope.newAppointment.time.getHours() > 16) {
			$scope.errorMessages.push("Appointment must be between 8am and 5pm!");
		}

		user_count = 0;
		appointment_count = 0;
		var plan = new Date($scope.newAppointment.date);
		for(var i = 0; i < $scope.appointments.length; i++) {
			var compare = new Date($scope.appointments[i].date)
			if(compare.getTime() == plan.getTime()) {
				if($scope.appointments[i].patient_name == $scope.current_user) {
					$scope.errorMessages.push("A user can make one appointment per day!");
					break;
				}
				appointment_count++;
			}
		}
		if(appointment_count >= 3) {
			$scope.errorMessages.push("That date already has 3 appointments!");
		}

		
		if($scope.errorMessages.length > 0) {
			return;
		}

	
		$scope.newAppointment.patient_name = $scope.current_user;
		appointmentFactory.addAppointment($scope.newAppointment, function (output) {
			$scope.appointments.push(output);
			$location.path('#/');
		});
		$scope.newAppointment = {};

	}

	$scope.removeAppointment = function (appointment) {
		$scope.errorInRemove = "";
		var now = Date.now();
		var compare = new Date(appointment.date);
		
		if(compare.getTime() - now < 86400000) {
			$scope.errorInRemove = "You need to cancel at least 24 hours before the appointment!";
			return;
		}
		appointmentFactory.removeAppointment(appointment._id);
		appointmentFactory.getAppointments(function (data) {
			$scope.appointments = data;
		});
	}

	$scope.isPast = function (appointment) {		
		var now = Date.now();
		var compare = new Date(appointment.date);
		return !(now > compare.getTime());
	}

	$scope.logout = function() {
		appointmentFactory.setCurrentUser(undefined);
	}
})