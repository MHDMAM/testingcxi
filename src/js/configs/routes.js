angular.module('app')
  .config(function ($stateProvider, $urlRouterProvider) {

    function routeError(errMsg, NotificationService, $ionicLoading) {
      if ($ionicLoading)
        $ionicLoading.hide();
      console.error(errMsg);

      NotificationService.alert({
        title: 'Error',
        template: errMsg,
      });

      // throw exception to prevent navigation
      throw errMsg;
    }

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider
      .state('maintenancePage', {
        'url': '/maintenancePage',
        templateUrl: 'templates/maintenancePage.html',
        controller: 'maintenanceCtrl',
        params: {
          message: ''
        },
        resolve: {
          message: function ($stateParams) {
            return $stateParams.message;
          }
        }
      })

      .state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'LoginCtrl',
      })

      .state('resetPassword', {
        cache: false,
        url: '/resetPassword',
        templateUrl: 'templates/resetPassword.html',
        // templateUrl: 'templates/shared/side-menu.html',
        controller: 'ResetPasswordCtrl',
        resolve: {

          translatedVals: function ($translate, UserService) {
            var titleKey = 'reset_password.reset_password_title',
              verifyUserKey = 'reset_password.verify_user',
              setPassword = 'reset_password.set_pass';
            if (UserService.activation())
              titleKey = 'reset_password.activation_title';

            return $translate([titleKey, verifyUserKey, setPassword]).then(function (trans) {
              return {
                title: trans[titleKey],
                verify: trans[verifyUserKey],
                password: trans[setPassword],
              };
            }, function (translationId) {

              return translationId;
            });
          },
        },
      })

      .state('transactionHistory', {
        url: '/transactionHistory',
        templateUrl: 'templates/shared/side-menu.html',
        controller: 'TransactionHistoryCtrl',
        resolve: {
          contentTemplate: function () {
            return 'templates/transactionHistory.html';
          },
        },
      })

      .state('setPassword', {
        url: '/setPassword',
        templateUrl: 'templates/setPassword.html',
        controller: 'SetPasswordCtrl',
        resolve: {
          translatedVals: function ($translate, UserService) {
            var titleKey = 'reset_password.reset_password_title',
              verifyUserKey = 'reset_password.verify_user',
              setPassword = 'reset_password.set_pass';
            if (UserService.activation())
              titleKey = 'reset_password.activation_title';

            return $translate([titleKey, verifyUserKey, setPassword]).then(function (trans) {
              return {
                title: trans[titleKey],
                verify: trans[verifyUserKey],
                password: trans[setPassword],
              };
            }, function (translationId) {

              return translationId;
            });
          },
        },
      })

      .state('search', {
        url: '/policySerach',
        cache: false,
        templateUrl: 'templates/policySerach.html',
        // templateUrl: 'templates/shared/side-menu.html',
        controller: 'PolicySerachCtrl',
        // resolve: {
        //   contentTemplate: function() {
        //     return 'templates/policySerach.html';
        //   },
        // },
      })

      .state('policyDashboard', {
        url: '/policySerach/policyDashboard',
        templateUrl: 'templates/policyDashboard.html',
        controller: 'PolicyDashboardCtrl',
        cache: false,
        params: {
          userInfo: {},
        },
        resolve: {
          dashInfo: function (PolicyService, $ionicLoading, $stateParams, NotificationService, ChangeAddressService) {
            $ionicLoading.show({
              template: 'Please Wait...',
            });

            return PolicyService.getPolicyDashboard($stateParams.userInfo)
              .then(function (data) {
                $ionicLoading.hide();
                ChangeAddressService.initWforms(data.policyRecord.receivedW8Form, data.policyRecord.receivedW9Form);
                return data;
              }, function err(errMsg) {

                routeError(errMsg, NotificationService, $ionicLoading);
              });
          },
        },
      })

      .state('policyDetails', {
        url: '/policySerach/policyDashboard/details',
        templateUrl: 'templates/policyDetails.html',
        controller: 'PolicyDetailsCtrl',
        params: {
          policyNo: null,
          originalPolicies: [],
        },
        resolve: {
          detailsInfo: function (PolicyService, $stateParams, NotificationService, DirectCreditService, $ionicLoading, $log, UserService) {
            $ionicLoading.show({
              template: 'Please Wait...',
            });

            // need to call direct credit detail to get reimbursement account info
            var returnData = {
              policyDetails: {},
              directCreditDetail: {},
            }
            var tasks = [
              function getPolicyDetails(callback) {
                PolicyService.getPolicyDetails($stateParams.policyNo)
                  .then(function (data) {
                    $ionicLoading.hide();

                    data.originalPolicies = $stateParams.originalPolicies;
                    returnData.policyDetails = data;
                    UserService.setReceiptInfo(data.clientDetails);
                    if (data.myLifePlanner && data.myLifePlanner.length > 0)
                      UserService.setReceiptInfo(data.myLifePlanner[0]);

                    // change freq 00 to 01
                    if (data.policyInfo.freq === '00')
                      data.policyInfo.freq = '01';

                    return callback(null);
                  }, function (errMsg) {
                    callback(errMsg);
                  });
              },
              function getDirectCreditDetail(callback) {
                DirectCreditService.directCreditDetail($stateParams.policyNo)
                  .then(function (data) {
                    returnData.directCreditDetail = data;
                    callback(null);
                  }, function (errMsg) {
                    callback(null);
                  })
              }
            ];

            return new Promise(function (resolve, reject) {
              async.parallel(tasks, function (err, results) {
                if (!results || err) {
                  reject();
                  return routeError(err, NotificationService, $ionicLoading);
                }
                $ionicLoading.hide();
                returnData.policyDetails.directCreditAcctInfo = returnData.directCreditDetail;
                $log.info(returnData.policyDetails);

                return resolve(returnData.policyDetails);
              });

            });
          },
        },
      })

      .state('medicalCard', {
        url: '/transactions/medicalCard',
        templateUrl: 'templates/transactions/medicalCard/medicalCardReplacement.html',
        controller: 'MedicalCardCtrl',
        params: {
          policyNo: null,
          userInfo: {},
          policyInfo: null,
        },
        resolve: {
          cardInfo: function (ResourcesService, $stateParams, NotificationService, $state, $ionicHistory, $ionicLoading) {
            $ionicLoading.show({
              template: 'Please Wait...',
            });

            // console.log($stateParams);
            return ResourcesService.getMedicalCardInfo($stateParams.policyNo)
              .then(function (data) {
                $ionicLoading.hide();
                var index = _.findIndex(data.res.coveredMember, function (item) {
                  return item.name === data.res.policyOwnerInfo.name;
                });

                if (index >= 0)
                  data.res.coveredMember[index].isSelected = true;
                console.log(data.res);

                if ($stateParams.policyInfo.lineOfBiz === 'LA' || $stateParams.policyInfo.lineOfBiz === 'LAFT') {
                  data.res.coveredMember = _.filter(data.res.coveredMember, function (item) {
                    return item.role === 'CM';
                  });
                }

                data.res._Info = $stateParams.userInfo;
                return data.res;
              }, function (errMsg) {

                routeError(errMsg, NotificationService, $ionicLoading);
              });
          },
        },
      })

      .state('payment', {
        url: '/transactions/payment',
        templateUrl: 'templates/transactions/payment/payment.html',
        controller: 'PaymentCtrl',
        cache: false,
        params: {
          policyObj: null, // to pay for topup (maybe others later).
          policyNo: null, // select the source policy.
          customerID: null,
          stampDuty: 0,
          submitObj: null,
          clientDetails: {},
          changeCycleFlag: false,
        },
        resolve: {
          detailsInfo: function (PaymentService, $stateParams, NotificationService, $log, $ionicLoading) {
            $ionicLoading.show({
              template: 'Please Wait...',
            });

            return PaymentService.paymentInquiry($stateParams)
              .then(function success(data) {
                $ionicLoading.hide();
                return data;
              }, function error(errMsg) {

                return routeError(errMsg, NotificationService, $ionicLoading);
              });
          },
        },
      })

      .state('creditCard', {
        url: '/transactions/creditCard',
        templateUrl: 'templates/transactions/creditCard/credit-card.html',
        controller: 'CreditCardCtrl',
        params: {
          creditCardInfo: null,
          policyNo: null, // select the source policy.
          userInfo: {},
        },
        resolve: {
          cardInfo: function (ResourcesService, $stateParams, PolicyService, NotificationService, $ionicLoading) {
            $ionicLoading.show({
              template: 'Please Wait...',
            });
            return ResourcesService.policySearch()
              .then(function (data) {
                $ionicLoading.hide();
                $stateParams.creditCardInfo.email = data.res.policyOwner.email;

                PolicyService.selectPolices($stateParams.policyNo, data.res.policyRecord.policyInfo);
                data.res.policyRecord.policyInfo = _.sortBy(data.res.policyRecord.policyInfo, ['masterPolicy']);
                data.res.policyRecord.policyInfo.reverse();

                data.res.policyRecord.policyInfo = _.filter(data.res.policyRecord.policyInfo, function (item) {
                  return PolicyService.creditCard({
                    policyInfo: item
                  })
                });

                return {
                  creditCardInfo: $stateParams.creditCardInfo,
                  policyInfo: data.res.policyRecord.policyInfo,
                  _Info: $stateParams.userInfo,
                  policyNo: $stateParams.policyNo,
                };
              }, function (errMsg) {

                routeError(errMsg, NotificationService, $ionicLoading);
              });
          },
        },
      })

      .state('changeAddress', {
        url: '/transactions/changeAddress',
        templateUrl: 'templates/transactions/changeAddress/changeAddress.html',
        controller: 'ChangeAddressCtrl',
        params: {
          policyNo: null,
          policyInfo: {},
          userInfo: {},
          addressInfo: {},
        },
        resolve: {
          addressInfo: function (ResourcesService, $stateParams, PolicyService, NotificationService, UserService, $ionicLoading, $ionicHistory, $state) {
            $ionicLoading.show({
              template: 'Please Wait...',
            });
            // var _crsData = null;
            // get contact details & policy info
            var parallelArr = [
              // get contact details
              function getContactDetails(callback) {
                ResourcesService.getMedicalCardInfo($stateParams.policyNo)
                  .then(function (data) {
                    var index = _.findIndex(data.res.coveredMember, function (item) {
                      return item.name === data.res.policyOwnerInfo.name;
                    });

                    if (index >= 0)
                      data.res.coveredMember[index].isSelected = true;
                    data.res._Info = $stateParams.userInfo;

                    callback(null, data);

                  }, function (errMsg) {

                    callback(errMsg);
                  });
              },

              function getPolicyInfo(callback) {
                // get policy info
                ResourcesService.policySearch()
                  .then(function (policyData) {
                    $stateParams.addressInfo.ownEmail = policyData.res.policyOwner.email;

                    // filter data:
                    policyData.res.policyRecord.policyInfo = _.filter(policyData.res.policyRecord.policyInfo, function (item) {
                      return PolicyService.canCOA({
                        policyInfo: item
                      })
                    });
                    callback(null, policyData);

                  }, function (errMsg) {

                    callback(errMsg);
                  });
              },
            ];

            return new Promise(function (resolve, reject) {
              // TODO: uncomment this after FATCA complete
              async.parallel(parallelArr, function (err, results) {
                $ionicLoading.hide();
                if (!results || err) {
                  reject();
                  return routeError(err, NotificationService, $ionicLoading);
                }

                // successful response
                var contactDetailRes = results[0].res;
                var policyInfoRes = results[1].res;

                var policies = policyInfoRes.policyRecord.policyInfo;
                PolicyService.selectPolices($stateParams.policyNo, policies);
                policies = _.sortBy(policies, ['masterPolicy']);
                policies.reverse();

                var finalData = {
                  addressInfo: contactDetailRes.addressInfo,
                  policyInfo: policies,
                  policyOwnerInfo: contactDetailRes.policyOwnerInfo,
                  _Info: $stateParams.userInfo,
                  selectedPolicy: $stateParams.policyInfo
                };

                return resolve(finalData);
              });

            });
          },
        },
      })

      .state('fundSwitching', {
        url: '/transactions/fundSwitching',
        templateUrl: 'templates/transactions/fundSwitching/fundSwitching.html',
        controller: 'FundSwitchingCtrl',
        params: {
          investmentPortfolio: [],
          policyInfo: {},
          userInfo: null,
        },
        resolve: {
          fsInfo: function (ResourcesService, $stateParams, NotificationService, $ionicLoading, $ionicHistory, $state) {
            $ionicLoading.show({
              template: 'Please Wait...',
            });

            var data = {
              investmentPortfolio: $stateParams.investmentPortfolio,
              policyInfo: $stateParams.policyInfo,
              userInfo: $stateParams.userInfo,
            };

            // call web service to get switch-to funds
            return ResourcesService.getFundSwitchingDetail(data.policyInfo.policyNo, data.policyInfo.lineOfBiz)
              .then(function (res) {
                $ionicLoading.hide();
                data.toFunds = res.res.fundDetails;

                return data;
              }, function (errMsg) {

                routeError(errMsg, NotificationService, $ionicLoading);
              });
          },
        },
      })

      .state('cancelAutoDebit', {
        url: '/transactions/cancelAutoDebit',
        templateUrl: 'templates/transactions/cancelAutoDebit/cancelAutoDebit.html',
        controller: 'CancelAutoDebitCtrl',
        params: {
          policyNo: null,
          userInfo: {},
          paymentInfo: {},
        },
        resolve: {
          paymentInfo: function (ResourcesService, PolicyService, $stateParams, NotificationService, $ionicLoading, $log) {
            $ionicLoading.show({
              template: 'Please Wait...',
            });

            return ResourcesService.policySearch()
              .then(function (data) {
                $ionicLoading.hide();

                var policies = data.res.policyRecord.policyInfo;
                policies = _.filter(policies, function (item) {
                  var tmp = {
                    policyInfo: item,
                  };
                  tmp.policyInfo.paymentMethodCode = item.paymentMethod;
                  if (PolicyService.canPrefourmCancelAutoDebit(tmp))
                    return item;
                });

                _.remove(policies, function (item) {
                  return item.freq === 12;
                });
                PolicyService.selectPolices($stateParams.policyNo, policies);
                policies = _.sortBy(policies, ['masterPolicy']);
                policies.reverse();

                if (!policies.length)
                  return routeError('No item found', NotificationService, $ionicLoading);

                return {
                  policyInfo: policies,
                  paymentInfo: $stateParams.paymentInfo,
                  _Info: $stateParams.userInfo,
                };
              }, function (errMsg) {

                $log.error(errMsg);
                routeError(errMsg, NotificationService, $ionicLoading);
              });
          },
        },
      })

      .state('changePaymentCycle', {
        url: '/transactions/changePaymentCycle',
        templateUrl: 'templates/transactions/changePaymentCycle/changePaymentCycle.html',
        controller: 'ChangePaymentCycleCtrl',
        params: {
          policyNo: null,
          userInfo: {},
          policyInfo: null,
          productType: null,
        },
        resolve: {
          paymentInfo: function (ResourcesService, $stateParams, NotificationService, $ionicLoading, PaymentService, PolicyService, $log) {
            $ionicLoading.show({
              template: 'Please Wait...',
            });

            return PaymentService.paymentInquiry({
              customerID: $stateParams.userInfo.idNo,
            }, $stateParams.policyNo, PolicyService.canDoChangePayment)
              .then(function (payment) {
                $ionicLoading.hide();
                // var data = $stateParams.policyInfo;
                var mainPolicyInfo = _.find(payment.policies, function (item) {
                  return item.policyNo == $stateParams.policyNo;
                });
                if (!mainPolicyInfo) mainPolicyInfo = payment.policies[0];

                mainPolicyInfo = _.pick(mainPolicyInfo, ['planName', 'insuredName', 'policyNo', 'freqDesc', 'totalPremiumAmount', 'gstAmount', 'lineOfBiz',
                  'freq', 'semiAnnualPremWithGST', 'monthlyPremWithGST', 'quarterlyPremWithGST', 'annualPremWithGST', 'packagePolicyFlag',
                ]);
                mainPolicyInfo.productType = $stateParams.productType;
                mainPolicyInfo.premiumDueDateToCompier = $stateParams.policyInfo.premiumDueDate;
                return {
                  clientDetails: $stateParams.userInfo,
                  policies: payment.policies,
                  mainPolicyInfo: mainPolicyInfo,
                };
              }, function (errMsg) {

                routeError(errMsg, NotificationService, $ionicLoading);
              });
          },
        },
      })

      .state('topUp', {
        url: '/transactions/topUp',
        templateUrl: 'templates/transactions/topUp/topUp.html',
        controller: 'TopUpCtrl',
        params: {
          investmentPortfolio: [],
          policyInfo: {},
          userInfo: {},
          myLifePlanner: []
        },
        resolve: {
          topupInfo: function ($stateParams, ResourcesService, NotificationService, $ionicLoading) {
            $ionicLoading.show({
              template: 'Please Wait...',
            });
            var topUpDetails = {
              productType: $stateParams.policyInfo.productType,
              lineOfBiz: $stateParams.policyInfo.lineOfBiz,
            };
            var returnData = {
              investmentPortfolio: $stateParams.investmentPortfolio,
              policyInfo: $stateParams.policyInfo,
              clientDetails: $stateParams.userInfo,
              topupDetail: {},
              scheduleDetail: {},
            };

            returnData.policyInfo._agentId = ($stateParams.myLifePlanner && $stateParams.myLifePlanner.length > 0) ? $stateParams.myLifePlanner[0].agentId : '';
            returnData.policyInfo._agentName = ($stateParams.myLifePlanner && $stateParams.myLifePlanner.length > 0) ? $stateParams.myLifePlanner[0].name : '';

            var parallelArray = [
              function loadFunds(callback) {
                ResourcesService.getFundSwitchingDetail(returnData.policyInfo.policyNo, returnData.policyInfo.lineOfBiz)
                  .then(function (res) {
                    returnData.fundDetails = res.res.fundDetails;
                    callback(null);

                  }, function (errMsg) {

                    callback(errMsg);
                  });
              },
              function getAdHocDetails(callback) {
                ResourcesService.getTopUpDetails(topUpDetails)
                  .then(function (res) {
                    returnData.topupDetail = res.res;
                    callback(null);
                  }, function (errMsg) {
                    // callback(errMsg);
                    // optional
                    callback(null);
                  });
              },
              function getScheduleDetails(callback) {
                ResourcesService.getScheduleTopUpDetails($stateParams.policyInfo.planCode, $stateParams.policyInfo.freq)
                  .then(function (res) {
                    returnData.scheduleDetail = res.res;
                    callback(null);
                  }, function (errMsg) {
                    // callback(errMsg);
                    // optional
                    callback(null);
                  });
              },
            ];
            return new Promise(function (resolve, reject) {

              async.parallel(parallelArray, function callbackFn(err, result) {
                $ionicLoading.hide();
                if (err)
                  return routeError(err, NotificationService, $ionicLoading);

                return resolve(returnData);
              });
            });
          },
        },
      })

      .state('giwl', {
        url: '/transactions/reinstatement/giwl',
        templateUrl: 'templates/transactions/reinstatement/giwl/giwl.html',
        controller: 'GiwlCtrl',
        params: {
          userInfo: {},
          policyInfo: null,
        },
        resolve: {
          giwlInfo: function (ResourcesService, $stateParams, NotificationService, $ionicLoading, PaymentService, $log) {
            $ionicLoading.show({
              template: 'Please Wait...',
            });

            var data = {
              policyInfo: $stateParams.policyInfo,
              clientDetails: $stateParams.userInfo,
            };

            $log.info(data);

            // TODO
            return new Promise(function (resolve, reject) {
              $ionicLoading.hide();
              return resolve(data);
            });
          },
        },
      })

      .state('directCredit', {
        url: '/transactions/directCredit',
        templateUrl: 'templates/transactions/directCredit/directCredit.html',
        controller: 'DirectCreditCtrl',
        params: {
          policyNo: null,
          policyInfo: null,
          userInfo: {},
          originalPolicies: [],
          directCreditAcctInfo: null,
        },
        resolve: {
          dcInfo: function (ResourcesService, DirectCreditService, $stateParams, NotificationService, $ionicLoading, $log) {
            $ionicLoading.show({
              template: 'Please Wait...',
            });
            var returnData = {
              userInfo: $stateParams.userInfo,
              policyInfo: DirectCreditService.filterPolicies($stateParams.originalPolicies, $stateParams.policyNo),
              bankCodes: {},
              policyDetails: $stateParams.policyInfo,
              // directCreditAcctInfo: $stateParams.directCreditAcctInfo,
            };

            var parallelArray = [
              function banksInquiry(callback) {
                DirectCreditService.banksInquiry()
                  .then(function success(banks) {
                    returnData.bankCodes = banks;
                    callback(null);
                  }, function error(errMsg) {
                    callback(errMsg);
                  });
              },

              function directCreditDetail(callback) {
                DirectCreditService.directCreditDetail($stateParams.policyNo)
                  .then(function success(accountInfo) {
                    returnData.DirectCreditDetail = accountInfo;
                    callback(null);
                  }, function failed(err) {
                    callback(null);
                  })
              },
            ];

            return new Promise(function (resolve, reject) {
              async.parallel(parallelArray, function callbackFn(err, result) {
                $ionicLoading.hide();
                if (err) {
                  routeError(err, NotificationService, $ionicLoading);
                  return reject(err);
                }
                return resolve(returnData);

              });

            });
          },
        },
      })

      .state('MedicalExamination', {
        url: '/transactions/MedicalExamination',
        templateUrl: 'templates/transactions/reinstatement/MedicalExamination/MedicalExamination.html',
        controller: 'MedicalExaminationCtrl',
        params: {
          userInfo: {},
          policyInfo: null,
        },
        resolve: {
          examInfo: function (ResourcesService, $stateParams, $ionicLoading, $log) {
            $ionicLoading.show({
              template: 'Please Wait...',
            });

            var data = {
              policyInfo: $stateParams.policyInfo,
              clientDetails: $stateParams.userInfo,
            };

            return new Promise(function (resolve, reject) {
              $ionicLoading.hide();
              return resolve(data);
            });
          },
        },
      });



    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login');
  });