angular.module('app.controllers')

.controller('TopUpCtrl', function($scope, $log, TopUpService, $state, $ionicScrollDelegate, $ionicLoading, TransactionsService, NotificationService, ModalService, AppMeta, topupInfo) {
  // add hoc

  // if (policyNo.toLowerCase().indexOf('u')===0)
  //     user cannot select the following fund:
  //       AIA Asian Debt Fund (TAD1)
  //       AIA Asian Equity Fund (TAE1)
  //       AIA International High Dividend Fund (THD1)

  $scope.steps = 1;
  var initVals = TopUpService.init(topupInfo);
  $scope.data = initVals.data;

  $scope.viewData = initVals.viewData;
  $scope.viewData.fundTotal100 = false;

  $scope.dataForOTP = {
    // transactionName: AppMeta.forms.ScheduleTopUp.otpFormType,
    email: topupInfo.clientDetails.email,
    mobileNo: topupInfo.clientDetails.mobileNo,
    sessionId: $scope.otpSessionId,
    NRIC: topupInfo.clientDetails.idNo,
    token: $scope.data.verificationCode
  }

  $scope.$watch('data.fundAllocation', function(nv, ov) {
    TopUpService.updateFundAllocaton(nv, $scope.data.premiumVal);
    var tmpTotal = 0;
    _.each(nv, function(item) {
      if (!item.allocationPercent)
        item.allocationPercent = 0;

      tmpTotal += item.allocationPercent;
      if (item.allocationPercent === 0) item.allocationPercent = null;
    });
    if (tmpTotal === 100)
      $scope.viewData.fundTotal100 = true;
    else $scope.viewData.fundTotal100 = false;
  }, true);

  $scope.$watch('data.premiumVal', function(nv, ov) {
    if (nv !== ov)
      TopUpService.updateFundAllocaton($scope.data.fundAllocation, nv);
  }, true);

  $scope.editAllocation = function editAllocation(index) {
    var item = this.item;
    item.isEnabled = true;
  };

  $scope.updateFund = function() {
    TopUpService.updateFund($scope.data.fundAllocation, $scope.data.premiumVal);
  };

  $scope.updateAllocation = function(index) {
    var item = this.item;
    if (!item.allocationPercent) return;

    TopUpService.updateAllocation($scope.data.fundAllocation, index);
  };

  $scope.addFund = function() {
    var canAdd = TopUpService.addFund($scope.data.fundAllocation);
    if (canAdd)
      $scope.data.fundAllocation.push({
        isEnabled: true,
      });
  };

  $scope.removeAllocation = function(index) {
    var canAdd = TopUpService.removeFund($scope.data.fundAllocation, index);
  };

  $scope.updateState = function(step) {
    $scope.steps = TransactionsService.updateState(step);
    if (step === 3)
      NotificationService.confirm({
        title: 'Cross-Subsidary Terms And Conditions',
        template: 'I/We allow the Company to deduct the Account Value from Savings Account to pay all the Policy Charges in the event the Account Value from Protection Account is insufficient to pay all the Policy Charges.',
        okText: 'I AGREE',
        cancelText: 'I DISAGREE',
      }).then(function(ok) {
        $scope.viewData.crossSubsidy = ok;
      });
  };

  $scope.checkTotal = function() {
    if (TopUpService.sumAllocation($scope.data.fundAllocation) === 100 && TopUpService.checkPreviousValues($scope.data.fundAllocation) &&
      $scope.data.premiumVal && $scope.viewData.topUpMode !== null)
      return false;
    return true;
  };

  $scope.onChangeFund = function($index) {
    // $scope.data.fundAllocation.push(this.val)

    if (_.uniqBy($scope.data.fundAllocation, 'fundCode').length !== $scope.data.fundAllocation.length) {
      NotificationService.alert({
        title: 'Error',
        template: "This fund is already selected",
      });
      _.pullAt($scope.data.fundAllocation, [$index]);
    }

  }

  $scope.topUpModeChange = function() {
    console.log($scope.viewData.topUpMode);
    switch ($scope.viewData.topUpMode) {
      case 0:
        {
          $scope.viewData.minTopUp = TopUpService.getScheduleMinAmount(topupInfo);
          break;
        }
      case 1:
        {
          $scope.viewData.minTopUp = TopUpService.getAdHocMinAmount(topupInfo);
          break;
        }
    }
  }

  $scope.termsNconditions = function() {
    ModalService.showModal($scope, {
      templateUrl: 'templates/modals/topupTnc.html'
    });
  }

  $scope.cancel = function() {
    NotificationService.confirm({
      title: 'Confirmation',
      template: 'Are you sure you want to cancel?',
      okText: 'YES',
      cancelText: 'NO',
    }).then(function(ok) {
      $scope.steps = TransactionsService.backAfterSubmition();
    });
  }

  $scope.finish = function() {
    TransactionsService.backAfterSubmition();
  }

  function gotoPayment() {
    // prepare the payment object
    var paymentObj = getPaymentObj();

    $state.go('payment', {
      policyObj: paymentObj,
      stampDuty: 0,
      submitObj: TopUpService.submitTopUp($scope.data, $scope.viewData, $scope.viewData.topUpMode === 0)
    });
  }

  function getPaymentObj() {
    var paymentObj = {
      planName: $scope.data.policyInfo.planName,
      lineOfBiz: $scope.data.policyInfo.lineOfBiz,
      policyStatus: $scope.data.policyInfo.policyStatus,
      insuredName: $scope.data.policyInfo.insuredName,
      totalPremiumAmount: ($scope.viewData.topUpMode === 0) ? $scope.data.policyInfo.premiumAmount : 0,
      topUpAmount: $scope.data.premiumVal,
      gstAmount: ($scope.viewData.topUpMode === 0) ? $scope.data.policyInfo.gstAmount : 0,
      freq: $scope.viewData.topUpMode === 1 ? $scope.data.frequency.value : $scope.data.policyInfo.freq.value,
      premiumDueDate: $scope.data.policyInfo.premiumDueDate,
      policyNo: $scope.data.policyInfo.policyNo,
      policyStatusCode: $scope.data.policyInfo.policyStatusCode,
      topUpMode: $scope.viewData.topUpMode,
      
      agentId: $scope.data.policyInfo._agentId,
      name: $scope.data.policyInfo._agentName,
      // extra info for new payment methods:
      freqDesc: $scope.viewData.topUpMode === 1 ? $scope.data.frequency.key : $scope.data.policyInfo.freq.key,

    };
    // if ($scope.viewData.topUpMode === 0) // Schedule topup.
    //   paymentObj.advance = 0;
    // else
    //   paymentObj.totalPremiumAmount = 0;

    return paymentObj;
  }

  $scope.requestOTP = function requestOTP() {
    var obj = _.clone($scope.dataForOTP);
    obj.transactionName = ($scope.viewData.topUpMode === 0) ? AppMeta.forms.ScheduleTopUp.otpFormType : AppMeta.forms.AdHocTopUp.otpFormType;

    TransactionsService.requestOTP(obj)
      .then(function success(res) {
        $scope.otpSessionId = res.res.sessionId;
      }, function fail(res) {
        console.log(res);
      });
  }

  $scope.submit = function submit() {
    $ionicLoading.show({
      template: 'Please Wait...',
    });

    var obj = _.clone($scope.dataForOTP);
    obj.transactionName = ($scope.viewData.topUpMode === 0) ? AppMeta.forms.ScheduleTopUp.otpFormType : AppMeta.forms.AdHocTopUp.otpFormType;

    obj.sessionId = $scope.otpSessionId;
    obj.token = $scope.data.verificationCode;
    var waterfullArr = [
      function(callback) {
        TransactionsService.verifyOTP(obj)
          .then(function(res) {
            if (res != false) {
              callback(null);
            } else {
              callback('Wrong OTP, Please check again.');
            }
          }, function error(err) {
            callback(err);
          })
      },
      function(callback) {
        var submit = TopUpService.submitTopUp($scope.data, $scope.viewData, $scope.viewData.topUpMode === 0);
        submit.submitFunc(submit.submitData)
          .then(function(res) {
            callback(null);
          }, function error(errMsg) {
            // failed
            callback(errMsg);
          });
      }
    ]

    async.waterfall(waterfullArr, function(err, result) {
      $ionicLoading.hide();

      if (!err) {
        // success
        $ionicScrollDelegate.scrollTop(true);
        $scope.viewData.success = true;
        $scope.updateState(4);
      } else {
        $scope.viewData.success = false;

        if (err === true)
          err = null;

        if (err)
          NotificationService.alert({
            title: 'Error',
            template: err,
          });
      }
    });
  }

  $scope.payment = function() {
    // remove allocation =0 
    _.remove($scope.data.fundAllocation, function(item) {
      return item.allocationPercent === 0
    });
    // show payment authorization modal dialog for schedule topup only
    if ($scope.viewData.topUpMode === 0) {
      NotificationService.confirm({
        title: 'Cross-Subsidary Terms And Conditions',
        template: 'I/We allow the Company to deduct the Account Value from Savings Account to pay all the Policy Charges in the event the Account Value from Protection Account is insufficient to pay all the Policy Charges.',
        okText: 'I AGREE',
        cancelText: 'I DISAGREE',
      }).then(function(ok) {
        $scope.viewData.crossSubsidy = ok;
        gotoPayment();
      });
    } else {
      gotoPayment();
    }

  };

});