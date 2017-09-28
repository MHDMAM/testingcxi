angular.module('app.controllers')

.controller('LoginCtrl', function ($scope, $state, UserService, BroadcastService, UtilityService, NotificationService, $ionicLoading, AppMeta) {
  $scope.viewData = {};
  $scope.viewData.appVersion = AppMeta.version;
  BroadcastService.on(BroadcastService.msgs.uuid, function (event, uuid) {
    $scope.viewData.uuid = uuid;
    $scope.$apply();
  });

  $scope.data = {};

  $scope.forgotPW = function () {
    UserService.activation(false);
    $state.go('resetPassword');
  };

  $scope.activate = function () {
    UserService.activation(true);
    $state.go('resetPassword');
  };

  $scope.signIn = function () {
    if (!$scope.data.staffId || !$scope.data.password) return;
    $ionicLoading.show({
      template: 'Please Wait...',
    });
    UserService.login($scope.data.staffId, $scope.data.password).then(function success() {
      $ionicLoading.hide();
      UtilityService.cleanDom();
      $state.go('search');
    }, function reject(err) {

      $ionicLoading.hide();
      NotificationService.alert({
        title: 'Error',
        template: err,
      });
    });
  };
});
