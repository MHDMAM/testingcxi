angular.module('app.services')

.factory('ChangePaymentCycleService', function($ionicModal, TransactionsService, ResourcesService, $ionicScrollDelegate, $ionicLoading, $q) {

  var _scope = {}

  var notAllowTo_Monthly = ['SPL', 'CHG', 'EPL', 'PAL', 'CNP', 'ELI', 'MLI', 'CLI', 'CCH', 'MDG', 'EHG', 'HGD', 'HIA', 'HIN', 'ECH', 'PHD', 'PLA', 'ACC', 'CCP', 'CEH', 'CLS', 'CPH', ];
  var notAllowTo_Annual_Semi_Quarterly = ['HIR', 'HIO', 'HIP', 'HOP', ];
  var notAllowTo_Monthly_Semi_Quarterly = ['IFD', 'PIP', 'PI2', 'DSC', ];
  var notAllowTo_Semi_Quarterly = ['CSH'];

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


  return {

    confirmationModal: function confirmationModal(scope) {

      var templateUrl = 'templates/modals/cancelAutoDebitConformation.html';

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
    },

    calculateGap: function calculateGap(policies, newFrequency) {
      $ionicLoading.show({
        template: 'Please Wait...',
      });

      return new Promise(function(resolve, reject) {
        var promises = [];
        // var gapInfo = [];
        _.each(policies, function(policy) {
          var deferred = $q.defer();
          promises.push(deferred.promise);
          policy.gap = {};
          ResourcesService.calculateGap({
              policyNo: policy.policyNo,
              newFrequency: newFrequency
            })
            .then(function success(data) {
                var data = data.res.premiumInfo;
                policy.gap.gstAmount = data.outstandingGST_changeFreq;
                policy.gap.stampDuty = data.outstandingStampDuty_changeFreq;
                policy.gap.advance = data.outstandingTotalPremium_changeFreq;
                policy.gap.newPremiumDueDate = data.newPremiumDueDate;
                policy.confirmNextPremiumDueDate = data.confirmNextPremiumDueDate;
                policy.gap.nextPaymentDueDate = data.nextPaymentDueDate;
                deferred.resolve();
              },
              function failer(err) {
                $ionicLoading.hide();
                throw err;
              });
        });


        $q.all(promises).then(function() {
          $ionicLoading.hide();
          return resolve(policies);
        });
      });
    },

    allowCycleChangeByProductType: {

      toMonthly: function toMonthly(policyinfo) {
        if (!policyinfo.productType || _.isEmpty(policyinfo.productType)) return true;
        return (notAllowTo_Monthly.indexOf(policyinfo.productType) < 0 &&
          notAllowTo_Monthly_Semi_Quarterly.indexOf(policyinfo.productType) < 0);
      },

      toQuarterly: function toQuarterly(policyinfo) {
        if (!policyinfo.productType || _.isEmpty(policyinfo.productType)) return true;
        return (notAllowTo_Annual_Semi_Quarterly.indexOf(policyinfo.productType) < 0 &&
          notAllowTo_Monthly_Semi_Quarterly.indexOf(policyinfo.productType) < 0 &&
          notAllowTo_Semi_Quarterly.indexOf(policyinfo.productType) < 0);
      },

      toSemiAnnual: function toSemiAnnual(policyinfo) {
        if (!policyinfo.productType || _.isEmpty(policyinfo.productType)) return true;
        return (notAllowTo_Annual_Semi_Quarterly.indexOf(policyinfo.productType) < 0 &&
          notAllowTo_Monthly_Semi_Quarterly.indexOf(policyinfo.productType) < 0 &&
          notAllowTo_Semi_Quarterly.indexOf(policyinfo.productType) < 0);
      },

      toAnnual: function toAnnual(policyinfo) {
        if (!policyinfo.productType || _.isEmpty(policyinfo.productType)) return true;
        return notAllowTo_Annual_Semi_Quarterly.indexOf(policyinfo.productType) < 0;
      },

      notAllowedToChange: function toAnnual(policyinfo) {
        if (notAllowTo_Annual_Semi_Quarterly.indexOf(policyinfo.productType) >= 0 ||
          notAllowTo_Monthly_Semi_Quarterly.indexOf(policyinfo.productType) >= 0)
          return true;
        return false
      },
    },

  }

});