angular.module('app.controllers')
  .controller('ChangeAddressCtrl', function ($scope, $log, $ionicModal, $ionicScrollDelegate, TransactionsService, ChangeAddressService, ModalService,
    AppMeta, $cordovaCamera, UserService, ResourcesService, PolicyService, $ionicSlideBoxDelegate, $ionicLoading, NotificationService, addressInfo) {
    $scope.notAcceptedChars = /[^\w '@\-&#./,]+/g;

    init();

    // this is fatca! remove this
    // ChangeAddressService.showCrsDeclarationModal($scope);

    function initCrs_Fatca() {
      $scope.pics = [];
      $scope.crs = {
        yes: {
          crsList: [],
        },
        no: {},
      };
      $scope.fatca = {
        w9: {},
        w8: {},
        newSubmitionDate: moment().format('MMM DD, YYYY'),
      };
    }

    function init() {
      $scope.steps = 1;
      $scope.viewData = TransactionsService.populate.changeOfAddress();
      $scope.viewData.selectedPolicies = [];
      $scope.viewData.success = false;
      $scope.otpSessionId = null;

      initCrs_Fatca();

      $scope.data = _.cloneDeep(addressInfo);
      $scope.data.policyOwnerInfo.newMobile = $scope.data.policyOwnerInfo.mobileNo.replace(/\D/g, '');
      $scope.data.policyOwnerInfo.homeNo = $scope.data.policyOwnerInfo.homeNo.replace(/\D/g, '');
      $scope.data.policyOwnerInfo.officeNo = $scope.data.policyOwnerInfo.officeNo.replace(/\D/g, '');
      // init dates

      var wFroms = ChangeAddressService.initWforms()
      $scope.data.receivedW8Form = wFroms.receivedW8Form;
      $scope.data.receivedW9Form = wFroms.receivedW9Form;

      _.each($scope.data.policyInfo, function (item) {
        if (item.selected)
          $scope.viewData.selectedPolicies.push(item);
      });

      $scope.viewData.selectedPolicies = _.uniqBy($scope.viewData.selectedPolicies, 'policyNo');
    }

    var _state = _.find($scope.viewData.states, function (item) {
      return item === $scope.data.addressInfo.state;
    });

    if (!_state) $scope.data.addressInfo.state = null;

    _.each($scope.data.policyInfo, function (item) {
      if (item.selected)
        $scope.viewData.selectedPolicies.push(item);
    });

    function updateContactNumber(val) {
      return val.replace(/(\D+)|(\s)/, '');
    }

    function getNewNumbers() {
      var newNumbers = {};
      $scope.viewData.otpViewNumber = newNumbers.newMobileNumber = $scope.data.countryMobileCode.callingCode + $scope.data.policyOwnerInfo.newMobile.replace(/^(0+)/g, '');

      if ($scope.data.policyOwnerInfo.homeNo.length > 0)
        newNumbers.homeNewNumber = ($scope.data.countryHomeCode ? $scope.data.countryHomeCode.callingCode : '') + $scope.data.policyOwnerInfo.homeNo.replace(/^(0+)/g, '');
      else newNumbers.homeNewNumber = $scope.data.policyOwnerInfo.homeNo;

      if ($scope.data.policyOwnerInfo.officeNo.length > 0)
        newNumbers.officeNewNumber = ($scope.data.countryOfficeCode ? $scope.data.countryOfficeCode.callingCode : '') + $scope.data.policyOwnerInfo.officeNo.replace(/^(0+)/g, '');
      else newNumbers.officeNewNumber = $scope.data.policyOwnerInfo.officeNo;

      // // Mobile No.
      // if ($scope.data.policyOwnerInfo.newMobile.indexOf($scope.data.countryMobileCode.callingCode.toString()) === 0)
      //   newNumbers.newMobileNumber = $scope.data.policyOwnerInfo.newMobile.replace(/^(0+)/g, '');
      // else newNumbers.newMobileNumber = $scope.data.countryMobileCode.callingCode + $scope.data.policyOwnerInfo.newMobile.replace(/^(0+)/g, '');

      // // Home No.
      // // if (addressInfo.policyOwnerInfo.homeNo !== $scope.data.policyOwnerInfo.homeNo)
      //   if ($scope.data.policyOwnerInfo.homeNo.length > 0 && $scope.data.policyOwnerInfo.homeNo.indexOf($scope.data.countryHomeCode.callingCode.toString()) === 0)
      //     newNumbers.homeNewNumber = $scope.data.policyOwnerInfo.homeNo.replace(/^(0+)/g, '');
      //   else newNumbers.homeNewNumber = $scope.data.countryHomeCode.callingCode + $scope.data.policyOwnerInfo.homeNo.replace(/^(0+)/g, '');
      // // else newNumbers.homeNewNumber = $scope.data.policyOwnerInfo.homeNo

      // // Office NO.
      // // if (addressInfo.policyOwnerInfo.officeNo !== $scope.data.policyOwnerInfo.officeNo)
      //   if ($scope.data.policyOwnerInfo.officeNo.length > 0 && $scope.data.policyOwnerInfo.officeNo.indexOf($scope.data.countryOfficeCode.callingCode.toString()) === 0)
      //     newNumbers.officeNewNumber = $scope.data.policyOwnerInfo.officeNo.replace(/^(0+)/g, '');
      //   else newNumbers.officeNewNumber = $scope.data.countryOfficeCode.callingCode + $scope.data.policyOwnerInfo.officeNo.replace(/^(0+)/g, '');
      // // else newNumbers.officeNewNumber = $scope.data.policyOwnerInfo.officeNo

      return newNumbers;
    }

    $scope.updateSelections = function () {
      if (!this.item) // un-check
        PolicyService.selectPolices(this.$parent.item.policyNo, $scope.viewData.selectedPolicies, this.item);
      else {
        var newArr = _.flatten($scope.data.policyInfo);
        PolicyService.selectPolices(this.$parent.item.policyNo, newArr, this.item);
        _.each($scope.data.policyInfo, function (item) {
          if (item.selected)
            $scope.viewData.selectedPolicies.push(item);
        });

        $scope.data.splitPolicyInfo = TransactionsService.splitDataForSlider($scope.data.policyInfo);
      }

      $scope.viewData.selectedPolicies = _.uniqBy($scope.viewData.selectedPolicies, 'policyNo');
      $ionicSlideBoxDelegate.update();
    };

    // manipulate data:
    if ($scope.data.policyOwnerInfo.mobileNo)
      $scope.data.policyOwnerInfo.mobileNo = updateContactNumber($scope.data.policyOwnerInfo.mobileNo);
    if ($scope.data.policyOwnerInfo.officeNo)
      $scope.data.policyOwnerInfo.officeNo = updateContactNumber($scope.data.policyOwnerInfo.officeNo);
    if ($scope.data.policyOwnerInfo.homeNo)
      $scope.data.policyOwnerInfo.homeNo = updateContactNumber($scope.data.policyOwnerInfo.homeNo);

    // special name for mobile no and email in submission json
    $scope.data.policyOwnerInfo.newMobile = $scope.data.policyOwnerInfo.mobileNo.replace(/\D/g, '');
    $scope.data.policyOwnerInfo.newEmail = $scope.data.policyOwnerInfo.email;

    $scope.data.splitPolicyInfo = TransactionsService.splitDataForSlider($scope.data.policyInfo);

    function askToClearCRS_FATCA(fn, cb) {
      $scope.crs_fatcaCheckModal = {};
      $scope.crs_fatcaCheckModal.cancel = function () {
        $scope.crs_fatcaCheckModal.modal.hide();
      };

      $scope.crs_fatcaCheckModal.yes = function () {
        $scope.crs_fatcaCheckModal.modal.hide();
        fn();
        cb();
      };

      $ionicModal.fromTemplateUrl('templates/modals/crs_fatcaClearCheck.html', {
        scope: $scope,
        animation: 'slide-in-up',
      })
        .then(function (modal) {
          $scope.crs_fatcaCheckModal.modal = modal;
          $scope.crs_fatcaCheckModal.modal.show();
        });
    }

    var beenEdit = false;
    $scope.updateState = function (step) {
      switch (step) {
        case 1:
          // if user at step 2 and going back to step 1:
          if ([2, 'crsYes', 'crsNo', 'w9'].indexOf($scope.steps) >= 0) {
            return askToClearCRS_FATCA(initCrs_Fatca, function () {
              $scope.steps = TransactionsService.updateState(step);
            });
          }
          // remove CRS/FATCA info:
          initCrs_Fatca();
          break;
        case 3:
          $scope.viewData.selectedPolicies2 = TransactionsService.splitDataForSlider(_.uniqBy($scope.viewData.selectedPolicies, 'policyNo'));
          break;
      }
      $scope.steps = TransactionsService.updateState(step);
    };

    $scope.updateState_edit = function (step) {
      beenEdit = true;
      $scope.steps = TransactionsService.updateState(step);
    };

    $scope.changeAddressTnC = function () {
      ModalService.showModal($scope, {
        templateUrl: 'templates/modals/tcUpdateContact.html',
      });
    };

    $scope.close = function () {
      TransactionsService.backAfterSubmition();
    };

    $scope.gotoFatca = function () {

      var nums = getNewNumbers();
      if (nums.newMobileNumber.length > 16 || nums.homeNewNumber.length > 16 || nums.officeNewNumber.length > 16)
        return NotificationService.alert({
          title: 'Error',
          template: 'Mobile Number, Home number, Office number should not be more than 16 digits including country calling code.',
        });

      // if (nums.showPopUp)
      //   NotificationService.confirm({
      //     title: 'Confirmation',
      //     template: 'Can you please confirm your Mobile Number: ' + nums.newMobileNumber
      //   }).then(function(correct) {
      //     if (correct)
      //       ChangeAddressService.checkFatca($scope);
      //   });
      // else
      ChangeAddressService.checkFatca($scope);
    };

    $scope.gotoCRS = function () {
      if (beenEdit) {
        beenEdit = false;
        $scope.updateState(2);
        return;
      }

      ChangeAddressService.showCrsDeclarationModal($scope);
    };

    $scope.dataForOTP = {
      transactionName: AppMeta.forms.COA.otpFormType,
      email: $scope.data.policyOwnerInfo.email,
      mobileNo: (AppMeta.appRefNo === 'CX' ? $scope.data.policyOwnerInfo.newMobile : ''),
      sessionId: $scope.otpSessionId,
      NRIC: $scope.data._Info.idNo,
      token: $scope.viewData.verificationCode,
    };

    function manipulateCrsTinList() {
      return _.map($scope.crs.yes.crsList, function (crsItem) {
        var selectedCountry = _.find($scope.viewData.countries, function (item) {
          return item.key === crsItem.country.key;
        });

        if (!selectedCountry) return {};
        return {
          taxResCountry: selectedCountry ? selectedCountry.key : '',
          taxIdNo: crsItem.tin || '',
          reasonCode: crsItem.tinreason || null,
          reasonDesc: crsItem.tin? null : crsItem.othersReason,
        };
      });

    }

    function getCrsNoReason(letter) {
      var txt = 'Is a student at an educational institution in the relevant jurisdiction and holds the appropriate visa (if applicable)';
      switch (letter) {
        case 'B':
          txt = 'Is a teacher, trainee, or intern at an educational institution in the relevant jurisdiction or a participant in an educational or cultural exchange visitor program, and holds the appropriate visa (if applicable)';
          break;

        case 'C':
          txt = 'Is a foreign individual assigned to a diplomatic post/position in a consulate or embassy in the relevant jurisdiction';
          break;

        case 'D':
          txt = 'Is a frontier worker/employee working in a truck or train travelling between jurisdictions';
          break;

        case 'E':
          txt = 'Is a spouse or unmarried child under the age of 21 years of one of the persons described above';
          break;

        case 'F':
          txt = $scope.crs.no.othersReason;
          break;;
      }

      return txt;
    }

    function getCRSinfo() {
      var customerInfo = UserService.customer();
      var nric = customerInfo.nric;
      var newId = (nric.length === 12) ? '1' : '2';
      var selectedCountry = _.find($scope.viewData.countries, function (item) {
        return item.key === $scope.data.addressInfo.country;
      });

      if (selectedCountry) selectedCountry = selectedCountry.countryCode;
      var data = {
        companyCode: $scope.data.selectedPolicy.lineOfBiz.toUpperCase() === 'LAFT' ? '072' : '016',
        client: [{
          idType: newId,
          clientID: nric,
        },],
        policyNo: $scope.data.selectedPolicy.policyNo,
        sourceSystem: '12', // iserve 8
        entityType: '1',
        crsInd: ($scope.crs.no.reason || $scope.crs.selectedNo) ? 'N' : 'Y',
        crsReConfirmReason: $scope.crs.no.reason ? getCrsNoReason($scope.crs.no.reason) : '',
        addrClient: _.values($scope.data.addressInfo).join(' ,'),
        addrCountry: selectedCountry || '',
        formReceivedDate: moment().format('YYYY-MM-DD HH:mm:ss.SSS'),
        crsClientTin: $scope.crs.no.reason ? {} : manipulateCrsTinList(),
      };

      return data;
    }

    $scope.submit = function () {
      // $scope.steps = 3;
      // $scope.viewData.success = true;
      $scope.viewData.selectedPolicies = _.flattenDeep($scope.viewData.selectedPolicies);
      TransactionsService.hideBackButton();

      var crsInfo = getCRSinfo();
      var obj = _.clone($scope.dataForOTP);
      obj.sessionId = $scope.otpSessionId;
      obj.token = $scope.viewData.verificationCode;
      // obj.mobileNo = (AppMeta.appRefNo === 'CX' ? getNewNumbers().newMobileNumber : '');
      obj.mobileNo = (AppMeta.appRefNo === 'CX' ? getMobileNoWithCC() : '');

      var waterfullArr = [
        function (callback) {
          TransactionsService.verifyOTP(obj, true)
            .then(function (res) {
              if (res != false) {
                callback(null);
              } else {
                callback('invalid OTP');
              }
            });
        },

        function uploadDocsFun(callback) {
          var pics2Upload = _.map($scope.pics, function (pic) {
            return {
              document: pic.split('data:image/jpeg;base64,')[1] || '',
              docType: '.jpg',
            };
          });

          if (pics2Upload.length === 0) return callback(null);
          $ionicLoading.show({
            template: 'Uploading Docs...',
          });
          ResourcesService.submission.crsUploadDocs(pics2Upload)
            .then(function success(data) {
              console.log(data.res);
              _.each($scope.viewData.selectedPolicies, function (policy) {
                policy.documentUpload = [];
                _.assign(policy.documentUpload, [{
                  documentUploadID: data.res.id,
                },]);
              });

              callback(null);
              $ionicLoading.hide();
            }, function failer(err) {

              $ionicLoading.hide();
              callback(err);
            });
        },

        function submit(callback) {
          $scope.data.addressInfo.postcode = $scope.data.addressInfo.postCode;
          delete $scope.data.addressInfo.postCode;
          var data = _.cloneDeep($scope.data);
          if (data.addressInfo.country !== 'MAL')
            data.addressInfo.postcode = data.addressInfo.state = '';
          data.crsInfo = crsInfo;

          // new numbers
          var newNumbers = getNewNumbers();
          data.policyOwnerInfo.newMobile = newNumbers.newMobileNumber;
          data.policyOwnerInfo.homeNo = newNumbers.homeNewNumber;
          data.policyOwnerInfo.officeNo = newNumbers.officeNewNumber;

          if (!_.isEmpty($scope.fatca.w9) || !_.isEmpty($scope.fatca.w8))
            data.fatca = $scope.fatca;

          TransactionsService.submission.submitChangeOfAddress(data, $scope.viewData)
            .then(function success(res) {
              return callback(null);
            }, function failed(err) {

              return callback(err);
            });
        },
      ];

      async.waterfall(waterfullArr, function (err, result) {
        if (!err) {
          $scope.steps = TransactionsService.updateState(4);
          $scope.viewData.success = true;
          $scope.$apply();
          TransactionsService.hideBackButton();
        }
      });
    };

    function getMobileNoWithCC() {
      var newNum = getNewNumbers().newMobileNumber;
      return newNum.indexOf($scope.data.countryMobileCode.callingCode) < 0 ? ('00' + $scope.data.countryMobileCode.callingCode + newNum) : '00' + newNum;
    }


    $scope.requestOTP = function requestOTP() {
      var obj = _.clone($scope.dataForOTP);
      // obj.mobileNo = (AppMeta.appRefNo === 'CX' ? getNewNumbers().newMobileNumber : '');
      obj.mobileNo = (AppMeta.appRefNo === 'CX' ? getMobileNoWithCC() : '');

      TransactionsService.requestOTP(obj, true)
        .then(function success(res) {
          $scope.otpSessionId = res.res.sessionId;
        }, function fail(res) {

          console.log(res);
        });

    };

    $scope.addCrsItem = function () {
      $scope.crs.yes.crsList.push({});
      $ionicScrollDelegate.scrollBottom();
    };

    $scope.removeCrsItem = function (index) {
      $scope.crs.yes.crsList.splice(index, 1);
    };

    // $scope.showTinModal = function() {
    //   if ($scope.fatca.w8.noTin)
    //     ChangeAddressService.showTinModal($scope);
    // }

    $scope.digitalSign = function () {
      ChangeAddressService.showDeclaration($scope);
    };

    $scope.crsNoProceed = function () {
      if ($scope.crs.no.reason && ['A', 'B', 'C', 'D', 'E', 'F'].indexOf($scope.crs.no.reason) >= 0) {
        $scope.crs.no.reasonDes = getCrsNoReason($scope.crs.no.reason);
        $scope.updateState('crsDocs');
      } else {
        $scope.updateState(2);
      }
    };

    $scope.addressLineAllows = function (text) {
      var success = /^[\w '@\-&#./,]*$/.test(text);
      if (!success)
        NotificationService.alert({
          title: 'Error',
          template: 'Address contains invalid characters, Valid characters are: \'_&#./,',
        });
    }

    // $scope.$watch('data.addressInfo.country', function(nv, ov) {
    //   if (!nv) return;)

    // $scope.$watch('data.addressInfo.country', function(nv, ov) {
    //   if (!nv) return;
    //   $scope.viewData.countryObj = _.find($scope.viewData.countries, function(item) {
    //     return item.key === nv;
    //   });

    //   $scope.viewData.CRScountryObj = _.find($scope.viewData.countries, function(item) {
    //     return item.key === nv;
    //   });

    //   if ($scope.viewData.countryObj)
    //     $scope.data.countryMobileCode = $scope.data.countryHomeCode = $scope.data.countryOfficeCode = $scope.viewData.countryObj;

    // }, true);

    $scope.cancelTransaction = function cancelTransaction() {
      ChangeAddressService.confirmationCancelModal($scope);
    };

    $scope.disableCRSYES = function () {
      var invalidInput = false;
      if ($scope.crs.yes.crsList.length == 0) invalidInput = true;
      _.each($scope.crs.yes.crsList, function (item) {
        if (!(item.country && ((item.tin && !item.noTin) || (!item.tin && item.noTin && (item.tinreason != false || !_.isEmpty(item.tinreason))))))
          invalidInput = true;

        if (!item.tin && item.noTin && item.tinreason == 'B' && !item.othersReason)
          invalidInput = true;
      });

      return invalidInput;
    };

    $scope.showReasonA = function showReasonA(checkNoTin) {
      if (!this.item || !this.item.country) return false;
      if (!this.item.noTin) this.item.tinreason = false; // clear no tin flag.
      var selectedCountry = this.item.country.country.toLowerCase();
      var fourCountries = ['cayman islands', 'bermuda', 'montserrat', 'turks and caicos islands'];
      var isIt = fourCountries.indexOf(selectedCountry) >= 0;
      if (isIt) {
        this.item.noTin = true;
        this.item.tinreason = 'A';
      }

      return isIt;
      // return fourCountries.indexOf(selectedCountry) >= 0;
    };

    $scope.scanDoc = function () {
      if (!$scope.pics) $scope.pics = [];

      var options = {
        quality: 60,
        destinationType: Camera.DestinationType.DATA_URL,
        sourceType: Camera.PictureSourceType.CAMERA,
        encodingType: Camera.EncodingType.JPEG,
        targetWidth: 1200,
        targetHeight: 1200 * 1.414,
        saveToPhotoAlbum: false,
      };

      return $cordovaCamera.getPicture(options)
        .then(function (imageData) {
          var newImg = 'data:image/jpeg;base64,' + imageData;
          $scope.pics.push(newImg);
        }, function (err) {

          $log.log(err);

        });
    };

    $scope.previewPic = function previewPic(index) {
      var thisPic = this.pic;
      // Cleanup the modal when we're done with it!
      $scope.$on('$destroy', function () {
        if ($scope.previewPicModal)
          $scope.previewPicModal.remove();
      });

      $scope.closeModal = function () {
        $scope.previewPicModal.hide();
      };

      $scope.deletePic = function () {
        $scope.pics.splice(index, 1);
        $scope.previewPicModal.hide();
      };

      $ionicModal.fromTemplateUrl('templates/modals/previewChangeAddressPics.html', {
        scope: $scope,
        animation: 'slide-in-up',
      })
        .then(function (modal) {
          $scope.previewPicModal = modal;
          $scope.previewPicModal.show();
          $scope.previewPicModal.pic = thisPic;
        });
    };

  });
