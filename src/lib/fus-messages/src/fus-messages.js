(function () {

  'use strict';

  angular.module('fusionMessages').directive('fusMessages', fusMessages);

  /** @ngInject */
  function fusMessages($compile) {
    return {
      template: '<div ng-messages="inputModelErrors" ng-show="isVisible"></div>',
      require: ['^form', '?^fusMessagesDefaults'],
      scope: true,
      transclude: true,
      link: function (scope, element, attrs, ctrls, transclude) {
        var defaultMessageListener;

        scope.inputModel = scope.$eval(attrs['fusMessages']);
        scope.inputModelErrors = scope.$eval(attrs['fusMessages']).$error;
        scope.isVisible = false;

        scope.$watchCollection(showMessages, toggleVisible);
        defaultMessageListener = scope.$watch(defaultMessages, addDefaultMessages);

        transclude(function (clone) {
          var directiveEl = element.find('div')[0];

          // make sure these are ordered before default messages
          angular.element(directiveEl).prepend(clone);
        });

        // Show ngMessages only when this input is dirty or when the
        // form has been submitted.
        function showMessages () {
          var formController = ctrls[0];
          return formController.$submitted || scope.inputModel.$dirty;
        }

        function toggleVisible(isVisible) {
          scope.isVisible = isVisible;
        }

        // checks if `fusMessagesDefaults` is present
        function defaultMessages() {
          defaultMessages = ctrls[1] && ctrls[1].defaultMessages;
          if (!!defaultMessages) {
            return defaultMessages;
          }
        }

        // adds default messages.
        // TODO re-render default messages if the watcher updates
        function addDefaultMessages(defaultMessages) {
          if (!!defaultMessages) {
            var directiveEl = element.find('div')[0];

            angular.forEach(defaultMessages, function (message, key) {
              var el = angular.element('<div></div>').attr('ng-message', key).text(message);
              angular.element(directiveEl).append(el);
              $compile(el)(scope);
            });
            // stop watching for defaults
            defaultMessageListener();
          }
        }
      }
    }
  }

})();