angular.module('app.controllers')

.controller('CancelAutoDebitCtrl', function($scope, TransactionsService, ModalService, CancelAutoDebitService, paymentInfo, AppMeta, PolicyService, $ionicSlideBoxDelegate) {
  if (!paymentInfo) return;

  $scope.steps = 1;
  $scope.otpSessionId = null;
  $scope.viewData = TransactionsService.populate.changeOfAddress();
  $scope.viewData.selectedPolicies = [];
  $scope.viewData.success = false;
  $scope.viewData.paymentMethod = 'C'; // currently it's hardcoded
  // $scope.viewData.maskedMobileNo = TransactionsService.maskPhoneNumber(paymentInfo.clientDetails.mobileNo);

  _.each(paymentInfo.policyInfo, function(item) {
    if (item.selected)
      $scope.viewData.selectedPolicies.push(item);
  });

  $scope.data = paymentInfo;
  $scope.data.policyInfo = TransactionsService.splitDataForSlider($scope.data.policyInfo);

  console.log($scope);

  $scope.updateSelections = function() {
    if (!this.item) // uncheck
      PolicyService.selectPolices(this.$parent.item.policyNo, $scope.viewData.selectedPolicies, false);
    else {
      var newArr = _.flatten($scope.data.policyInfo);
      PolicyService.selectPolices(this.$parent.item.policyNo, newArr, true);
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
    if ($scope.steps === 2) {
      $scope.viewData.selectedPolicies2 = TransactionsService.splitDataForSlider($scope.viewData.selectedPolicies);
      TransactionsService.hideBackButton();
    }
  };

  $scope.autoDebitTnC = function() {
    ModalService.showModal($scope, {
      templateUrl: 'templates/modals/tcCancelAutoDebit.html'
    });
  }

  $scope.close = function() {
    TransactionsService.backAfterSubmition();
  };

  $scope.cancel = function() {
    CancelAutoDebitService.confirmationModal($scope);
  };

  $scope.dataForOTP = {
    transactionName: AppMeta.forms.CancellationAutoDebit.otpFormType,
    email: paymentInfo._Info.email,
    mobileNo: paymentInfo._Info.mobileNo,
    sessionId: $scope.otpSessionId,
    NRIC: paymentInfo._Info.idNo,
    token: $scope.data.verificationCode
  }

  $scope.submit = function() {
    // split selected policies
    // $scope.steps = TransactionsService.updateState(3);
    // $scope.viewData.success = true;
    /**
     * with OTP
     */
    var obj = _.clone($scope.dataForOTP);
    obj.sessionId = $scope.otpSessionId;
    obj.token = $scope.data.verificationCode;
    var waterfullArr = [
      function(callback) {
        TransactionsService.verifyOTP(obj).then(function(res) {
          if (res != false) {
            callback(null);
          } else {
            callback(true);
          }
        })
      },
      function(callback) {
        CancelAutoDebitService.submit($scope.data, $scope.viewData)
          .then(function success(success) {
            if (success) {
              $scope.steps = TransactionsService.updateState(3);
              $scope.viewData.success = true;
              callback(null);
            }
          });
      }
    ]

    async.waterfall(waterfullArr, function(err, result) {
      if (!err) {
        // $scope.steps = TransactionsService.updateState(4);
        // $scope.viewData.success = true;
      }
    });

    // CancelAutoDebitService.submit($scope.data, $scope.viewData)
    //   .then(function success(success) {
    //     if (success) {
    //       $scope.steps = TransactionsService.updateState(3);
    //       $scope.viewData.success = true;
    //     }
    //   });
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


});