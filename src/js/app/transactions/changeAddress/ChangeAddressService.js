angular.module('app.services')

  .factory('ChangeAddressService', function ($ionicModal, TransactionsService, ResourcesService, NotificationService, $ionicScrollDelegate,
    $ionicLoading, ResourcesService, $timeout, UserService) {
    var USstates = TransactionsService.populate.getUSstates();

    function crsHandleLoadData(yes, _scope) {
      return loadPreviousCRS(_scope).then(function (res) {
        // populate data.
        if (res.hadSubmitted) {
          _scope.crsData = res.data;
          _scope.crsData.showIsCorrectBtn = false;
          if (_scope.crsData) {
            _scope.crsData.formReceivedDate = moment(_scope.crsData.formReceivedDate).toDate();
            if (_scope.crsData.crsInd === 'Y' && yes) { // old yes, new yes
              _scope.crsData.showIsCorrectBtn = true;
              _scope.crs.yes.crsList = fillCrsWithOldYesData(_scope.crsData, _scope.viewData.crscountries);
            }

            return showExistingCRSData(_scope);
          }
        } else return;
      });
    }

    function isUSMY(countryCode, phoneNumber) {
      if (!countryCode || !countryCode.callingCode) return true;

      // country code:
      var cc = countryCode.callingCode.toString().replace(/\D/g, '');
      cc = cc.replace(/^(0+)/g, '');
      if (['60', '1', '1684', '1671', '1670', '1787', '1939', '1340'].indexOf(cc.toString()) >= 0) return true;

      //US subs:
      var number = phoneNumber.toString().slice(0, 3);
      if (cc == 1 && USstates.indexOf(number) >= 0)
        return true;

      return false;
    }

    function showCrsDeclarationModal(_scope) {
      return $ionicModal.fromTemplateUrl('templates/modals/crsDeclarationModal.html', {
        scope: _scope,
        animation: 'slide-in-up',
        backdropClickToClose: false,
      }).then(function (modal) {
        _scope.cancel = function () {
          modal.hide();
        };

        _scope.yes = function () {
          $ionicLoading.show({
            template: 'Loading...',
          });
          crsHandleLoadData(true, _scope)
            .then(function () {
              $ionicLoading.hide();
              _scope.steps = TransactionsService.updateState('crsYes');
              _scope.crs.selectedStep = 'crsYes';
            });

          modal.hide();
        };

        _scope.no = function () {
          $ionicLoading.show({
            template: 'Loading...',
          });
          crsHandleLoadData(false, _scope)
            .then(function () {
              $ionicLoading.hide();
              if (
                isUSMY(_scope.data.countryMobileCode, _scope.data.policyOwnerInfo.newMobile) &&
                isUSMY(_scope.data.countryHomeCode, _scope.data.policyOwnerInfo.homeNo) &&
                isUSMY(_scope.data.countryOfficeCode, _scope.data.policyOwnerInfo.officeNo) &&
                // countries as us:
                ['USA', 'AMS', 'GUM', 'NMI', 'PUE', 'USV', 'MOI', 'MAL'].indexOf(_scope.data.addressInfo.country) >= 0
              ) {
                // go to policy selection page.
                _scope.crs.selectedNo = true;
                $timeout(function () {
                  _scope.steps = TransactionsService.updateState(2);
                  try {
                    $scope.$apply();
                  } catch (_e) { }
                }, 200);

              } else {
                _scope.crs.selectedStep = 'crsNo';
                $timeout(function () {
                  _scope.steps = TransactionsService.updateState('crsNo');
                  try {
                    $scope.$apply();
                  } catch (_e) { }
                }, 200);
              }
            });

          modal.hide();

        };

        modal.show();
      });
    }

    function loadPreviousCRS(_scope) {
      return new Promise(function (resolve, reject) {
        var customerInfo = UserService.customer();
        var nric = customerInfo.nric;
        var newId = (nric.length === 12) ? '1' : '2';
        var info = {
          companyCode: _scope.data.selectedPolicy.lineOfBiz.toUpperCase() === 'LAFT' ? '072' : '016',
          idType: newId,
          clientId: nric,
        };
        return ResourcesService.crsInquiry(info)
          .then(function success(crsData) {
            return resolve({
              data: crsData.res.response.crsClient,
              hadSubmitted: !!crsData.res.response.crsClient,
            });
          }, function fail(err) {
            // try again.
            return resolve({
              data: {},
              hadSubmitted: false,
            });
          });
      });
    }

    function fillCrsWithOldYesData(crsData, countries) {

      return _.map(crsData.crsClientTins.crsClientTin, function (item) {
        var country = _.find(countries, function (country) {
          return country.countryCode === item.taxResCountry;
        });

        return {
          country: country,
          tin: item.taxIdNo,
          tinreason: item.reasonCode,
          othersReason: item.reasonDesc,
          noTin: item.taxIdNo ? false : true,
        };
      });
    }

    function showExistingCRSData(_scope) {
      return $ionicModal.fromTemplateUrl('templates/modals/existingCRSDataModal.html', {
        scope: _scope,
        animation: 'slide-in-up',
      }).then(function (modal) {
        _scope.cancel = function () {
          modal.hide();
        };

        _scope.edit = function () {
          modal.hide();
        };

        _scope.correct = function () { // only shown if old and new declaration are YES.
          modal.hide();
          _scope.steps = TransactionsService.updateState(2);
        };

        modal.show();
      });
    }

    function showTinModal(_scope) {
      return $ionicModal.fromTemplateUrl('templates/modals/fatcaW8TinConfirmModal.html', {
        scope: _scope,
        animation: 'slide-in-up',
      }).then(function (modal) {
        _scope.confirm = function () {
          modal.hide();
        };

        _scope.closeModal = function () {
          modal.hide();
        };

        modal.show();
      });
    }

    function usCitizenConfirmationModal(_scope) {
      var templateUrl = 'templates/modals/crsUScitizenConfirmation.html';
      $ionicModal.fromTemplateUrl(templateUrl, {
        scope: _scope,
        animation: 'slide-in-up',
      }).then(function (modal) {
        _scope.cancel = function () {
          modal.hide();
        };

        _scope.yes = function () {
          modal.hide();
          _scope.fatca.fatcaFlag = 'Y';
          _scope.fatca.fatcaType = 'w9';
          if (!_.isEmpty(_scope.data.receivedW9Form))
            return showCrsDeclarationModal(_scope); // go to CRS check.
          else {
            _scope.fatca.selectedStep = 'w9';
            $timeout(function () {
              _scope.steps = TransactionsService.updateState('w9');
              try {
                $scope.$apply();
              } catch (_e) { }
            }, 200);

          }
        };

        _scope.no = function () {
          _scope.fatca.fatcaFlag = 'N';
          _scope.fatca.fatcaType = 'w8';
          modal.hide();
          var checkUS = (isUSCitizen(_scope.data.countryMobileCode, _scope.data.policyOwnerInfo.newMobile) ||
            isUSCitizen(_scope.data.countryHomeCode, _scope.data.policyOwnerInfo.homeNo) ||
            isUSCitizen(_scope.data.countryOfficeCode, _scope.data.policyOwnerInfo.officeNo) ||
            ['USA', 'AMS', 'GUM', 'NMI', 'PUE', 'USV', 'MOI'].indexOf(_scope.data.addressInfo.country) >= 0);

          if (checkUS)
            _scope.fatca.fatcaFlag = 'Y';

          if (checkUS && _.isEmpty(_scope.data.receivedW8Form)) {
            _scope.fatca.selectedStep = 'w8';
            $timeout(function () {
              _scope.steps = TransactionsService.updateState('w8');
              try {
                $scope.$apply();
              } catch (_e) { }
            }, 200);

          } else {
            return showCrsDeclarationModal(_scope);
          }
        };

        modal.show();
      });
    }

    function isUSCitizen(countryCode, phoneNumber) {
      if (!countryCode || !phoneNumber) return false;
      var cc = countryCode.callingCode.toString().replace(/\D/g, '');
      if (phoneNumber.length < 3 && cc == 1) return true;

      var number = phoneNumber.slice(0, 3);
      if (cc == 1 && USstates.indexOf(number) >= 0)
        return true;

      // check others:
      if (['1684', '1671', '1670', '1787', '1939', '1340'].indexOf(cc) >= 0) return true;
      return false;
    }

    function isMalaysian(countryCode, phoneNumber) {
      if (!countryCode) return true;

      var cc = countryCode.toString().replace(/\D/g, '');
      if (cc == 60)
        return true;
      return false;
    }

    function validateTncCheck(_scope, modal) {
      if (_scope.popupDeclaration.chkbx1 && _scope.popupDeclaration.chkbx2 && _scope.popupDeclaration.chkbx3) {
        modal.hide();
        _scope.viewData.digitalSigned = true;
      }
    }

    function showDeclaration(_scope) {
      _scope.popupDeclaration = {};
      if (_scope.fatca.selectedStep == 'w9') {
        return $ionicModal.fromTemplateUrl('templates/modals/tcFatcaW9.html', {
          scope: _scope,
          animation: 'slide-in-up',
          backdropClickToClose: false,
        }).then(function (modal) {
          _scope.closeModal = function () {
            modal.hide();
          };

          _scope.tncCheck = function () {
            validateTncCheck(_scope, modal);
          };

          modal.show();
        });
      } else if (_scope.fatca.selectedStep == 'w8') {
        return $ionicModal.fromTemplateUrl('templates/modals/tcFatcaW8.html', {
          scope: _scope,
          animation: 'slide-in-up',
          backdropClickToClose: false,
        }).then(function (modal) {
          _scope.closeModal = function () {
            modal.hide();
          };

          _scope.tncCheck = function () {
            validateTncCheck(_scope, modal);
          };

          modal.show();
        });
      } else {
        return $ionicModal.fromTemplateUrl('templates/modals/crsDigitalSignModal.html', {
          scope: _scope,
          animation: 'slide-in-up',
          backdropClickToClose: false,
        }).then(function (modal) {
          _scope.closeModal = function () {
            modal.hide();
          };

          _scope.tncCheck = function () {
            validateTncCheck(_scope, modal);
          };

          modal.show();
        });
      }
    }

    function confirmationCancelModal(scope) {

      var templateUrl = 'templates/modals/cancelAutoDebitConformation.html';

      _scope = scope;
      _scope.CADmodal = {};
      $ionicModal.fromTemplateUrl(templateUrl, {
        scope: _scope,
        animation: 'slide-in-up',
      }).then(function (modal) {
        _scope.CADmodal.modal = modal;
        //
        _scope.closeModal = function () {
          _scope.CADmodal.modal.hide();
        };
        // Cleanup the modal when we're done with it!
        _scope.$on('$destroy', function () {
          _scope.CADmodal.modal.remove();
        });
        // Execute action on hide modal
        _scope.$on('modal.hidden', function () {
          console.log('hidden');

          // Execute action
        });
        // Execute action on remove modal
        _scope.$on('modal.removed', function () {
          console.log('removed');
          // Execute action
        });

        _scope.CADmodal.yes = function () {
          _scope.CADmodal.modal.hide();
          TransactionsService.backAfterSubmition();
        };

        _scope.CADmodal.no = function () {
          _scope.CADmodal.modal.hide();
        };
        //
        _scope.CADmodal.modal.show();

      });

    }

    // W forms:
    var _W8Form, _W9Form;

    return {
      showCrsDeclarationModal: showCrsDeclarationModal,
      showTinModal: showTinModal,
      checkFatca: usCitizenConfirmationModal,
      isUSCitizen: isUSCitizen,
      isMalaysian: isMalaysian,
      showDeclaration: showDeclaration,
      confirmationCancelModal: confirmationCancelModal,
      initWforms: function initWforms(w8Form, w9Form) {
        if (_.isUndefined(_W8Form) && _.isUndefined(_W9Form)) {
          _W8Form = w8Form ? moment(w8Form).format('MMMM d, YYYY') : '';
          _W9Form = w9Form ? moment(w9Form).format('MMMM d, YYYY') : '';
        }
        return {
          receivedW8Form: _W8Form,
          receivedW9Form: _W9Form
        }
      }

    };

  });
