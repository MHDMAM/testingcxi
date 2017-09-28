angular.module('app.controllers')

.controller('SetPasswordCtrl', function($scope, $state, PopulatedVluesService, UserService, NotificationService, $ionicLoading, SecurityService, UtilityService, ResourcesService, StorageService, translatedVals) {
  $scope.viewData = {
    title: translatedVals.title,
    verify: translatedVals.verify,
    password: translatedVals.password,
    branches: PopulatedVluesService.getBranches()
  };
  $scope.data = {};

  $scope.singup = function() {

    try {
      UserService.signup($scope.data);
    } catch (e) {
      $ionicLoading.hide();
      NotificationService.alert({
        title: 'Error',
        template: e,
      });
      return;
    }
    $ionicLoading.show({
      template: 'Please Wait...',
    });
    ResourcesService.afterSetPassword()
      .then(function success() {
        $ionicLoading.hide();
        // save user info -> login

        UtilityService.cleanDom();
        $state.go('search');
      }, function error(err) {

        $ionicLoading.hide();
        NotificationService.alert({
          title: 'Error',
          template: err,
        });
      });
  };

});