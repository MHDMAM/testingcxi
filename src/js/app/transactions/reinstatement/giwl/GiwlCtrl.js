angular.module('app.controllers')

.controller('GiwlCtrl', function($scope, $state, $log, TransactionsService, ModalService, ResourcesService, giwlInfo) {

  init();

  function init() {
    $scope.data = giwlInfo;

    $scope.viewData = _.cloneDeep(giwlInfo);
    $scope.viewData.nricTypes = getNricTypes();
    var nricArr = [];
  }

  function getNricTypes() {
    nricArr = [{
      id: 1,
      name: 'Old NRIC',
    }, {
      id: 2,
      name: 'New NRIC',
    }, ];
    return nricArr;
  }
  if($scope.data.clientDetails.idNo && $scope.data.clientDetails.idNo.length === 12){
    $scope.data.select_nricType = nricArr[1];
  }

  function getSubmissionObj() {
    var submitData = {
      info: {
        policyNo: $scope.data.policyInfo.policyNo,
        sourceSystem: $scope.data.policyInfo.lineOfBiz,
        companyCode: TransactionsService.companyCodeUpdate($scope.data.policyInfo.lineOfBiz),
        planName: $scope.data.policyInfo.planName,
        ownMobile: $scope.data.clientDetails.mobileNo,
        ownEmail: $scope.data.clientDetails.ownEmail,
      },
      transaction: {
        // TODO: add form fields
      },
    };

    return {
      submitData: submitData,
      submitFunc: ResourcesService.submission.submitGiwl,
    };
  }


  /** public methods **/

  $scope.updateState = function(step) {
    $scope.steps = TransactionsService.updateState(step);
  }

  $scope.viewAgreement = function() {
    ModalService.showModal($scope, {
      templateUrl: 'templates/modals/agreementReinstatementGIWL.html'
    })

  }

  $scope.viewTnc = function() {
    ModalService.showModal($scope, {
      templateUrl: 'templates/modals/tcReinstatementGIWL.html'
    })

  }

  $scope.gotoPayment = function() {
    // TODO: go to payment
    var paymentObj = {
      planName: $scope.data.policyInfo.planName,
      lineOfBiz: $scope.data.policyInfo.lineOfBiz,
      insuredName: $scope.data.policyInfo.insuredName,
      totalPremiumAmount: $scope.data.policyInfo.premiumAmount,
      gstAmount: $scope.data.policyInfo.gstAmount,
      freq: $scope.data.policyInfo.freq,
      premiumDueDate: $scope.data.policyInfo.premiumDueDate,
      policyNo: $scope.data.policyInfo.policyNo,
      policyStatus: $scope.data.policyInfo.policyStatus,
      policyStatusCode: $scope.data.policyInfo.policyStatusCode,

      reinstatementOutstandingAmount: $scope.data.policyInfo.reinstatementOutstandingAmount,
      reinstatementOutstandingGSTAmount: $scope.data.policyInfo.reinstatementOutstandingGSTAmount,
    };

    $state.go('payment', {
      policyObj: paymentObj,
      stampDuty: 0,
      submitObj: getSubmissionObj(),
    });
  }

});