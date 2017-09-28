angular.module('app.controllers')

.controller('MainScreenCtrl', function ($scope, $state, UserService) {

  $scope.changeOfAddress = function () {
    $state.go('form_changeOfAddress');
  };

  $scope.creditCard = function () {
    $state.go('form_creditCard');
  };

  $scope.pilicyReplacement = function () {
    $state.go('form_policyReplacement');
  };

  $scope.changePayment = function () {
    $state.go('form_changePayment');
  };

  $scope.cancellationAutoDebit = function () {
    $state.go('form_cancellationAutoDebit');
  };

  $scope.medicalReplacem = function () {
    $state.go('form_medicalReplacement');
  };

});
