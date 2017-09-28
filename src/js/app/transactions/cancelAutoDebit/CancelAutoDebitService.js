angular.module('app.services')

.factory('CancelAutoDebitService', function ($ionicModal, TransactionsService, ResourcesService, NotificationService, $ionicScrollDelegate, $ionicLoading) {

  var _scope = {};

  function initModal() {
    _scope.closeModal = function () {
      _scope.CADmodal.modal.hide();
    };
    // Cleanup the modal when we're done with it!
    _scope.$on('$destroy', function () {
      _scope.CADmodal.modal.remove();
    });
    // Execute action on hide modal
    _scope.$on('modal.hidden', function () {
      console.log('hidden');

      // Execute action
    });
    // Execute action on remove modal
    _scope.$on('modal.removed', function () {
      console.log('removed');
      // Execute action
    });

    _scope.CADmodal.yes = function () {
      _scope.CADmodal.modal.hide();
      TransactionsService.backAfterSubmition();
    };

    _scope.CADmodal.no = function () {
      _scope.CADmodal.modal.hide();
    };

  }

  return {

    confirmationModal: function confirmationModal(scope) {

      var templateUrl = 'templates/modals/cancelAutoDebitConformation.html';

      _scope = scope;
      _scope.CADmodal = {};
      $ionicModal.fromTemplateUrl(templateUrl, {
        scope: _scope,
        animation: 'slide-in-up',
      }).then(function (modal) {
        _scope.CADmodal.modal = modal;
        initModal();
        _scope.CADmodal.modal.show();

      });
    },

    submit: function submit(_data, _viewData) {
      // map selected policies
      var policies = _.map(_viewData.selectedPolicies, function (item) {
        return {
          policyNo: item.policyNo,
          insuredName: item.insuredName,
          companyCode: TransactionsService.companyCodeUpdate(item.lineOfBiz),
          sourceSystem: item.lineOfBiz,
        };
      });

      var infoPolicies = _.map(policies, function(item) {
        return item.policyNo
      });
      
      var submitData = {
        info: {
          policyNo: infoPolicies.join(', <br/>'),
          ownNric: _data._Info.idNo,
          ownMobile: _data._Info.mobileNo,
          ownEmail: _data._Info.ownEmail,
          ownName: _data._Info.policyOwnerName,
        },
        transaction: {
          policies: policies,
          paymentMethod: _viewData.paymentMethod,
        },
      };

      $ionicLoading.show({
        template: 'Please Wait...',
      });

      // submit to server
      return ResourcesService.submission.submitCancelAutoDebit(submitData)
        .then(function (res) {
          // success
          $ionicLoading.hide();
          $ionicScrollDelegate.scrollTop(true);
          return true; // steps = 3
        }, function error(errMsg) {
          // failed
          console.error(errMsg);
          $ionicLoading.hide();

          NotificationService.alert({
            title: 'Error',
            template: errMsg,
          });

          return false;
        });
    },
  };

});
