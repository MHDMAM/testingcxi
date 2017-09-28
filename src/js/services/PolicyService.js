angular.module('app.services')

.factory('PolicyService', function (ResourcesService, ChangePaymentCycleService, $log) {
  var policyDetails = {};
  var policyDashoard = {};
  var transactions = [{
    state: 'medicalCard',
    icon: 'img/mcard-replace.svg',
    translate: 'policyDetails.update_medical_card',
    ngIf: showMedicalCard,
  }, {
    state: 'changeAddress',
    icon: 'img/chnage-address.svg',
    translate: 'policyDetails.change_of_address',
    ngIf: showChangeAddress,
  }, {
    state: 'cancelAutoDebit',
    icon: 'img/cancel-autodebit.svg',
    translate: 'policyDetails.cancel_auto_debit',
    ngIf: showCancelAutoDebit,
  }, {
    state: 'changePaymentCycle',
    icon: 'img/payment.svg',
    translate: 'policyDetails.change_payment_cycle',
    ngIf: showPaymentCycle,
  }, {
    state: 'payment',
    icon: 'img/mode-payment.svg',
    translate: 'policyDetails.make_payment',
    ngIf: showPayment,
  }, {
    state: 'topUp',
    icon: 'img/topup.svg',
    translate: 'policyDetails.premium_top_up',
    ngIf: showTopUp,

  }, {
    state: 'fundSwitching',
    icon: 'img/fundswitch.svg',
    translate: 'policyDetails.fund_switching',
    ngIf: showFundSwitching,
  }, {
    state: 'directCredit',
    icon: 'img/reimbursement.svg',
    translate: 'policyDetails.reimbursement_account',
    ngIf: showDirectCredit,
  }, {
    state: 'giwl',
    icon: 'img/reinstatement.svg',
    translate: 'policyDetails.reinstatement_giwl',
    ngIf: showReinstatement,
  }, {
    state: 'MedicalExamination',
    icon: 'img/reinstatement.svg',
    translate: 'policyDetails.reinstatement_medical',
    ngIf: false,
  }, {
    state: 'creditCard',
    icon: 'img/credit-card.svg',
    translate: 'policyDetails.creditCard',
    ngIf: showCreditCard,
  },];

  function getBasicRider(riders) {
    return _.find(riders, function (item) {
      return (item.coverageNumber && item.coverageNumber === '010100');
    });
  }

  function showCreditCard(data) {
    switch (data.policyInfo.lineOfBiz) {
      case 'LA':
        return _PolicyService.isInForcePremiumPay(data.policyInfo);
      case 'LAFT':
        return _PolicyService.isInForcePremiumPay(data.policyInfo);
      case 'PA':
        if (data.policyInfo.policyNo &&
          (data.policyInfo.policyNo.toString().length === 8 && data.policyInfo.policyNo.toString().toUpperCase().indexOf('P80') === 0) ||
          (data.policyInfo.policyNo.toString().toUpperCase().indexOf('P00') === 0))
          return false;
        return _PolicyService.isInForce(data.policyInfo);
    }

    return false;
  }

  function showMedicalCard(data) {
    if (data.clientDetails.medicalReplaceFlag !== 'N' && data.clientDetails.medicalReplaceFlag !== 'C')
      return false;

    switch (data.policyInfo.lineOfBiz.toUpperCase()) {
      case 'LA':
      case 'LAFT':
        return (_PolicyService.isInForcePremiumPay(data.policyInfo));

      case 'PA':

        var tmp = _.find(data.riders, function (item) {
          return item.planRiders.toUpperCase().indexOf('TREATMENT BENEFIT') >= 0;
        });

        return (tmp && _PolicyService.isInForce(data.policyInfo));

      default:
        return null;
    }
  }

  function showCancelAutoDebit(data) {
    if (!data.policyInfo.lineOfBiz || data.policyInfo.freq === '12') return false;

    switch (data.policyInfo.lineOfBiz.toUpperCase()) {
      case 'LAFT':
      case 'LA':
        return (_PolicyService.isInForcePremiumPay(data.policyInfo) && data.policyInfo.paymentMethodCode === 'D');

      case 'PA': // need to check alter
        if (!_PolicyService.isInForce(data.policyInfo))
          return false;

        if (data.policyInfo.paymentMethodCode && data.policyInfo.paymentMethodCode.indexOf('B') === 0)
          return true;

      default:
        return false;
    }

    return false;
  };

  function showPaymentCycle(data) {
    if (ChangePaymentCycleService.allowCycleChangeByProductType.notAllowedToChange(data.policyInfo)) return false;
    if (data.policyInfo.lineOfBiz === 'PA')
      return _PolicyService.isInForce(data.policyInfo);
    else
      return _PolicyService.isInForcePremiumPay(data.policyInfo);
  };

  function showPayment(data) {

    if (!data.policyInfo.lineOfBiz || !data.policyInfo.policyStatusCode) return false;
    switch (data.policyInfo.lineOfBiz) {
      case 'LAFT':
        if (data.policyInfo.reinstatementFlag && data.policyInfo.reinstatementFlag === '1' && ['ET', 'SV', 'LA'].indexOf(data.policyInfo.premiumStatusCode) >= 0)
          if (data.policyInfo.reinstatementOutstandingAmount != 0) return true;
        else return false;

        if (['IF', 'LA', 'PU'].indexOf(data.policyInfo.policyStatusCode) >= 0 && ['ET', 'LA', 'PP', 'PU'].indexOf(data.policyInfo.premiumStatusCode) >= 0)
          if (!data.policyInfo.reinstatementFlag || (data.policyInfo.reinstatementFlag && data.policyInfo.reinstatementFlag === '1'))
            return true;
        return false;

      case 'LA':
        if (data.policyInfo.reinstatementFlag && data.policyInfo.reinstatementFlag === '1' && ['ET', 'SV', 'LA'].indexOf(data.policyInfo.premiumStatusCode) >= 0)
          if (data.policyInfo.reinstatementOutstandingAmount != 0) return true;
        else return false;

        if (['IF', 'ET', 'LA'].indexOf(data.policyInfo.policyStatusCode) >= 0 && ['ET', 'LA', 'PP', 'PU', 'TP'].indexOf(data.policyInfo.premiumStatusCode) >= 0)
          if (!data.policyInfo.reinstatementFlag || (data.policyInfo.reinstatementFlag && data.policyInfo.reinstatementFlag === '1'))
            return true;
        return false;
      case 'PA':
        if (data.policyInfo.reinstatementFlag && data.policyInfo.reinstatementFlag === '1' && data.policyInfo.policyStatusCode === 'LA')
          if (data.policyInfo.reinstatementOutstandingAmount != 0) return true;
        else return false;

        if (['AR', 'IF', 'MR', 'PE', 'PN', 'PR', 'RR', 'CA'].indexOf(data.policyInfo.policyStatusCode) >= 0)
          if (!data.policyInfo.reinstatementFlag || (data.policyInfo.reinstatementFlag && data.policyInfo.reinstatementFlag === '1'))
            return true;
        return false;

      default:
        return false;
    }
  };

  function showTopUp(data) {
    // WIL1/2 can do adhoc topup to the old funds but not adding new funds.
    return data.policyInfo.planCode && ((data.policyInfo.planCode.toUpperCase() === 'WIL1' || data.policyInfo.planCode.toUpperCase() === 'WIL2') ||
        (data.investmentPortfolio &&
          (_PolicyService.isInForcePremiumPay(data.policyInfo) ||
            _PolicyService.isWaiver(data.policyInfo) ||
            _PolicyService.isSP(data.policyInfo)))); // with list of codes
  }

  function showChangeAddress(data) {
    return _PolicyService.isInForce(data.policyInfo);
  }

  function showFundSwitching(data) {
    // check if investment portfolio is present and not empty
    if (!data.investmentPortfolio || data.investmentPortfolio.length === 0) {
      return false;
    }

    switch (data.policyInfo.lineOfBiz) {
      case 'LAFT':
        // check basic rider plan code first
        if (data.policyInfo.riders && data.policyInfo.riders.length > 0) {
          var basicRider = getBasicRider(riders);
          if (basicRider)
            var planCode = data.policyInfo.riders[0].planCode;
          var codes = ['AIV', 'EXL', 'APR']; //takaful codes
          if (codes.indexOf(planCode) > 0)
            return false;
        }

        // return true if: IF WV && IFPP
        return (_PolicyService.isInForcePremiumPay(data.policyInfo) || _PolicyService.isWaiver(data.policyInfo) || _PolicyService.isSP(data.policyInfo));

      case 'LA':
        // return true if: (IF PP, IF WV & IF SP)
        return (_PolicyService.isInForcePremiumPay(data.policyInfo) || _PolicyService.isWaiver(data.policyInfo) || _PolicyService.isSP(data.policyInfo));
      default:
        return false;
    }
  }

  function showDirectCredit(data) {
    return true;
  }

  function showReinstatement(data) {
    return false;
  }

  var _PolicyService = {
    getPolicyDetails: function (policyNo) {
      return new Promise(function (resolve, reject) {
        if (!_.isEmpty(policyDetails) && policyNo === policyDetails.policyInfo.policyNo) {
          return resolve(policyDetails);
        }

        return ResourcesService.getDetails(policyNo)
          .then(function (data) {
            policyDetails = data.res;
            $log.log(policyDetails);

            return resolve(policyDetails);

          }, function (errMsg) {

            return reject(errMsg);
          });
      });
    },

    getPolicyDashboard: function (userInfo) {
      return new Promise(function (resolve, reject) {
        if (!_.isEmpty(policyDashoard)) {
          return resolve(policyDashoard);
        }

        return ResourcesService.policySearch(userInfo, true)
          .then(function (data) {
            $log.info(data.res);

            policyDashoard = data.res;

            return resolve(policyDashoard);
          }, function err(errMsg) {

            return reject(errMsg);
          });
      });
    },

    clearCache: function () {
      policyDetails = policyDashoard = {};
    },

    updateTransactionNgIf: function updateTransactionNgIf(data) {
      var this_transactions = _.cloneDeep(transactions);
      _.each(this_transactions, function (item) {
        if (item.ngIf !== true && item.ngIf !== false)
          item.ngIf = item.ngIf(data);
      });

      return _.filter(this_transactions, function (item) {
        return item.ngIf;
      });
    },

    initData: function initData(data) {

      if (data && data.investmentPortfolio)
        data.calulatedFeilds.Table_total = _.sumBy(data.investmentPortfolio, function (item) {
          var tmpVal = _.toNumber(item.valueOfUnits).toFixed(2);
          return _.toNumber(tmpVal);
        });

      if (data.policyInfo.lineOfBiz === 'LA' || data.policyInfo.lineOfBiz === 'LAFT') {

        // get Basic rider.
        data.calulatedFeilds.coverageAmount = getBasicRider(data.riders);

        data.policyInfo.paymentMethod = '';
        if (data.policyInfo.paymentMethodCode === 'C') {
          data.policyInfo.paymentMethod = 'Direct Billing';
        } else if (data.policyInfo.paymentMethodCode === 'D' && data.policyInfo.factoringCode && data.policyInfo.factoringCode === 'CC') {
          data.policyInfo.paymentMethod = 'Auto Payment via Credit Card';
        } else if (data.policyInfo.paymentMethodCode == 'D' && data.policyInfo.factoringCode && (data.policyInfo.factoringCode === '01' || data.policyInfo.factoringCode === '02' || data.policyInfo.factoringCode === '03')) {
          data.policyInfo.paymentMethod = 'Auto Payment via Bank Account';
        }
      } else {
        data.riders = _.sortBy(data.riders, 'coverageCode');
        data.calulatedFeilds.coverageAmount = data.riders[0];

        // payment method:
        data.policyInfo.paymentMethod = '';

        if (data.policyInfo.paymentMethodCode.indexOf('D') === 0) {
          data.policyInfo.paymentMethod = 'Direct Billing';
        } else if (data.policyInfo.paymentMethodCode.indexOf('B') === 0 && data.policyInfo.factoringCode && (data.policyInfo.factoringCode === '61' || data.policyInfo.factoringCode === '53' || data.policyInfo.factoringCode === '54')) {
          data.policyInfo.paymentMethod = 'Auto Payment via Credit Card';
        } else if (data.policyInfo.paymentMethodCode.indexOf('B') === 0 && data.policyInfo.factoringCode && (data.policyInfo.factoringCode === '62' || data.policyInfo.factoringCode === '30' || data.policyInfo.factoringCode === '56')) {
          data.policyInfo.paymentMethod = 'Auto Payment via Bank Account';
        }

      }
    },

    isInForceETI: function (policyInfo) {
      return policyInfo.policyStatusCode === 'IF' && policyInfo.premiumStatusCode === 'ET';
    },

    isInForceSVE: function (policyInfo) {
      return policyInfo.policyStatusCode === 'IF' && policyInfo.premiumStatusCode === 'SV';
    },

    isInForcePremiumPay: function (policyInfo) {
      return policyInfo.policyStatusCode === 'IF' && policyInfo.premiumStatusCode == 'PP';
    },

    isLapsed: function (policyInfo) {
      if (policyInfo.lineOfBiz === 'PA')
        return policyInfo.policyStatusCode === 'LA';

      return policyInfo.policyStatusCode === 'LA' && policyInfo.premiumStatusCode === 'LA';
    },

    isWaiver: function (policyInfo) {
      return policyInfo.premiumStatusCode === 'WV';
    },

    isSP: function (policyInfo) {
      return policyInfo.premiumStatusCode === 'SP';
    },

    isInForce: function (policyInfo) {
      return policyInfo.policyStatusCode === 'IF';
    },

    isCA: function (policyInfo) {
      return policyInfo.policyStatusCode === 'CA';
    },

    selectPolices: function selectPolices(policyNo, policies, selected) {
      if (selected === null || selected === undefined) selected = true;

      var masterPolicy = _.find(policies, function (policy) {
        return policy.policyNo === policyNo;
      });

      if (masterPolicy && masterPolicy.packagePolicyFlag === 'Y') {
        masterPolicy = masterPolicy.masterPolicy;

        _.each(policies, function (item) {
          if (item.masterPolicy === masterPolicy) {
            item.selected = selected;
          }
        });
      } else {
        _.each(policies, function (item) {
          if (item.policyNo === policyNo) {
            item.selected = selected;
          }
        });
      }

      if (selected === false) // uncheck
        _.remove(policies, function (item) {
        return item.selected == false;
      });
    },

    canDoPayment: showPayment,
    canDoChangePayment: showPaymentCycle,
    canPrefourmCancelAutoDebit: showCancelAutoDebit,
    canCOA: showChangeAddress,
    creditCard: showCreditCard,
  };

  return _PolicyService;

});
