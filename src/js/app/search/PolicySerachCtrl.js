angular.module('app.controllers')

.controller('PolicySerachCtrl', function ($scope, $state, PolicyService) {
  // $scope.contentTemplate = contentTemplate;
  $scope.data = {};
  $scope.search = function () {
    if (!$scope.data.customerID) {
      return;
    }

    PolicyService.clearCache();
    $state.go('policyDashboard', {
      userInfo: $scope.data,
    });
  };
});
