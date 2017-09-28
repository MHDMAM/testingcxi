angular.module('app.controllers')

.controller('MedicalCardCtrl', function ($scope, MedicalCardService, TransactionsService,AppMeta, cardInfo) {

  $scope.steps = 1;
  $scope.otpSessionId = null;

  $scope.viewData = MedicalCardService.populatedData();
  $scope.viewData.selectedCandidates = [];
  $scope.viewData.success = true;
  // $scope.viewData.formattedPhoneNo = TransactionsService.maskPhoneNumber(cardInfo.policyOwnerInfo.mobileNo);

  $scope.data = cardInfo;
  
  //  START: selected item
  var selectedItem = _.find($scope.data.coveredMember, function (item) {
    return item.isSelected;
  });

  if (selectedItem) $scope.viewData.selectedCandidates.push(selectedItem);
  //  END: selected item

  $scope.onChange = function ($index) {
    _.debounce(function () {
      $scope.data.coveredMember[$index].isSelected = !$scope.data.coveredMember[$index].isSelected;
    }, 150);
  };

  $scope.updateState = function (step) {
    $scope.steps = TransactionsService.updateState(step);
    if ($scope.steps === 3){
      TransactionsService.hideBackButton();
    }
  };

  $scope.close = function () {
    TransactionsService.backAfterSubmition();
  };

  $scope.termsNconditions = function () {
    MedicalCardService.tcModal($scope);
  };

  $scope.cancel = function () {
    MedicalCardService.confirmationModal($scope);
  };

  $scope.dataForOTP = {
    transactionName: AppMeta.forms.MedicalReplacement.otpFormType,
    email: cardInfo.policyOwnerInfo.email,
    mobileNo: cardInfo.policyOwnerInfo.mobileNo,
    sessionId: $scope.otpSessionId,
    NRIC: cardInfo._Info.idNo,
    token: $scope.data.verificationCode
  }

  $scope.submit = function () {
    // $scope.steps = TransactionsService.updateState(4);
    // $scope.viewData.success = true;
    var obj = _.clone($scope.dataForOTP);
    obj.sessionId = $scope.otpSessionId;
    obj.token = $scope.data.verificationCode;
    var waterfullArr = [
      function (callback) {
       TransactionsService.verifyOTP(obj).then(function(res) {
          if (res != false) {
            callback(null);
          } else {
            callback(true);
          } 
       })
      },
      function(callback) {
        $scope.data.addressInfo.postcode = $scope.data.addressInfo.postCode;
         MedicalCardService.submit($scope.data, $scope.viewData, cardInfo)
          .then(function success() {
            callback(null);
          });
      }
    ]

    async.waterfall(waterfullArr, function(err, result) {
      if (!err) {
          $scope.steps = TransactionsService.updateState(4);
          $scope.viewData.success = true;
      }
    });
    
  };

  $scope.requestOTP = function requestOTP() {
    var obj = _.clone($scope.dataForOTP);

    TransactionsService.requestOTP(obj)
    .then(function success(res) {
      $scope.otpSessionId = res.res.sessionId;
    },function fail(res) {
      console.log(res);
    });
  }

  $scope.$watch('data.addressInfo.country', function (nv, ov) {
    if (!nv) return;
    $scope.viewData.countryObj = _.find($scope.viewData.countries, function (item) {
      return item.key === nv;
    });

    if ($scope.viewData.countryObj)
      $scope.data.countryMobileCode = $scope.data.countryHomeCode = $scope.data.countryOfficeCode = $scope.viewData.countryObj.callingCode;

  }, true);

});
