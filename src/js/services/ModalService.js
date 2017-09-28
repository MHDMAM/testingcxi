angular.module('app.services')

.factory('ModalService', function($ionicModal) {

  var _scope = {
    _viewData: {}
  };

  function initModal() {
    _scope.closeModal = function() {
      _scope.modal.hide();
    };
    // Cleanup the modal when we're done with it!
    _scope.$on('$destroy', function() {
      _scope.modal.remove();
    });
    // Execute action on hide modal
    _scope.$on('modal.hidden', function() {
      console.log('hidden');

      // Execute action
    });
    // Execute action on remove modal
    _scope.$on('modal.removed', function() {
      console.log('removed');
      // Execute action
    });
  }

  return {

    showModal: function showModal(scope, _viewData) {
      if (!scope || !_viewData)
        return;

      var templateUrl = _viewData.templateUrl || 'templates/modals/generalModal.html';

      _scope = scope;
      _scope._viewData = _viewData;
      $ionicModal.fromTemplateUrl(templateUrl, {
        scope: _scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        _scope.modal = modal;
        initModal();
        _scope.modal.show();

      });
    }

  }



});