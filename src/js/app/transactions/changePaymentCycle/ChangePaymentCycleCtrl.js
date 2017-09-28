angular.module('app.controllers')

.controller('ChangePaymentCycleCtrl', function($scope, $log, AppMeta, $state, NotificationService, TransactionsService, ModalService, ChangePaymentCycleService, PopulatedVluesService, paymentInfo, $ionicModal, UtilityService) {
  if (!paymentInfo) return;

  $scope.steps = 1;
  $scope.data = paymentInfo;
  $scope.viewData = {};
  $scope.viewData.success = true;
  $scope.otpSessionId = false;
  // $scope.viewData.maskedMobileNo = TransactionsService.maskPhoneNumber(paymentInfo.clientDetails.mobileNo);

  $log.info(paymentInfo);
  $scope.viewData.policyGroup = TransactionsService.splitDataForSlider($scope.data.policies, 3);

  function getFrequencyByKey(key) {
    return _.find(PopulatedVluesService.getPaymentFrequencies(), function(item) {
      return (item.key === key);
    });
  }

  function getFrequencyByValue(value) {
    return _.find(PopulatedVluesService.getPaymentFrequencies(), function(item) {
      return (item.value === value);
    });
  }

  function getPaymentAmountByFreqKey(key) {
    switch (key) {
      case 'ANNUALLY':
        {
          return paymentInfo.annualPremWithGST;
        }
      case 'MONTHLY':
        {
          return paymentInfo.monthlyPremWithGST;
        }
      case 'QUARTERLY':
        {
          return paymentInfo.quarterlyPremWithGST;
        }
      case 'SEMI ANNUALLY':
        {
          return paymentInfo.semiAnnualPremWithGST;
        }
    }
  }

  var freq = getFrequencyByValue(paymentInfo.mainPolicyInfo.freq);
  if (freq) {
    $scope.viewData.currentFreqValue = freq.value;
    $log.log($scope.viewData.currentFreqValue);
    $scope.viewData.currentFreqPaymentAmount = getPaymentAmountByFreqKey(freq.key);
  }

  function getPaymentObj(data) {
    var obj = {
      policyObj: [],
      advance: 0,
      stampDuty: 0,
    }
    _.each(data, function(item) {
      var tmp = {
        planName: item.planName,
        lineOfBiz: item.lineOfBiz,
        policyStatus: item.policyStatus,
        insuredName: item.insuredName,
        // totalPremiumAmount: item.premiumAmount,
        gstAmount: item.gap.gstAmount,
        freq: $scope.viewData.selectedFreq, // new selected freq.
        freqDesc: getFrequencyByValue($scope.viewData.selectedFreq).key,
        name: item.name,
        agentId: item.agentId,
        premiumDueDate: item.premiumDueDate,
        policyNo: item.policyNo,
        policyStatusCode: item.policyStatusCode,
        advance: item.gap.advance,
        // advance: (_.toNumber(item.gap.advance) - _.toNumber(item.gap.gstAmount)).toFixed(2), // without GST
        stampDuty: item.gap.stampDuty,
        isChangeCycle: true,

        newPremiumDueDate: item.gap.newPremiumDueDate,
        nextPaymentDueDate: item.gap.nextPaymentDueDate,
      }
      obj.advance += _.toNumber(item.gap.advance);
      obj.stampDuty += _.toNumber(item.gap.stampDuty);
      obj.policyObj.push(tmp);
    });
    return obj;
  }

  function updateStep2() {
    TransactionsService.hideBackButton();
    var freq = getFrequencyByValue($scope.viewData.selectedFreq);
    if (freq) {
      $scope.viewData.selectedFreqDesc = freq.key;

      // get new frequency payment amount
      $scope.viewData.newFreqPaymentAmount = getPaymentAmountByFreqKey(freq.key);
    }

    $scope.steps = TransactionsService.updateState(2);
    try {
      $scope.$apply()
    } catch (_e) {
      console.log(_e);
    }
  }

  function getAlert(data) {
    $scope.popup = {
      total: UtilityService.toDecimalDisplay(data.advance),
      msgs: []
    };

    _.each(data.policyObj, function(policy) {
      var tmp = '';
      if (policy.newPremiumDueDate === policy.nextPaymentDueDate) {
        tmp = _.template('RM <%= amount %> (inc. of GST, if any) for <%= policyNo %>  with premium due <%= dueDate %>')({
          amount: UtilityService.toDecimalDisplay(policy.advance),
          dueDate: moment(new Date(policy.newPremiumDueDate)).format('DD/MM/YYYY'),
          policyNo: policy.policyNo
        });
      } else {
        tmp = _.template('RM <%= amount %> (inc. of GST, if any) for <%= policyNo %>  with premium due <%= dueDate %> to <%= premiumDueDate %>')({
          amount: UtilityService.toDecimalDisplay(policy.advance),
          policyNo: policy.policyNo,
          dueDate: moment(new Date(policy.nextPaymentDueDate)).format('DD/MM/YYYY'),
          premiumDueDate: moment(new Date(policy.newPremiumDueDate)).format('DD/MM/YYYY'),
        });
      }
      $scope.popup.msgs.push(tmp);
    });

    $ionicModal.fromTemplateUrl('templates/modals/changePaymentCyclePopup.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
      // Modal Funcations:
      $scope.$on('$destroy', function() {
        $scope.modal.remove();
      });

      $scope.closeModal = function() {
        $scope.modal.hide();
      };

      $scope.yes = function() {
        $state.go('payment', {
          changeCycleFlag: true,
          policyObj: data.policyObj,
          stampDuty: data.stampDuty,
          submitObj: TransactionsService.submission.submitChangePaymentCycle($scope.data, $scope.viewData, true)
        });
      };
      // End of Modal Functions;
      $scope.modal.show();

    });

  }

  function calculateGapPayment(step) {
    ChangePaymentCycleService.calculateGap($scope.data.policies, $scope.viewData.selectedFreq)
      .then(function success(gapInfo) {
        var paymentObj = getPaymentObj(gapInfo);
        if (paymentObj.advance == 0) {
          updateStep2();
        } else {
          getAlert(paymentObj);
        }
      }, function failer(err) {
        $log.error(err);
      })
  }

  $scope.updateState = function(step) {
    if ($scope.steps === 1) {
      // if (_.toNumber($scope.viewData.currentFreqValue) > _.toNumber($scope.viewData.selectedFreq)) {
      calculateGapPayment(step);
      // } else {
      //   $scope.steps = TransactionsService.updateState(step);
      // }
    }
    if ($scope.steps === 2)
      updateStep2();
  };

  $scope.changePaymentCycTnC = function() {
    ModalService.showModal($scope, {
      templateUrl: 'templates/modals/tcChangePyamentCycle.html'
    });
  }

  $scope.close = function() {
    TransactionsService.backAfterSubmition();
  };

  $scope.cancel = function() {
    ChangePaymentCycleService.confirmationModal($scope);
  };

  $scope.dataForOTP = {
    transactionName: AppMeta.forms.ChangePayment.otpFormType,
    email: paymentInfo.clientDetails.email,
    mobileNo: paymentInfo.clientDetails.mobileNo,
    sessionId: $scope.otpSessionId,
    NRIC: paymentInfo.clientDetails.idNo,
    token: $scope.data.verificationCode
  }

  $scope.submit = function() {
    // $scope.steps = TransactionsService.updateState(3);
    // $scope.viewData.success = true;

    // find the old payment frequency value
    // var oldPaymentFreqValue = getFrequencyByKey($scope.data.freq).value;
    // 
    /**
     * with OTP
     */
    var obj = _.clone($scope.dataForOTP);
    obj.sessionId = $scope.otpSessionId;
    obj.token = $scope.data.verificationCode;
    var waterfullArr = [
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
      function(callback) {
        // var oldPaymentFreqValue = $scope.viewData.selectedFreq;
        // $scope.viewData.oldPaymentFreqValue = oldPaymentFreqValue;
        TransactionsService.submission.submitChangePaymentCycle($scope.data, $scope.viewData)
          .then(function success(success) {
            if (success) {
              callback(null);
            }
          });
      }
    ]

    async.waterfall(waterfullArr, function(err, result) {
      if (!err) {
        $scope.steps = TransactionsService.updateState(3);
        $scope.viewData.success = true;
      }
    });
  };
  $scope.requestOTP = function requestOTP() {
    var obj = _.clone($scope.dataForOTP);

    TransactionsService.requestOTP(obj)
      .then(function success(res) {
        $scope.otpSessionId = res.res.sessionId;
      }, function fail(res) {
        $log.error(res);
      });
  }


  $scope.showChangeCycleOptions = {
    toMonthly: function toMonthly() {
      if ($scope.viewData.currentFreqValue !== "12" && $scope.data.mainPolicyInfo.monthlyPremWithGST > 0) {
        if ($scope.data.mainPolicyInfo.packagePolicyFlag === 'N')
          return ChangePaymentCycleService.allowCycleChangeByProductType.toMonthly($scope.data.mainPolicyInfo);
        return true;
      }
      return false;
    },

    toQuarterly: function toQuarterly() {
      if ($scope.viewData.currentFreqValue !== "04" && $scope.data.mainPolicyInfo.quarterlyPremWithGST > 0) {
        if ($scope.data.mainPolicyInfo.packagePolicyFlag === 'N')
          return ChangePaymentCycleService.allowCycleChangeByProductType.toQuarterly($scope.data.mainPolicyInfo);
        return true;
      }
      return false;
    },

    toSemiAnnual: function toSemiAnnual() {
      if ($scope.viewData.currentFreqValue !== "02" && $scope.data.mainPolicyInfo.semiAnnualPremWithGST > 0) {
        if ($scope.data.mainPolicyInfo.packagePolicyFlag === 'N')
          return ChangePaymentCycleService.allowCycleChangeByProductType.toSemiAnnual($scope.data.mainPolicyInfo);
        return true;
      }
      return false;
    },

    toAnnual: function toAnnual() {
      if ($scope.viewData.currentFreqValue !== "01" && $scope.data.mainPolicyInfo.annualPremWithGST > 0) {
        if ($scope.data.mainPolicyInfo.packagePolicyFlag === 'N')
          return ChangePaymentCycleService.allowCycleChangeByProductType.toAnnual($scope.data.mainPolicyInfo);
        return true;
      }
      return false;
    },

  };

});