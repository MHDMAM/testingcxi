angular.module('app.controllers')

.controller('TransactionHistoryCtrl', function ($scope, $state, TransactionHistoryService, contentTemplate) {
  $scope.contentTemplate = contentTemplate;
  $scope.data = {};

  $scope.data.history = TransactionHistoryService.loadDummy();
});
