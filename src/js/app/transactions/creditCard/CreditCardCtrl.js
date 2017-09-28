angular.module('app.controllers')

.controller('CreditCardCtrl', function($scope, $ionicScrollDelegate, $log, PopulatedVluesService, $ionicLoading, ResourcesService, NotificationService, cardInfo, AppMeta, TransactionsService, ModalService, PolicyService) {
  $scope.steps = 1;
  $scope.viewData = {
    banks: PopulatedVluesService.getIssuedBanks(),
    selectedPolicies: [],
    verificationCode: null,
  };

  $scope.data = cardInfo;
  _.each($scope.data.policyInfo, function(item) {
    if (item.selected)
      $scope.viewData.selectedPolicies.push(item);
  });

  $scope.termsNconditions = function() {
    ModalService.showModal($scope, {
      title: 'Terms and Conditions',
      templateUrl: 'templates/termsAndCondition.html',
    });
  };

  $scope.updateState = function(step) {
    $ionicScrollDelegate.scrollTop(true);
    $scope.steps = step;
  };

  $scope.updateSelections = function() {
    if (!this.item) // uncheck
      PolicyService.selectPolices(this.$parent.item.policyNo, $scope.viewData.selectedPolicies, false);
    else {
      PolicyService.selectPolices(this.$parent.item.policyNo, $scope.data.policyInfo, this.item);
      _.each($scope.data.policyInfo, function(item) {
        if (item.selected)
          $scope.viewData.selectedPolicies.push(item);
      });
    }
    $scope.viewData.selectedPolicies = _.uniqBy($scope.viewData.selectedPolicies, 'policyNo');
  }

  function getDataForCreditCardSubmission() {
    var policies = _.map($scope.viewData.selectedPolicies, function(item) {
      return {
        companyCode: item.lineOfBiz && item.lineOfBiz.toUpperCase() === 'LAFT' ? '072' : '016',
        sourceSystem: item.lineOfBiz,
        name: '',
        policyNo: item.policyNo,
        relationship: '',
      };
    });
    var infoPolicies = _.map(policies, function(item) {
      return item.policyNo
    });
    var submitData = {
      info: {
        policyNo: infoPolicies.join(', <br>'),
        cardholdernric: cardInfo._Info.idNo,
        sourceSystem: cardInfo._Info.lineOfBiz,
        ownMobile: cardInfo._Info.mobileNo,
        mobile: cardInfo._Info.mobileNo,
        ownEmail: cardInfo._Info.ownEmail,
        ownName: cardInfo._Info.policyOwnerName,
        email: cardInfo._Info.ownEmail,
        planName: cardInfo._Info.planName,
      },
      transaction: {
        issuedBank: '', //$scope.data.creditCardInfo.bankName,
        cardholdername: $scope.data.creditCardInfo.insuredName,
        cardNo: 'XX', //$scope.data.creditCardInfo.cardNo,
        cardExpDate: '',
        /* moment($scope.data.creditCardInfo.expiryDate).format('MMYYYY'),*/
        policies: policies,
      },
    };
    return submitData;
  }
  $scope.updateCreditCard = function() {
    var _data = getDataForCreditCardSubmission();

    $ionicLoading.show({
      template: 'Please Wait...',
    });

    ResourcesService.submission.submitCreditCard(_data)
      .then(function(response) {
        // response.res.merchantCode
        // TransactionsService.updateState(2);
        // $scope.steps = 2;
        // $scope.viewData.success = true;


        aiaPlugin.makePayment({
          amount: '1.00',
          name: cardInfo._Info.policyOwnerName,
          email: cardInfo._Info.ownEmail || 'N/A',
          phone: cardInfo._Info.mobileNo || 'N/A',
          refNo: response.res.transcactionId,
          description: AppMeta.iPayRef,
          remark: AppMeta.iPayRef,
          paymentId: '55',
          actionType: 'BT',
          xfield1: '',
        }, function success(res) {
          var banks = PopulatedVluesService.getIssuedBanks();
          var bankCode = _.find(banks, function(item) {
            return item.value === res.s_bankname
          });
          if (bankCode) bankCode = bankCode.key;
          else bankCode = '99';

          $scope.data.creditCardInfo.cardNo = res.ccNo;
          ResourcesService.submission.submitPostCreditCard({
              "transactionId": response.res.transcactionId,
              "ccNo": res.ccNo,
              "issuedBank": bankCode, //"23 -- iPay"
            })
            .then(function _success(res) {
              $ionicLoading.hide();
              $scope.viewData.success = true;
              ResourcesService.submission.creditCardSendSMS(_data);
              $scope.viewData.selectedPolicies2 = TransactionsService.splitDataForSlider($scope.viewData.selectedPolicies);
              $scope.steps = TransactionsService.updateState(2);
            }, function _failer(err) {
              $ionicLoading.hide();
              NotificationService.alert({
                title: 'Error',
                template: err,
              });
            })
        }, function failer(res) {
          $ionicLoading.hide();
          $scope.viewData.success = false;
          $log.log('bind failed', res);
          NotificationService.alert({
            title: 'Error',
            template: res.errDesc,
          });
        });
      }, function error(error) {
        $log.log(error);
        $ionicLoading.hide();

        $scope.viewData.success = false;

        NotificationService.alert({
          title: 'Error',
          template: error,
        });
      });

  };

  $scope.close = function() {
    TransactionsService.backAfterSubmition();
  };
});