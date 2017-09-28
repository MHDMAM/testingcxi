angular.module('app.controllers')

.controller('MedicalExaminationCtrl', function($scope, $state, $ionicModal, ModalService, MedicalExaminationService, examInfo) {

  $scope.data = examInfo;
  $scope.data.pics = [];

  function getSubmissionObj(submitData) {
    return {
      submitData: submitData,
      submitFunc: null, // TODO: create a submission function
    };
  }

  $scope.scanDoc = function scanDoc() {
    MedicalExaminationService.scanDoc()
      .then(function(pic) {
        $scope.data.pics.push(pic);
      })
  };

  $scope.previewPic = function previewPic(index) {
    var thisPic = this.pic
      // Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
      $scope.previewPicModal.remove();
    });
    // Execute action on hide modal
    $scope.$on('modal.hidden', function() {
      console.log('hidden');

      // Execute action
    });
    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
      console.log('removed');
      // Execute action
    });

    $scope.closeModal = function() {
      $scope.previewPicModal.hide();
    };

    $scope.deletePic = function() {
      $scope.data.pics.splice(index, 1);
      $scope.previewPicModal.hide();
    };

    $ionicModal.fromTemplateUrl('templates/modals/previewMedicalExamPic.html', {
        scope: $scope,
        animation: 'slide-in-up'
      })
      .then(function(modal) {
        $scope.previewPicModal = modal;
        $scope.previewPicModal.show();
        $scope.previewPicModal.pic = thisPic;
      });
  };

  $scope.termsNconditions = function() {
    ModalService.showModal($scope, {
      templateUrl: 'templates/modals/tcReinstatementMedicalExam.html'
    })
  }

  // 2 be reviwed.
  $scope.payment = function() {
    // prepare the payment object
    var paymentObj = {
      planName: $scope.data.policyInfo.planName,
      lineOfBiz: $scope.data.policyInfo.lineOfBiz,
      policyStatus: $scope.data.policyInfo.policyStatus,
      insuredName: $scope.data.policyInfo.insuredName,
      totalPremiumAmount: $scope.data.policyInfo.premiumAmount,
      topUpAmount: $scope.data.premiumVal,
      gstAmount: $scope.data.policyInfo.gstAmount,
      freq: $scope.data.policyInfo.freq,
      premiumDueDate: $scope.data.policyInfo.premiumDueDate,
      policyNo: $scope.data.policyInfo.policyNo,
      policyStatusCode: $scope.data.policyInfo.policyStatusCode,
    };
    
    $state.go('payment', {
      policyObj: paymentObj,
      stampDuty: 0,
      submitObj: getSubmissionObj,
    });

  };

});