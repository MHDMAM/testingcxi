angular.module('app.services')

.factory('DirectCreditService', function($ionicModal, $ionicLoading, TransactionsService, ResourcesService, UserService, PolicyService) {
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
      // Execute action
    });
    // Execute action on remove modal
    _scope.$on('modal.removed', function() {
      // Execute action
    });
  }

  return {
    banksInquiry: function banksInquiry() {
      return ResourcesService.getDirectCreditBanksInfo()
        .then(function success(banks) {
          banks.res.bankInfo = _.sortBy(banks.res.bankInfo, ['bankName']);
          return banks.res.bankInfo;
        }, function error(error) {

          throw error;
        });
    },

    cancelDirectCreditModal: function cancelDirectCreditModal(scope) {
      var templateUrl = 'templates/modals/cancelDirectCreditConfirmation.html';

      _scope = scope;
      _scope.CADmodal = {};
      $ionicModal.fromTemplateUrl(templateUrl, {
        scope: _scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        _scope.CADmodal.modal = modal;
        initModal();

        _scope.yes = function() {
          _scope.CADmodal.modal.hide();
          _scope.steps = TransactionsService.backAfterSubmition();
        };

        _scope.no = function() {
          _scope.CADmodal.modal.hide();
        };

        _scope.CADmodal.modal.show();

      });
    },

    directCreditDetail: function directCreditDetail(policyNo) {
      return ResourcesService.getDirectCreditDetail(policyNo)
        .then(function success(res) {
          return res.res.directCreditAcctInfo;
        }, function error(error) {
          throw error;
        });
    },

    directCreditUpdate: function directCreditUpdate() {
      return ResourcesService.directCreditUpdate()
        .then(function success(res) {
          // TODO: add parameters and handle response
          return res;
        }, function error(error) {

          throw error;
        });
    },

    filterPolicies: function filterPolicies(policyInfo, selectedPolicyNo) {
      // _.each(policyInfo, function findSelected(item) {
      //   if (item.policyNo === selectedPolicyNo)
      //     item.selected = true;
      // });
      PolicyService.selectPolices(selectedPolicyNo, policyInfo);
      policyInfo = _.sortBy(policyInfo, ['masterPolicy']);
      return policyInfo.reverse();
    },

    submit: function submit(scope) {
      $ionicLoading.show({
        template: 'Please Wait...',
      });

      var userId = UserService.user.userId();
      var updatingPolicies = [];
      var currentDate = new moment().format('YYYY-MM-DD');
      var email = scope.viewData.userInfo.email ? scope.viewData.userInfo.email : "";
      var emailArr = email.split("@");
      var email1 = emailArr[0];
      var email2 = emailArr.length > 1 ? "@" + emailArr[1] : "";

      // building update direct credit payload
      _.each(scope.viewData.selectedPolicies, function(item) {
        updatingPolicies.push({
          NRIC: scope.viewData.userInfo.idNo,
          // payeeName: scope.viewData.DirectCreditDetail ? scope.viewData.DirectCreditDetail.payeeName : "",
          payeeName: scope.viewData.userInfo.policyOwnerName,
          bankAccount: scope.data.accountNo,
          bankCode: scope.data.bankInfo.swiftCode,
          emailName: email1,
          domainName: email2,
          effectiveDate: currentDate,
          isActive: "Y",
          typeOfAccount: scope.data.accountType ? (scope.data.accountType.substr(0, 2) == 'sa' ? 'SAVING' : 'CURRENT') : "",
          lineOfBiz: (item.lineOfBiz === 'PA') ? 'POLA' : item.lineOfBiz,
          payeeCodeType: scope.viewData.userInfo.idNo.length == 12 ? "NEW IC" : "OLD IC",
          mobileNo: scope.viewData.userInfo.mobileNo,
          bankcodevalue: (scope.data.bankInfo.bankCode.length > 3) ? scope.data.bankInfo.bankCode.substring(0, 4) : scope.data.bankInfo.bankCode,
          createdBy: userId,
          createdDate: currentDate,
          updatedBy: userId,
          updatedDate: currentDate,
          updatingSystem: "CE",
          policyNumber: item.policyNo,
        });
      });

      // building direct credit submission payload
      var policies = _.map(scope.viewData.selectedPolicies, function iterater(item) {
        return {
          "policyNo": item.policyNo,
          "sourceSystem": item.lineOfBiz,
          "companyCode": item.policyNo.toUpperCase() === 'LAFT' ? '072' : '016',
          "bankName": scope.data.bankInfo.bankName,
          "bankAccountNo": scope.data.accountNo,
          "accountType": scope.data.accountType ? (scope.data.accountType.substr(0, 2) == 'sa' ? 'SAVING ACC' : 'CURRENT ACC') : "",
        };
      })

      var infoPolicies = _.map(policies, function(item) {
        return item.policyNo
      });

      var submitObj = {
        info: {
          policyNo: infoPolicies.join(', <br>'),
          ownNric: scope.viewData.userInfo.idNo,
          ownMobile: scope.viewData.userInfo.mobileNo,
          ownEmail: scope.viewData.userInfo.email,
          ownName: scope.viewData.userInfo.policyOwnerName,
        },
        transaction: {
          policies: policies,
        },
      };

      var tasks = [
        function updateDirectCredit(callback) {
          ResourcesService.directCreditUpdate(updatingPolicies)
            .then(function success(res) {
              callback(null);
            }, function fail(err) {
              callback(err);
            });
        },
        function submitDirectCredit(callback) {
          ResourcesService.submission.DirectCredit(submitObj)
            .then(function success(res) {
              callback(null);
            }, function fail(err) {
              callback(err);
            });
        }
      ];

      // submit to the server
      return new Promise(function(resolve, reject) {
        async.waterfall(tasks, function(err, results) {
          $ionicLoading.hide();

          if (err || !results) {
            return resolve(err);
          }

          // success response
          return resolve(null);
        })
      });
    },

  };
});