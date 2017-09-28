angular.module('app.controllers')

.controller('PaymentCtrl', function($scope, $ionicLoading, $ionicScrollDelegate, $q, $log, PaymentService, ResourcesService, BroadcastService, TransactionsService, PolicyService, NotificationService, AppMeta, detailsInfo) {

  $log.info(detailsInfo);
  $scope.viewData = {};
  $scope.viewData.paymentSuccess = false;
  $scope.viewData.submissionSuccess = false;
  detailsInfo.exec_function($scope);
  $scope.steps = PaymentService.step(detailsInfo.step || 1);
  var _TOPUP_MODE = detailsInfo.topUpMode; // 0: Schedule topup
  var _Change_Cycle_Flag = detailsInfo._ChangeCycleFlag;

  $scope.data = {
    grandTotal: 0,
    payment: null,
    paymentType: null,
    isOnlinePayment: false,
  };
  var paymentOptions = [{
    id: '1',
    title: 'Cash Payment',
  }, {
    id: '2',
    title: 'Credit Card',
  // }, {
  //   id: '3',
  //   title: 'Online Banking',
  }, ];

  $scope.selectedPolices = [];
  _.each(detailsInfo.policies, function(item) {
    if (item.selected)
      $scope.selectedPolices.push(item);
  });
  $scope.viewData.payments = paymentOptions;

  if ($scope.selectedPolices.length == 0)
    $scope.selectedPolices = [detailsInfo.selectedPolicy];

  $scope.selectedPolicy = detailsInfo.selectedPolicy;

  $scope.stampDuty = detailsInfo.stampDuty;
  $scope.paymentCard = detailsInfo.policies;

  $scope.data.grandTotal = PaymentService.initPayment($scope.paymentCard);

  // BroadcastService.on(BroadcastService.msgs.paymentFailed, function(event) {
  //   // $scope.steps = TransactionsService.updateState(3);
  //   $scope.viewData.paymentSuccess = false;
  //   $log.error('payment Failed');
  // });

  // BroadcastService.on(BroadcastService.msgs.paymentSuccess, function(event) {
  //   // $scope.steps = TransactionsService.updateState(3);
  //   $scope.viewData.paymentSuccess = true;
  //   cashPayment();
  //   $log.info('payment Success');
  // });

  $scope.updateState = function(step) {
    PaymentService.updateSteps(step);
    $scope.steps = PaymentService.step();
    setPaymentType();
  };

  function setPaymentType() {
    if ($scope.steps === 2) {
      var policy = _.find($scope.selectedPolices, function(item) {
        return item.freq === 12;
      });

      if (policy) {
        $scope.viewData.payments = paymentOptions.slice(-1);
      } else {
        $scope.viewData.payments = paymentOptions;
      }
    }
  };

  function getXfield1(policies) {
    var tmp = _.groupBy(policies, 'lineOfBiz');
    // if (!tmp.LA) tmp.LA = [];
    var sum = {
      LA: 0,
      LAFT: 0,
      PA: 0,
    };
    _.each(tmp, function(obj) {
      _.each(obj, function(item) {
        sum[item.lineOfBiz] += _.toNumber(item.paymentAmount);
      });
    });

    // marge same systems.
    // if (tmp.PA) {
    //   tmp.LA = tmp.LA.concat(tmp.PA);
    //   delete tmp.PA;
    // }

    // count the values
    // sum.LA += sum.PA;
    // sum.PA = 0;

    // remove nulls;
    if (!sum.LA) delete sum.LA;
    if (!sum.LAFT) delete sum.LAFT;
    if (!sum.PA) delete sum.PA;

    var count = ('00' + _.keys(tmp).length).slice(-2);

    var returnTmp = [count];
    _.each(tmp, function(item, key) {
      var buildObj = null;
      // 
      if (_ENV_PROD === true)
        buildObj = AppMeta.iPay.merchantCode + AppMeta.iPay[key] + ':' + sum[key].toFixed(2); //sum[key].toFixed(2); // '1.00'
      else
        buildObj = AppMeta.iPay.merchantCode + AppMeta.iPay[key] + ':' + '1.00'; //sum[key].toFixed(2); // '1.00'
      // 
      returnTmp.push(buildObj);
    });

    return returnTmp.join(';');
  }

  function preOnlinePayment(policies) {
    var policies = [];
    var total = 0;
    _.each($scope.selectedPolices, function(item) {
      var obj = null;
      if (item.lineOfBiz.toUpperCase() === 'PA')
        obj = cashPA(item);
      else obj = cashLA(item);

      // item.initVal = item.initVal ? _.toNumber(item.initVal) : 0;
      // var obj = {
      // policyNo: item.policyNo,
      obj.aplFlag = item.aplSelected ? 'Y' : 'N';
      obj.vitalityFlag = 'N';

      // obj.paymentAmount = _.toNumber(item.modalPremium); // ??
      obj.aplAmount = obj.aplWithInterest; //item.aplSelected ? item.apl.toFixed(2) : '0';
      obj.gstAmt = obj.gstAmount; //(item.gstAmount * (item.initVal + 1)).toString();
      obj.noAdvPay = _.toNumber(item.initVal || 0).toString(); //(item.initVal).toString();
      obj.advancePaymentAmt = (item.modalPremium * item.initVal) || 0; // .toString();
      obj.policyLoanAmt = item.policyLoanWithInterest; // item.loanSelected ? item.loan.toFixed(2) : '0';
      obj.adhocTopUpAmt = (_TOPUP_MODE === 1) ? _.toNumber(item.topUpAmount) : '0';
      obj.scheduledTopUpAmt = (_TOPUP_MODE === 0) ? _.toNumber(item.topUpAmount) : '0';

      obj.lineOfBiz = item.lineOfBiz;

      obj.insuredName = '';
      obj.cardType = '';
      obj.insuredNRIC = '';
      // };
      // obj.paymentAmount += _.toNumber(obj.aplAmount) + _.toNumber(obj.gstAmt) + _.toNumber(obj.advancePaymentAmt) + _.toNumber(obj.adhocTopUpAmt) + _.toNumber(obj.scheduledTopUpAmt) + _.toNumber(obj.policyLoanAmt);
      obj.paymentAmount = obj.totalPremiumAmount;
      total += obj.totalPremiumAmount;

      stringifyObj(obj);
      policies.push(obj);
    });

    if (!policies.length) return;

    var xfield1 = getXfield1(policies);

    _.each(policies, function(item) {
      item.paymentAmount = item.paymentAmount.toString();
    });

    if (_Change_Cycle_Flag) {
      _.each(policies, function(item) {
        item.modalPremium = (_.toNumber(item.modalPremium) - _.toNumber(item.gstAmount)).toFixed(2)
      });
    }

    return ResourcesService.preOnlinePayment(policies, xfield1)
      .then(function success(data) {
        data.res.total = total;
        data.res.xfield1 = xfield1;
        return data.res;
      }, function failed(err) {

        return err;
      });
  }

  function updatePostOnlinePayment(res, transactionId, response, success, failer) {
    success = success || angular.noop;
    failer = failer || angular.noop;

    return ResourcesService.postOnlinePayment({
      transactionId: transactionId,
      channel: AppMeta.appRefNo,
      response: response,
      authCode: res.authCode,
      transId: res.transId || res['transId '],
      errorDescription: res.errDesc || null,
      amount: res.amount,
      creditCardNo: res.ccNo,
    }).then(success, failer);
  }

  function onlinePayment(paymentId) {
    $ionicLoading.show({
      template: 'Please Wait...',
    });

    var _authCode = null;
    preOnlinePayment()
      .then(function(data) {
        // $log.log(data);
        var amount = 0;
        if (_ENV_PROD === true)
          amount = data.total.toFixed(2);
        else {
          amount = data.xfield1.substring(0, 2); // data.total;
          amount = (_.toNumber(amount) * 1).toFixed(2);
        }

        aiaPlugin.makePayment({
          amount: _.toNumber(amount).toFixed(2),
          name: detailsInfo.clientDetails.policyOwnerName || detailsInfo.selectedPolicy.insuredName, // 2nd for topup.
          email: detailsInfo.clientDetails.email || 'N/A',
          phone: detailsInfo.clientDetails.mobileNo,
          refNo: data.transactionId,
          description: AppMeta.iPayRef,
          paymentId: paymentId || '2', // online payment. ; 16: online banking
          remark: AppMeta.iPayRef,
          xfield1: data.xfield1,
          actionType: (paymentId == '16') ? '' : 'BT',
        }, function iPay88Success(res) {
          _authCode = res.authCode;
          try {
            console.log('iPay88Success: ' + JSON.stringify(res));
          } catch (_e) {
            console.log('iPay88Success catch is: ' + _e);
          }

          updatePostOnlinePayment(res, data.transactionId, '1',
            function postOnlinePaymentSuccess(res) {
              var paymentType = (_TOPUP_MODE === 1) ? 'T' : 'O';
              $scope.data.isOnlinePayment = true;
              cashPayment(paymentType, _authCode);
            },

            function postOnlinePaymentFailer(res) {
              $ionicLoading.hide();
              NotificationService.alert({
                title: 'Error',
                template: 'Online Payment Failed, Please try again.',
              });
            });

        }, function iPay88Failer(res) {
          try {
            console.log('res: ' + JSON.stringify(res));
          } catch (_e) {
            console.log('res catch is: ' + _e);
          }

          $ionicLoading.hide();
          NotificationService.alert({
            title: 'Error',
            template: res.errDesc || 'Online Payment Failed, Please try again.',
          });
          updatePostOnlinePayment(res, data.transactionId, '0');
        });
      });

  };

  function getInitPaymnetObj(item) {
    var obj = {
      policyNo: item.policyNo,
      aplWithInterest: item.actions.aplSelected ? _.toNumber(item.apl) : 0,
      policyLoanWithInterest: item.actions.loanSelected ? _.toNumber(item.loan) : 0,
      totalPremiumAmount: _.toNumber(item.actions.total),
      stampDuty: _.toNumber(item.stampDuty) || 0,

      _topup: (_TOPUP_MODE === 1) ? _.toNumber(item.topUpAmount) : 0,
      _policyStatus: item.policyStatus,
      _premiumDueDate: item.premiumDueDate,
      _freqDesc: item.freqDesc,
      lineOfBiz: item.lineOfBiz,
      _agentId: item.agentId,
      _agentName: item.name,
      total: _.toNumber(item.actions.total),
    };

    return obj;
  }

  function stringifyObj(obj) {
    if (!obj || _.isNull(obj) || _.isEmpty(obj)) return obj;
    for (var key in obj) {
      if (_.isNumber(obj[key]))
        obj[key] = obj[key].toFixed(2);
    }
  }

  function cashPA(policy) {
    var obj = getInitPaymnetObj(policy);
    obj.gstAmount = _.toNumber(policy.gstAmount);

    obj.modalPremium = _.toNumber(policy.modalPremium);
    if (policy.reinstatementOutstandingAmount != 0 && !_.isUndefined(policy.reinstatementOutstandingAmount) && !_.isNull(policy.reinstatementOutstandingAmount)) {
      obj.gstAmount = _.toNumber(policy['reinstatementOutstandingGSTAmount ']);
      obj.stampDuty = _.toNumber(policy['reinstatementOutstandingStampDuty ']);
      obj.modalPremium = _.toNumber(policy.reinstatementOutstandingAmount) - obj.gstAmount - obj.stampDuty;
    }

    if (policy.initVal > 0) {
      obj.gstAmount = obj.gstAmount * (policy.initVal + 1);;
      obj.modalPremium = obj.totalPremiumAmount - obj.gstAmount;
    }

    return obj;
  }

  function cashLA(policy) {
    var obj = getInitPaymnetObj(policy);
    obj.gstAmount = _.toNumber(policy.gstAmount);

    obj.modalPremium = 0;
    if (policy.isChangeCycle === true) {
      obj.modalPremium = policy.advance
    } else if (policy.topUpAmount && policy.topUpAmount != 0) {
      if (policy.topUpMode === 0) // Schedule topup.
        obj.modalPremium = policy.topUpAmount + policy.totalPremiumAmount - obj.gstAmount;
      else obj.modalPremium = policy.topUpAmount;
    } else if (policy.reinstatementOutstandingAmount && policy.reinstatementOutstandingAmount != 0) {
      obj.modalPremium = _.toNumber(policy.reinstatementOutstandingAmount);
    } else {
      obj.modalPremium = _.toNumber(policy.modalPremium);
    }

    // advance
    if (policy.initVal > 0) {
      var advanceGST = obj.gstAmount * policy.initVal;
      obj.modalPremium += (policy.advance - advanceGST);
      if (policy.reinstatementOutstandingAmount != 0)
        obj.gstAmount = advanceGST;
      else
        obj.gstAmount += advanceGST;
    } else if (policy.reinstatementOutstandingAmount && policy.reinstatementOutstandingAmount != 0 && policy.initVal === 0) {
      obj.gstAmount = 0;
    }

    return obj;

  }

  function receiptPolicies() {
    var policies = [];
    _.each($scope.selectedPolices, function(item) {
      var obj = null;
      if (item.lineOfBiz.toUpperCase() === 'PA')
        obj = cashPA(item);
      else obj = cashLA(item);

      stringifyObj(obj);
      policies.push(obj);
    });

    return policies;
  };

  function cashPayment(paymentType, authCode) {
    var policies = receiptPolicies();
    $scope.selectedPolices = _.map($scope.selectedPolices, function(item) {
      var tmpPolicy = _.find(policies, function(selected) {
        return selected.policyNo === item.policyNo;
      });

      item.total = tmpPolicy.total;
      return item;
    });

    if (!$scope.data.isOnlinePayment) {
      $scope.data.grandTotal = _.sumBy(policies, function(item) {
        return _.toNumber(item.total);
      });
    }

    if (_TOPUP_MODE === 1 && paymentType !== 'T')
      paymentType = 'A';

    if (_Change_Cycle_Flag) {
      _.each(policies, function(item) {
        item.modalPremium = (_.toNumber(item.modalPremium) - _.toNumber(item.gstAmount)).toFixed(2)
      });
    }

    var submitData = {
      paymentDetails: policies,
      paymentType: paymentType,
      approvalCode: authCode || null,
    };

    TransactionsService.submission.submitPaymentReceipt(submitData)
      .then(function(__data) {
        var receipts = __data.res,
          smsPayload = __data.smsPayload;

        if (receipts) {
          $log.info(receipts);
          $scope.data.receipts = _.map(receipts, function(item) {
            var tmpPolicy = _.find($scope.selectedPolices, function(selected) {
              return selected.policyNo === item.policyNo;
            });

            _.assign(tmpPolicy, item);
            return tmpPolicy;
          });
          // generate Receipts:

          var successReceipts = _.map(receipts, function(item) {
            var tmpPolicy = _.find(policies, function(selected) {
              return selected.policyNo === item.policyNo && item.respCode == 0;
            });

            _.assign(tmpPolicy, item);
            return tmpPolicy;
          });

          successReceipts = _.remove(successReceipts, function(item) {
            return item !== undefined;
          });

          var attachmentArr = [];
          _.each(successReceipts, function(item, key) {
            item.topup_mode_flag = _TOPUP_MODE;
            var attachment = TransactionsService.submission.emailAttachment(item);
            // var pdf = new jsPDF('p','pt','a4');
            // var canvas = pdf.canvas;
            // canvas.height = 72 * 11.7;
            // canvas.width = 72 * 8.27;

            // html2pdf(attachment, pdf, function(pdf) {
            //   var t = pdf.output('blob');
            //   var arrayBuffer;
            //   var fileReader = new FileReader();
            //   fileReader.onload = function() {
            //     console.log(this.result)
            //     arrayBuffer = this.result;
            //     smsPayload.reqBody.data.attachment = ab2str(arrayBuffer);
            //     smsPayload.reqBody.data.attachmentType = 'pdf';
            //     smsPayload.reqBody.data.attachmentName = 'receipt';
            //     if (key == 0)
            //       ResourcesService.submission.sendReceiptSMSEmail(_.cloneDeep(smsPayload), false); // change false to true in second loop onward..
            //     else
            //       ResourcesService.submission.sendReceiptSMSEmail(_.cloneDeep(smsPayload), true); // change false to true in second loop onward..
            //   };
            //   fileReader.readAsArrayBuffer(t);
            // });
            attachmentArr.push({
              attachment: attachment,
              attachmentName: key ? ('receipt ' + key) : 'receipt',
              attachmentType: 'HTML',
            });
          });

          smsPayload.reqBody.data.attachmentInfo = attachmentArr;
          ResourcesService.submission.sendReceiptSMSEmail(_.cloneDeep(smsPayload));


          //
          $scope.steps = TransactionsService.updateState(3);
          $scope.viewData.paymentSuccess = true;

          callPromisedSubmission();
        }
      }, function err() {
        // handel.
      });
  };

  function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
  }

  $scope.goPayment = function goPayment() {
    // Cache Payment
    if ($scope.data.paymentType === '1') {
      cashPayment('C');
    }
    // Online Payment
    else if ($scope.data.paymentType === '2') {
      onlinePayment();
    } else if ($scope.data.paymentType === '3') {
      onlinePayment('16');
    }
  };

  $scope.finishPayment = function() {
    TransactionsService.backAfterSubmition(detailsInfo.stepsBack);
  };

  function callPromisedSubmission() {
    // execute extra submission if any
    if (!detailsInfo.submitObj || !detailsInfo.submitObj.submitFunc || !detailsInfo.submitObj.submitData) {
      $scope.viewData.submissionSuccess = true;
      return;
    }

    $ionicLoading.show({
      template: 'Please Wait...',
    });

    // need total payment amount for email template
    detailsInfo.submitObj.submitData.transaction.grandTotal = $scope.data.grandTotal;

    detailsInfo.submitObj.submitFunc(detailsInfo.submitObj.submitData)
      .then(function(res) {
        // success
        $ionicLoading.hide();
        $ionicScrollDelegate.scrollTop(true);
        $scope.viewData.submissionSuccess = true;
        return true;
      }, function error(errMsg) {
        // failed
        $log.error(errMsg);
        $ionicLoading.hide();

        NotificationService.alert({
          title: 'Error',
          template: 'Your payment is successful, but the transaction submission failed, please try again for the transaction submission.',
          okText: 'Retry',
          // template: errMsg,
        }).then(function() {
          $log.info('retry mah');
          callPromisedSubmission();
        });

        return false;
      });
  }

  function calculateTotal(item) {
    $scope.data.grandTotal = PaymentService.calcTotal(item, $scope);
  }

  $scope.showInfoModal = function() {
    PaymentService.showInfoModal($scope, $scope.selectedPolicy.policyStatus);
  };

  $scope.calcTotalApl = function(hideModal) {
    hideModal = hideModal || !this.selectedPolicy.actions.aplSelected;
    if (this.selectedPolicy.actions.aplSelected && this.selectedPolicy.apl == undefined)
      this.selectedPolicy.apl = 100;
    calculateTotal(this.selectedPolicy);
    if (!hideModal)
      PaymentService.showAplModal($scope, this.selectedPolicy.apl);
  };

  $scope.calcTotalLoan = function(hideModal) {
    hideModal = hideModal || !this.selectedPolicy.actions.loanSelected;
    if (this.selectedPolicy.actions.loanSelected && this.selectedPolicy.loan == undefined)
      this.selectedPolicy.apl = 100;
    calculateTotal(this.selectedPolicy);
    if (!hideModal)
      PaymentService.showLoanModal($scope, this.selectedPolicy.loan);
  };

  $scope.updateGrand = _.debounce(function _updateGrand(event) {
    $scope.data.grandTotal = PaymentService.updateGrand($scope.paymentCard);
    // manipulate checking... 
    if (!this.item.actions.selected) { // on uncheck:
      // if this policy is LALA/IFETI, just uncheck it
      if (PolicyService.isInForceETI(this.item) || PolicyService.isLapsed(this.item))
        return;
      PolicyService.selectPolices(this.item.policyNo, $scope.selectedPolices, false);
    } else {
      PolicyService.selectPolices(this.item.policyNo, $scope.paymentCard, true);
    }

    _.each($scope.selectedPolices, function(item) {
      item.actions.selected = item.selected;
      if (item.selected) {
        $scope.selectedPolices.push(item);
      }
    });

    _.each($scope.paymentCard, function(item) {
      item.actions.selected = item.selected;
      if (item.selected) {
        $scope.selectedPolices.push(item);
      }
    });

    $scope.selectedPolices = _.uniqBy($scope.selectedPolices, 'policyNo');
    $scope.data.grandTotal = PaymentService.updateGrand($scope.paymentCard);
    try {
      $scope.$apply()
    } catch (_e) {}
  }, 50);

  $scope.updateAdvance = function() {
    if (_.isNull(this.selectedPolicy.initVal) || _.isUndefined(this.selectedPolicy.initVal))
      this.selectedPolicy.initVal = 0;
    this.selectedPolicy.advance = Math.round(parseFloat(this.selectedPolicy.initVal * this.selectedPolicy.totalPremiumAmount) * 100) / 100;
    $scope.data.grandTotal = PaymentService.calcTotal(this.selectedPolicy, $scope);

    var masterPolicy = null;
    if (this.selectedPolicy.packagePolicyFlag && this.selectedPolicy.packagePolicyFlag === 'Y') {
      masterPolicy = this.selectedPolicy.masterPolicy
      var initVal = this.selectedPolicy.initVal;
      var selectedPolicyAdvance = this.selectedPolicy.policyNo;

      _.each($scope.paymentCard, function(item) {
        if (item.masterPolicy === masterPolicy && item.policyNo !== selectedPolicyAdvance) {
          if (item.initVal !== initVal)
            item.initVal = initVal;

          item.advance = Math.round(parseFloat(item.initVal * item.totalPremiumAmount) * 100) / 100;

          // item.initVal = initVal;
          // item.advance = advance;
          $scope.data.grandTotal = PaymentService.calcTotal(item, $scope);
        }
      })

    }

  };

  function updateSelection(arr, index) {
    var policy = arr[index];
    $scope.selectedPolicy = policy;
    _.each(arr, function(item) {
      item.actions.current = false;
    });

    arr[index].actions.current = true;
  }

  $scope.onPolicyClickStep1 = function(index) {
    updateSelection($scope.paymentCard, index);
  };

  $scope.onPolicyClickStep2 = function(index) {
    updateSelection($scope.selectedPolices, index);
  };

  // fix it
  $scope.isInforce = function() {
    return $scope.selectedPolicy.policyStatusCode === 'IF';
  };

  $scope.isInForceETI = function(policyInfo) {
    return PolicyService.isInForceETI(policyInfo);
  };

  $scope.isInForceSVE = function(policyInfo) {
    return PolicyService.isInForceSVE(policyInfo);
  };

  $scope.isLapsed = function(policyInfo) {
    return PolicyService.isLapsed(policyInfo);
  };

  $scope.isCA = function(policyInfo) {
    return PolicyService.isCA(policyInfo);
  };

  $scope.$watch('paymentCard', function(nv, ov) {
    _.forEach(nv, function(item, index) {
      if (!item.apl && ov[index].apl)
        $scope.paymentCard[index].apl = $scope.paymentCard[index].actions.aplMin;
      if (!item.loan && ov[index].loan)
        $scope.paymentCard[index].loan = $scope.paymentCard[index].actions.loanMin;
    });
  }, true);
});