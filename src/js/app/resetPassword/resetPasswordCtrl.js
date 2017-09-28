angular.module('app.controllers')

.controller('ResetPasswordCtrl', function($scope, $state, UserService, $ionicLoading, ResourcesService, NotificationService, translatedVals) {
  // $scope.contentTemplate = contentTemplate;
  $scope.viewData = {
    title: translatedVals.title,
    verify: translatedVals.verify,
    password: translatedVals.password,
  };
  // --------------------------------------------
  $scope.data = {};

  $scope.next = function() {
    $ionicLoading.show({
      template: 'Please Wait...',
    });
    UserService.user.init($scope.data);

    if (!UserService.canUpdatePassword()) {
      NotificationService.alert({
        title: 'Error',
        template: 'Password can be updated once every 24 hours.',
      });
      return;
    } else {
      ResourcesService.activation()
      .then(function success(res) {
        UserService.staff.set(res.res);
        $ionicLoading.hide();
        $state.go('setPassword');
      }, function error(err) {
        $ionicLoading.hide();
        NotificationService.alert({
          title: 'Error',
          template: err,
        });
      });
    }


  }

});