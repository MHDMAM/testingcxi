angular.module('app.services')

.factory('MedicalCardService', function($ionicModal, TransactionsService, ResourcesService, NotificationService, PopulatedVluesService, $ionicScrollDelegate, $ionicLoading) {

  var _scope = {}

  function initModal() {
    _scope.closeModal = function() {
      _scope.CADmodal.modal.hide();
    };
    // Cleanup the modal when we're done with it!
    _scope.$on('$destroy', function() {
      _scope.CADmodal.modal.remove();
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

    _scope.CADmodal.yes = function() {
      _scope.CADmodal.modal.hide();
      TransactionsService.backAfterSubmition();
    };

    _scope.CADmodal.no = function() {
      _scope.CADmodal.modal.hide();
    };

  }

  function prepearModal(scope, templateUrl) {
    _scope = {};
    _scope = scope;
    _scope.CADmodal = {};
    $ionicModal.fromTemplateUrl(templateUrl, {
      scope: _scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      _scope.CADmodal.modal = modal;
      initModal();
      _scope.CADmodal.modal.show();

    });
  }
  return {

    confirmationModal: function confirmationModal(scope) {

      var templateUrl = 'templates/modals/cancelAutoDebitConformation.html';
      prepearModal(scope, templateUrl);

    },

    tcModal: function tcModal(scope) {

      var templateUrl = 'templates/modals/tcMedicalCard.html';
      prepearModal(scope, templateUrl);
    },

    populatedData: function populatedData() {
      return {
        states: PopulatedVluesService.getStates(),
        countries: PopulatedVluesService.getCountries()
      }
    },

    submit: function submit(_data, _viewData, cardInfo) {
      var roles = _.map(_viewData.selectedCandidates, function(item) {
        return {
          name: item.name,
          nric: item.idNo,
        };
      });

      var submitData = {
        info: {
          policyNo: cardInfo.policyOwnerInfo.policyNo,
          ownNric: cardInfo._Info.idNo,
          sourceSystem: cardInfo._Info.lineOfBiz,
          ownMobile: cardInfo._Info.mobileNo,
          ownEmail: cardInfo._Info.email,
          ownName: cardInfo._Info.policyOwnerName,
          planName: cardInfo._Info.planName,
        },
        transaction: {
          roles: roles,
          cardType: _viewData.selectedCandidates[0].medicalReplaceFlag
        },
      };
      _.assign(submitData.transaction, _data.addressInfo);

      $ionicLoading.show({
        template: 'Please Wait...',
      });

      return ResourcesService.submission.medicalCard(submitData)
        .then(function(res) {
          $ionicLoading.hide();
          $ionicScrollDelegate.scrollTop(true);
        }, function error(errMsg) {
          console.error(errMsg);
          $ionicLoading.hide();

          NotificationService.alert({
            title: 'Error',
            template: errMsg,
          });
        });
    },
  }

});