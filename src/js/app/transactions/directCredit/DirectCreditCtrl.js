angular.module('app.controllers')

.controller('DirectCreditCtrl', function($scope, $log, ResourcesService, ModalService, DirectCreditService, $ionicLoading, TransactionsService, NotificationService, AppMeta, dcInfo, $ionicSlideBoxDelegate, PolicyService) {
  $log.info(dcInfo);
  $scope.steps = 1;
  $scope.otpSessionId = false;
  $scope.data = {};
  if (dcInfo.DirectCreditDetail) {
    $scope.data.accountType = dcInfo.DirectCreditDetail.typeOfAccount === 'SAVING' ? 'saAcctDigit' : 'curAcctDigit';
  }

  $scope.viewData = dcInfo;
  $scope.viewData.success = true;
  $scope.viewData.selectedPolicies = [];
  _.each($scope.viewData.policyInfo, function(item) {
    if (item.selected)
      $scope.viewData.selectedPolicies.push(item);
  });
  $scope.viewData.policyInfo = _.sortBy($scope.viewData.policyInfo, ['selected']);
  $scope.viewData.splitPolicyInfo = TransactionsService.splitDataForSlider($scope.viewData.policyInfo);

  $scope.dataForOTP = {
    transactionName: AppMeta.forms.DirectCredit.otpFormType,
    email: dcInfo.userInfo.email,
    mobileNo: dcInfo.userInfo.mobileNo,
    sessionId: $scope.otpSessionId,
    NRIC: dcInfo.userInfo.idNo,
    token: $scope.viewData.verificationCode
  }

  if (dcInfo.DirectCreditDetail) {
    var accountNoLength = dcInfo.DirectCreditDetail.bankAccount.length;
    $scope.data.bankInfo = _.find(dcInfo.bankCodes, function(item) {
      return dcInfo.DirectCreditDetail.bankCode == item.swiftCode && (item.curAcctDigit == accountNoLength || item.saAcctDigit == accountNoLength)
    });
    $scope.data.accountNo = dcInfo.DirectCreditDetail.bankAccount;
    if (dcInfo.DirectCreditDetail.NRIC) $scope.data.idType = '03';
  };

  $scope.updateSelections = function() {
    if (!this.item) // uncheck
      PolicyService.selectPolices(this.$parent.item.policyNo, $scope.viewData.selectedPolicies, this.item);
    else {
      var newArr = _.flatten($scope.viewData.splitPolicyInfo);
      PolicyService.selectPolices(this.$parent.item.policyNo, newArr, this.item);
      _.each(newArr, function(item) {
        if (item.selected)
          $scope.viewData.selectedPolicies.push(item);
      });
      $scope.data.splitPolicyInfo = TransactionsService.splitDataForSlider($scope.data.policyInfo);
    }
    $scope.viewData.selectedPolicies = _.uniqBy($scope.viewData.selectedPolicies, 'policyNo');
    $ionicSlideBoxDelegate.update();
  }
  $scope.updateState = function(step) {
    $scope.steps = TransactionsService.updateState(step);

    switch (step) {
      case 3:
        {
          $scope.viewData.selectedPolicies2 = TransactionsService.splitDataForSlider($scope.viewData.selectedPolicies);
          break;
        }
    }
  }

  $scope.cancelDirectCredit = function() {
    DirectCreditService.cancelDirectCreditModal($scope);
  }

  $scope.close = function() {
    TransactionsService.backAfterSubmition();
  };

  $scope.requestOTP = function requestOTP() {
    var obj = _.clone($scope.dataForOTP);

    TransactionsService.requestOTP(obj)
      .then(function success(res) {
        $scope.otpSessionId = res.res.sessionId;
      }, function fail(res) {
        console.log(res);
      });
  }

  $scope.termsNconditions = function termsNconditions() {
    ModalService.showModal($scope, {
      title: 'Terms and Conditions',
      templateUrl: 'templates/modals/tcDirectCredit.html'
    });
  }

  $scope.submit = function submit() {
    $ionicLoading.show({
      template: 'Please Wait...',
    });

    var obj = _.clone($scope.dataForOTP);
    obj.sessionId = $scope.otpSessionId;
    obj.token = String($scope.viewData.verificationCode);
    var waterfullArr = [
      // verify OTP first
      function(callback) {
        TransactionsService.verifyOTP(obj)
          .then(function(res) {
            if (res != false) {
              callback(null);
            } else {
              callback(true);
            }
          }, function error(err) {
            callback(err);
          })
      },
      // submit the direct credit
      function(callback) {
        DirectCreditService.submit($scope)
          .then(function(err) {
            $ionicLoading.hide();

            if (err) {
              $scope.viewData.success = false;
              NotificationService.alert({
                title: 'Error',
                template: err,
              });
              callback(err);
              return;
            }

            callback(null);
          });
      }
    ]

    async.waterfall(waterfullArr, function(err, result) {
      if (!err) {
        $scope.steps = TransactionsService.updateState(4);
        $scope.viewData.success = true;
      }
    });

    // DirectCreditService.submit($scope)
    // .then(function (err) {
    //   $ionicLoading.hide();

    //   if(err) {
    //     $scope.viewData.success = false;
    //     NotificationService.alert({
    //       title: 'Error',
    //       template: err,
    //     });
    //     return;
    //   }

    //   $scope.steps = TransactionsService.updateState(4);
    //   $scope.viewData.success = true;
    // });
  }

});