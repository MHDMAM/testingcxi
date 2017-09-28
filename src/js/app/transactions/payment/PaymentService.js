angular.module('app.services')

.factory('PaymentService', function($ionicScrollDelegate, $sce, $log, ModalService, BroadcastService, PolicyService, TransactionsService, ResourcesService, UtilityService, SecurityService) {

  var _step = 1;
  var _grandTotal = 0;
  var paymentIntervalId, paymentTimeoutId;

  //
  function grandTotal(data) {
    _grandTotal = _.sumBy(data, function(item) {
      if (item.actions.selected === true)
        return item.actions.total;
      return 0;
    });

    _grandTotal = UtilityService.parseRoundFloat(_grandTotal);
  }

  function specialCases(item) {
    if (item.reinstatementOutstandingAmount === 0)
      item.actions.total = UtilityService.parseRoundFloat(item.totalPremiumAmount + item.advance);
    else if (item.topUpAmount)
      item.actions.total = UtilityService.parseRoundFloat(item.totalPremiumAmount + item.topUpAmount + item.advance);
    else {
      var amount = item.advance;
      if (PolicyService.isLapsed(item) || PolicyService.isInForceETI(item)) {
        amount += parseFloat(item.reinstatementOutstandingAmount);
      }
      if (PolicyService.isInForceSVE(item) || PolicyService.isCA(item)) {
        amount += parseFloat(item.reinstatementOutstandingAmount);
      }
      if (!PolicyService.isLapsed(item) && !PolicyService.isInForceETI(item) && !PolicyService.isInForceSVE(item)) {
        amount += item.totalPremiumAmount;
      }
      item.actions.total = UtilityService.parseRoundFloat(amount);
    }
  }

  function updateTotal(item) {
    if (_.isNaN(item.advance)) item.advance = 0;
    if (!item.actions) item.actions = {};
    specialCases(item);
  }

  function aplLogic(item) {
    if (PolicyService.isLapsed(item.policyStatus))
      return item.actions.aplDisabled = true;
    if (item.aplWithInterest > 100) {
      item.actions.aplMin = 100;
      item.actions.aplMax = item.aplWithInterest;
      item.actions.aplDisabled = false;
    } else {
      item.actions.aplMin = item.actions.aplMax = item.aplWithInterest;
      item.actions.aplDisabled = true;
    }
  }

  function loanLogic(item) {
    if (PolicyService.isLapsed(item.policyStatus))
      return item.actions.loanDisabled = true;
    if (item.policyLoanWithInterest > 100) {
      item.actions.loanMin = 100;
      item.actions.loanMax = item.policyLoanWithInterest;
      item.actions.loanDisabled = false;
    } else {
      item.actions.loanMin = item.actions.loanMax = item.policyLoanWithInterest;
      item.actions.loanDisabled = true;
    }
  }

  function aplModal(scope, val) {
    var tempalte = _.template('A minimum amount of RM<%= val %> is required for APL repayment.');

    ModalService.showModal(scope, {
      title: 'Reminder',
      template: tempalte({
        val: val,
      }),
    });
  }

  function loanModal(scope, val) {
    var tempalte = _.template('A minimum of RM<%= val %> is required for Loan Repayment.');
    ModalService.showModal(scope, {
      title: 'Reminder',
      template: tempalte({
        val: val,
      }),
    });
  }

  return {
    initPayment: function initPayment(data) {

      // calculate Total.
      _.forEach(data, function(item) {
        item.freq = _.parseInt(item.freq);
        item.apl = UtilityService.parseRoundFloat(item.apl);
        item.modalPremium = UtilityService.parseRoundFloat(item.modalPremium);
        item.loan = item.policyLoanWithInterest = UtilityService.parseRoundFloat(item.policyLoanWithInterest);
        item.apl = item.aplWithInterest = UtilityService.parseRoundFloat(item.aplWithInterest);
        item.totalPremiumAmount = UtilityService.parseRoundFloat(item.totalPremiumAmount);

        if (!item.actions) item.actions = {};
        item.advance = item.advance ? item.advance : 0;
        specialCases(item);
      });

      grandTotal(data);
      return _grandTotal;
    },

    step: function step(step) {
      if (!step) return _step;
      return _step = step;
    },

    updateSteps: function updateSteps(step) {
      $ionicScrollDelegate.scrollTop(true);
      _step = step;
    },

    calcTotal: function calcTotal(item, scope) {
      updateTotal(item);

      if (item.actions.aplSelected) {
        item.actions.total += UtilityService.parseRoundFloat(item.apl);
        aplLogic(item);
      }

      if (item.actions.loanSelected) {
        item.actions.total += UtilityService.parseRoundFloat(item.loan);
        loanLogic(item);
      }

      grandTotal(scope.paymentCard);
      return _grandTotal;
    },

    updateGrand: function updateGrand(data) {
      grandTotal(data);
      return _grandTotal;
    },

    showAplModal: function showAplModal(scope, val) {
      var min = val;
      if (val >= 100)
        min = 100;
      aplModal(scope, min);
    },

    showLoanModal: function showLoanModal(scope, val) {
      var min = val;
      if (val >= 100)
        min = 100;
      loanModal(scope, min);
    },

    showInfoModal: function showInfoModal(scope, policyStatus) {
      var template = 'Policy status is ' + policyStatus;

      ModalService.showModal(scope, {
        title: 'Policy Status',
        template: template,
        header: policyStatus,
      });
    },

    paymentInquiry: function paymentInquiry(params, policyToBeReturned, validateFun) {
      validateFun = validateFun || PolicyService.canDoPayment;
      return new Promise(function(resolve, reject) {
        if (params.policyObj) {
          if (_.isArray(params.policyObj)) {
            _.each(params.policyObj, function(item) {
              item.selected = true;
              item.actions = {
                selected: true,
              };
            })
            params.policyObj[0].actions.current = true;
          } else {
            params.policyObj.actions = {
              selected: true,
              current: true,
            };
          }
          return resolve({
            _ChangeCycleFlag: params.changeCycleFlag,
            topUpMode: params.policyObj.topUpMode,
            clientDetails: params.clientDetails,
            policies: _.flatten([params.policyObj]),
            stampDuty: params.stampDuty,
            step: 2,
            selectedPolicy: _.isArray(params.policyObj) ? params.policyObj[0] : params.policyObj,
            stepsBack: -3,
            submitObj: params.submitObj,
            exec_function: function(scope) {
              if (scope) scope.disableStep1Back = true;
              TransactionsService.hideBackButton();
            },
          });
        }

        return ResourcesService.paymentInquiry()
          .then(function(res) {
            $log.info(res.res);

            if (res && res.res && res.res.policyDetails) {
              // return res.res.policyDetails;
              var policies = [],
                selectedPolicy = null;

              _.each(res.res.policyDetails, function(item) {
                if (validateFun({
                    policyInfo: item
                  })) {
                  policies.push(item);
                  if (params.policyNo && item.policyNo === params.policyNo) {
                    item.actions = {
                      selected: true,
                    };
                    selectedPolicy = item;
                  }
                }
              });

              if (params.policyNo) {
                PolicyService.selectPolices(params.policyNo, policies);
                policies = _.sortBy(policies, ['masterPolicy']);
                policies.reverse();
              }

              // for payment page
              if (selectedPolicy && selectedPolicy.actions)
                selectedPolicy.actions.current = true;

              if (policies.length === 0) {
                throw 'No available policies for payment!';
                // $ionicHistory.goBack(-1);
              }

              policies = _.sortBy(policies, function(item) {
                return (item.actions && item.actions.selected);
              });

              if (policyToBeReturned) {
                var neededPolicies = [];
                var masterPolicy = _.find(policies, function(policy) {
                  return policy.policyNo === policyToBeReturned;
                })

                if (masterPolicy && masterPolicy.packagePolicyFlag === 'Y') {
                  masterPolicy = masterPolicy.masterPolicy;
                  neededPolicies = _.filter(policies, function(item) {
                    return item.masterPolicy === masterPolicy;
                  });
                } else {
                  neededPolicies.push(masterPolicy);
                }

                policies = neededPolicies;
              }

              return resolve({
                clientDetails: params.clientDetails,
                policies: policies,
                stampDuty: params.stampDuty,
                step: 1,
                selectedPolicy: selectedPolicy,
                exec_function: angular.noop,
              });
            } else {
              return reject(res.msg || 'Something went wrong, please try again later. Thanks.');
            }
          }, function(errMsg) {

            return reject(errMsg);
          });
      });

    },
  };

});