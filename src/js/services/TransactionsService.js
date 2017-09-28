angular.module('app.services')

  .factory('TransactionsService', function ($ionicScrollDelegate, $ionicHistory, $ionicLoading, $ionicNavBarDelegate, NotificationService, PopulatedVluesService, ResourcesService, TemplateService, UserService) {

    function companyCodeUpdate(lineOfBiz) {
      return lineOfBiz && lineOfBiz.toUpperCase() === 'LAFT' ? '072' : '016';
    }

    function submitCOA(policies, data, isSelected, callback) {
      var policies = _.map(policies, function (item) {
        return {
          policyNo: item.policyNo,
          insuredName: item.insuredName,
          companyCode: companyCodeUpdate(item.lineOfBiz),
          sourceSystem: item.lineOfBiz,
          documentUpload: item.documentUpload,
        };
      });

      var infoPolicies = _.map(policies, function (item) {
        return item.policyNo;
      });

      var submitData = {
        info: {
          policyNo: infoPolicies.join(', <br>'),
          sourceSystem: data._Info.lineOfBiz,
          planName: data._Info.planName,
          ownNric: data._Info.idNo,
          ownMobile: data._Info.mobileNo,
          ownEmail: data._Info.email,
          ownName: data._Info.policyOwnerName,
        },
        transaction: {
          policies: policies,
          allPolaSelected: data.allPolaSelected,
          fatca: {
            receivedW8Form: data.receivedW8Form,
            receivedW9Form: data.receivedW9Form,
          },
        },
      };

      if (isSelected) {
        // send all
        delete data.addressInfo.postCode;
        _.assign(submitData.transaction, data.addressInfo);
        _.assign(submitData.transaction, data.policyOwnerInfo);
      }
      // send only the email and mobile no.
      var _newMobile = data.policyOwnerInfo.newMobile.toString().replace(/\D/g, '');
      // _newMobile = (_newMobile.substr(0, 1) == 1) ? '0' + _newMobile : _newMobile;

      _.assign(submitData.transaction, {
        newMobile: _newMobile,
        newEmail: data.policyOwnerInfo.newEmail,
        country: data.addressInfo.country,
      });
      _.assign(submitData.transaction, data.crsInfo);
      _.assign(submitData.transaction.fatca, data.fatca);
      if (!data.fatca)
        submitData.transaction.fatca = {};

      delete submitData.transaction.policyNo;
      // delete submitData.info.policyNo;

      // submit to server
      return ResourcesService.submission.submitCOA(submitData, isSelected)
        .then(function (res) {
          // success
          callback(null, res);
        }, function error(errMsg) {
          // failed
          callback(errMsg);
        });
    }

    function getSubmitChangePaymentCycleDataObj(_data, _viewData) {

      var infoPolicies = _.map(_data.policies, function (item) {
        return item.policyNo;
      });

      var policies = _.map(_data.policies, function (policy) {
        return {
          policyNo: policy.policyNo,
          gapPaymentAmount: (policy.gap && policy.gap.advance) ? policy.gap.advance : '0.00',
          planName: policy.planName,
        };
      });

      var submitData = {
        info: {
          policies: policies,
          policyNo: infoPolicies,
          sourceSystem: _data.mainPolicyInfo.lineOfBiz,
          companyCode: companyCodeUpdate(_data.mainPolicyInfo.lineOfBiz),
          planName: _data.mainPolicyInfo.planName,
          ownName: _data.clientDetails.policyOwnerName,
          ownMobile: _data.clientDetails.mobileNo,
          ownEmail: _data.clientDetails.ownEmail,
          ownNric: _data.clientDetails.idNo,
        },
        transaction: {
          oldPaymentMode: _data.mainPolicyInfo.freq,
          newPaymentMode: _viewData.selectedFreq,
        },
      };
      return submitData;
    }

    return {
      splitDataForSlider: function splitDataForSlider(args, divider) {
        var splitted = [];
        var divider = divider || 4;
        var target = args;
        if (!target) {
          return target;
        }

        for (var i = 0; i < target.length; i += divider) {
          splitted.push(target.slice(i, i + divider));
        }

        return splitted;
      },

      updateState: function updateState(next) {
        $ionicScrollDelegate.scrollTop(true);
        return next;
      },

      backAfterSubmition: function backAfterSubmition(steps) {
        steps = steps || -2;
        $ionicNavBarDelegate.showBackButton(true);
        return $ionicHistory.goBack(steps);
      },

      hideBackButton: function hideBackButton() {
        $ionicNavBarDelegate.showBackButton(false);
      },

      goback: function goback() {
        return $ionicHistory.goBack();
      },

      companyCodeUpdate: companyCodeUpdate,

      populate: {
        // change of address
        changeOfAddress: function changeOfAddress() {
          return {
            states: PopulatedVluesService.getStates(),
            countries: PopulatedVluesService.getCountries(),
            crscountries: PopulatedVluesService.getCRSCountries(),
          };
        },

        getUSstates: function getUSstates() {
          return PopulatedVluesService.getUSstates();
        },
      },
      submission: {
        submitChangeOfAddress: function submitChangeOfAddress(_data, _viewData) {
          _viewData.nonSelectedPolicies = _.differenceBy(_data.policyInfo, _viewData.selectedPolicies, 'policyNo');

          // get POLA-all-selected flag
          var length1 = _.filter(_data.policyInfo, function (item) {
            return item.lineOfBiz === 'PA';
          }).length;
          var length2 = _.filter(_viewData.selectedPolicies, function (item) {
            return item.lineOfBiz === 'PA';
          }).length;
          _data.allPolaSelected = (length1 == length2) && length1 > 0;

          $ionicLoading.show({
            template: 'Please Wait...',
          });

          var _data2 = _.cloneDeep(_data);

          if (_data.crsInfo) {
            delete _data2.crsInfo.entityType;
            delete _data2.crsInfo.crsInd;
          }
          
          var tasks = [
            _.bind(submitCOA, null, _.uniqBy(_viewData.selectedPolicies, 'policyNo'), _data, true),
            _.bind(submitCOA, null, _.uniqBy(_viewData.nonSelectedPolicies, 'policyNo'), _data2, false),
          ];

          return new Promise(function (resolve, reject) {
            async.series(tasks, function (err, results) {
              $ionicLoading.hide();

              // failed
              if (!results || err) {
                console.error(err);
                $ionicLoading.hide();

                NotificationService.alert({
                  title: 'Error',
                  template: err,
                });

                return reject(false);
              }

              // success
              $ionicScrollDelegate.scrollTop(true);
              return resolve(true);
            });
          });

        },

        submitChangePaymentCycle: function submitChangePaymentCycle(_data, _viewData, returnObj) {
          var submitData = getSubmitChangePaymentCycleDataObj(_data, _viewData);

          if (returnObj) {
            return {
              submitData: submitData,
              submitFunc: ResourcesService.submission.submitChangePaymentCycle,
            };
          }

          $ionicLoading.show({
            template: 'Please Wait...',
          });

          // submit to server
          return ResourcesService.submission.submitChangePaymentCycle(submitData)
            .then(function (res) {
              // success
              $ionicLoading.hide();
              $ionicScrollDelegate.scrollTop(true);
              return true;
            }, function error(errMsg) {
              // failed
              console.error(errMsg);
              $ionicLoading.hide();

              NotificationService.alert({
                title: 'Error',
                template: errMsg,
              });

              return false;
            });

        },

        submitPaymentReceipt: function submitPaymentReceipt(submitData) {
          $ionicLoading.show({
            template: 'Please Wait...',
          });

          // submit to server
          return new Promise(function (resolve, reject) {
            ResourcesService.submission.submitPaymentReceipt(submitData)
              .then(function (res) {
                // success
                $ionicLoading.hide();
                $ionicScrollDelegate.scrollTop(true);
                return resolve({
                  res: res.res.res.receipts,
                  smsPayload: res.smsPayload,
                });
              }, function error(errMsg) {
                // failed
                console.error(errMsg);
                $ionicLoading.hide();

                NotificationService.alert({
                  title: 'Error',
                  template: errMsg,
                });
              });
          });
        },

        emailAttachment: function emailAttachment(policy) {
          var info = UserService.getReceiptInfo();
          var user = UserService.user.user();
          var userLANId = UserService.user.userId();
          var ownerName = UserService.customer().name;
          var __staff = UserService.staff.get();

          var now = moment();
          var topup_loan = 0;
          if (policy._topup != 0)
            topup_loan += _.toNumber(policy._topup);
          if (policy.policyLoanWithInterest != 0)
            topup_loan += _.toNumber(policy.policyLoanWithInterest);

          var CashierId = __staff.laCashierId;
          if (policy.lineOfBiz && policy.lineOfBiz.toUpperCase() === 'PA')
            CashierId = __staff.polaCashierId;
          else if (policy.lineOfBiz && policy.lineOfBiz.toUpperCase() === 'LAFT')
            CashierId = __staff.laftCashierId;

          return TemplateService.email.receiptTemplate({
            receiptNo: policy.receiptNo,
            date: now.format('DD/MM/YYYY'),
            time: now.format('HH:mm:ss'),
            policyNo: policy.policyNo,
            modalPremiumNoGST: (policy.topup_mode_flag === 1) ? '0.00' : _.toNumber(policy.modalPremium).toFixed(2),
            stampDuty: _.toNumber(policy.stampDuty).toFixed(2),
            gst: _.toNumber(policy.gstAmount || 0).toFixed(2),
            apl: _.toNumber(policy.aplWithInterest).toFixed(2),
            topup: _.toNumber(topup_loan).toFixed(2),
            total: _.toNumber(policy.total).toFixed(2),

            policyStatus: policy._policyStatus,
            premiumDueDate: moment(new Date(policy._premiumDueDate)).format('DD/MM/YYYY'),
            freqDesc: policy._freqDesc,

            ownerName: ownerName,
            address1: info.address1,
            address2: info.address2,
            address3: info.address3,
            address4: info.postcode + ' ' + info.state,

            username: policy._agentName, // agent
            branchName: user.branchName,
            userId: policy._agentId, // agent
            staffInfo: CashierId,

          }, policy.lineOfBiz);
        },
      },

      requestOTP: function (obj, coa) {
        $ionicLoading.show({
          template: 'Please Wait...',
        });

        return ResourcesService.requestOTP(obj, coa)
          .then(function success(res) {
            $ionicLoading.hide();
            return res;
          }, function fail(err) {

            $ionicLoading.hide();
            NotificationService.alert({
              title: 'Error',
              template: err,
            });
            return false;
          });
      },

      verifyOTP: function (obj, coa) {
        obj.token = obj.token.toString();
        return ResourcesService.verifyOTP(obj, coa)
          .then(function success(res) {
            return res;
          }, function fail(errMsg) {

            $ionicLoading.hide();
            NotificationService.alert({
              title: 'Error',
              template: errMsg || 'Incorrect Token.',
            });
            return false;
          });
      },

    };
  });
