(function () {
  'use strict';

  angular.module('fusionMessages').directive('fusMessagesDefaults', fusMessagesDefaults);

  function fusMessagesDefaults () {
    return {
      restrict: 'A',
      /** @ngInject */
      controller: function ($scope, $attrs) {
        this.defaultMessages = $scope.$eval($attrs['fusMessagesDefaults']);
      }
    }
  }

})();