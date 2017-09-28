angular.module('app.services')

.factory('FundSwitchingService', function($ionicModal, TransactionsService, ResourcesService, NotificationService, $ionicScrollDelegate, $ionicLoading) {
  // var chartColors = ["#E86487", "#FBBF56", "#97CB5D", "#46D3BD", "#22A8DA", "#9962D2"];
  var chartColors = ['#E86487', '#FBBF56', '#97CB5D', '#46D3BD', '#22A8DA', '#9962D2', '#B8123E', '#C36418', '#65962E', '#158D7A', '#0A6E93', '#551893', '#769FAB', '#596C80', '#485B70', '#FF5500', '#FF0000'];
  var pieChartColors = ['#F6CCD7', '#F9E1B8', '#C6EB9E', '#A6E8DE', '#A9DCEF', '#D7BFF0', '#B8123E', '#C36418', '#65962E', '#158D7A', '#0A6E93', '#551893', '#769FAB', '#596C80', '#485B70', '#FF5500', '#FF0000'];
  var _scope = {}

  function initModal() {
    _scope.closeModal = function() {
      _scope.CADmodal.modal.hide();
    };
    // Cleanup the modal when we're done with it!
    _scope.$on('$destroy', function() {
      _scope.CADmodal.modal.remove();
    });
    // Execute action on hide modal
    _scope.$on('modal.hidden', function() {
      // Execute action
    });
    // Execute action on remove modal
    _scope.$on('modal.removed', function() {
      // Execute action
    });
  }

  function loadChartDataCore(scope) {
    scope.viewData.donutChartData = [];
    scope.viewData.pieChartData = [];
    scope.viewData.donutChartLabels = [];
    scope.viewData.pieChartLabels = [];

    // sort switch to fund & premium allocations for charting
    scope.viewData.selectedToFunds = _.sortBy(scope.viewData.selectedToFunds, function(item) {
      return item.toFundPct;
    }).reverse();

    scope.viewData.premiumAllocations = _.sortBy(scope.viewData.premiumAllocations, function(item) {
      return item.allocation;
    }).reverse();

    // donut (switch to fund)
    _.each(scope.viewData.selectedToFunds, function(item, index) {
      scope.viewData.donutChartData.push(item.toFundPct);
      scope.viewData.donutChartLabels.push(item.typeOfFund);
      item.color = chartColors[index];
    });

    // pie (premium allocation)
    _.each(scope.viewData.premiumAllocations, function(item, index) {
      scope.viewData.pieChartData.push(item.allocationPercent);
      scope.viewData.pieChartLabels.push(item.typeOfFund);
      item.color = chartColors[index];
    });
  }

  return {
    getChartColors: function getChartColors() {
      return chartColors;
    },

    getPieChartColors: function getPieChartColors() {
      return pieChartColors;
    },

    confirmAllocationModal: function confirmAllocationModal(scope) {
      var templateUrl = 'templates/modals/fundSwitchingAllocationConfirmation.html';

      _scope = scope;
      _scope.CADmodal = {};
      return $ionicModal.fromTemplateUrl(templateUrl, {
        scope: _scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        _scope.CADmodal.modal = modal;
        initModal();

        _scope.yes = function() {
          _scope.CADmodal.modal.hide();

          // create premium allocation list
          // scope.viewData.premiumAllocations = _.union(scope.viewData.selectedFromFunds, scope.viewData.selectedToFunds);
          scope.viewData.premiumAllocations = _.unionBy(scope.data.fromFunds, scope.viewData.selectedToFunds, 'typeOfFund');

          _scope.steps = TransactionsService.updateState(3);
        };

        _scope.no = function() {
          _scope.CADmodal.modal.hide();

          loadChartDataCore(_scope);

          _scope.steps = TransactionsService.updateState(4);
          console.log(_scope);
        };

        _scope.CADmodal.modal.show();

      });
    },

    cancelFundSwitchingModal: function cancelFundSwitchingModal(scope) {
      var templateUrl = 'templates/modals/cancelFundSwitching.html';

      _scope = scope;
      _scope.CADmodal = {};
      $ionicModal.fromTemplateUrl(templateUrl, {
        scope: _scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        _scope.CADmodal.modal = modal;
        initModal();

        _scope.yes = function() {
          _scope.CADmodal.modal.hide();
          _scope.steps = TransactionsService.backAfterSubmition();
        };

        _scope.no = function() {
          _scope.CADmodal.modal.hide();
        };

        _scope.CADmodal.modal.show();

      });
    },

    removeFund: function removeFund(data, selectedData, index) {
      NotificationService.confirm({
        title: 'Fund Remove',
        template: 'Fund remove, are you sure?'
      }).then(function(remove) {
        if (remove) {
          data.splice(index, 1);
          selectedData.splice(index, 1);
        }
      });
    },

    // check if each fund is switchable from
    initFromFunds: function initFromFunds(lineOfBiz, funds) {
      _.each(funds, function(item) {
        item.meta = {};
        item.selected = false;

        if (lineOfBiz === 'LA') {
          var fundCodes = ['AI01', 'PBF1', 'PBF2', 'GBFA', 'GBF0', 'GBF1', 'GBFA', 'GB1A', 'GB2A', 'GB3A', 'GB4A', 'GB5A', 'GB6A', 'GB7A', 'GB8A'];
          item.meta.switchable = fundCodes.indexOf(item.fundCode) < 0;

        } else if (lineOfBiz === 'LAFT') {
          var fundCodes = ['SPAF', 'SPIF', 'PAF2', 'PAF1', 'INGB'];
          item.meta.switchable = fundCodes.indexOf(item.fundCode) < 0;
        }

        // minimum switchable amount is RM50
        var minFund = 50;
        item.meta.switchable = item.meta.switchable && (item.valueOfUnits > minFund);

        // calculate minimum fund percentage
        item.meta.minAllocation = Math.ceil((minFund / item.valueOfUnits) * 100);

      });

      return funds;
    },

    // check if each fund is switchable to
    initToFunds: function initToFunds(policyNo, lineOfBiz, funds, startDate) {
      _.each(funds, function(item) {
        item.meta = {};
        item.selected = false;

        if (lineOfBiz === 'LA') {
          var fundCodes = ['FI1A', 'DB1A', 'AB01', 'IF1A', 'EDFA', 'AE01', 'DS1A', 'RF1A', 'MC1A', 'TAD1', 'EP1A', 'THD1', 'NHFA', 'AOFA', 'TAE1', 'APFA', 'ISCA'];
          item.meta.switchable = fundCodes.indexOf(item.fundCode) >= 0;

          var fundCodes = ['TAD1', 'TAE1', 'THD1'];
          if (policyNo.charAt(0) === 'U') {
            item.meta.hidden = (fundCodes.indexOf(item.fundCode) >= 0);
            item.meta.switchable = !item.meta.hidden;
          }

          var start = moment(new Date(startDate));
          if (start.isAfter(new Date("17 Jun 2013"))) {
            item.meta.hidden = (fundCodes.indexOf(item.fundCode) >= 0);
            item.meta.switchable = !item.meta.hidden;
          }

        } else if (lineOfBiz === 'LAFT') {
          var fundCodes = ['ABA1', 'ADA1', 'ADE0', 'ADE1'];
          item.meta.switchable = fundCodes.indexOf(item.fundCode) >= 0;
        }
      });

      return funds;
    },

    validateStep1Form: function validateStep1Form(fromFunds) {
      var valid = false;
      _.each(fromFunds, function(item) {
        valid = valid || item.meta.switchable;
      });

      return valid;
    },

    validateStep2Form: function validateStep2Form(fromFunds, toFunds) {
      var totalFromPct = totalToPct = 0;
      _.each(fromFunds, function(item) {
        totalFromPct += parseInt(item.fromFundPct ? item.fromFundPct : 0);
      });

      _.each(toFunds, function(item) {
        totalToPct += parseInt(item.toFundPct ? item.toFundPct : 0);
      });

      var valid = true;
      var error = '';
      if (totalToPct != 100) {
        error = 'Total fund allocation must be 100%';
        valid = false;
      }

      for (var i = 0; i < fromFunds.length; i++) {
        var item = fromFunds[i];
        if (item.fromFundPct < item.meta.minAllocation) {
          error = item.typeOfFund + ' cannot be less than minimum amount of RM50(' + item.meta.minAllocation + '%)';
          valid = false;
          break;
        }
      }

      if (!valid) {
        NotificationService.alert({
          title: 'Error',
          template: error
        }).then(function(remove) {
          // do nothing
        });
      }

      return valid;
    },

    validateStep3Form: function validateStep3Form(funds, showDialog) {
      showDialog = (typeof showDialog === 'undefined') ? true : showDialog;

      var newAllocFactor = 0;
      _.each(funds, function(item) {
        item.allocationPercent = item.allocationPercent ? item.allocationPercent : "0";
        newAllocFactor += parseInt(item.allocationPercent);
      });

      var isValid = true;
      var error = '';
      if (newAllocFactor != 100) {
        error = 'Total premium allocation for all fund(s) must add up to 100%.';
        isValid = false;
      }

      if (!isValid && showDialog) {
        NotificationService.alert({
          title: 'Error',
          template: error
        }).then(function(remove) {
          // do nothing
        });
      }

      return isValid;
    },

    loadChartData: function(scope) {
      loadChartDataCore(scope);
    },

    validateSelectedFund: function validateSelectedFund(funds, fund, index, fromFunds, toFunds, type) {
      // check if the same fund exists in from and to funds
      var valid = true;
      try {
        var from = _.filter(fromFunds, function(item) {
          return item && item.fundCode === fund.fundCode;
        });
        var to = _.filter(toFunds, function(item) {
          return item && item.fundCode === fund.fundCode;
        });

        // cannot switch between the same funds
        if (from.length > 0 && to.length > 0) {
          throw 'Unable to switch between the same funds';
        }

        // cannot select the same fund
        if ((_.uniq(fromFunds).length !== fromFunds.length) || (_.uniq(toFunds).length !== toFunds.length)) {
          throw "This fund (" + fund.typeOfFund + ") is already selected";
        }

        // minimum allocation validation
        // if(type === 'from') {
        //   if(parseFloat(fund.fromFundPct) > fund.meta.minAllocation) {
        //     throw "Minimum ";
        //   }
        // }

      } catch (err) {
        valid = false;
        NotificationService.alert({
          title: 'Error',
          template: err
        }).then(function(argument) {});

        // construct submission payload
        funds[index] = undefined;
      }

      return valid;
    },

    submitFundSwitching: function submitFundSwitching(data, viewData) {
      $ionicLoading.show({
        template: 'Please Wait...',
      });

      var submitData = {
        info: {
          policyNo: data.policyInfo.policyNo,
          sourceSystem: data.policyInfo.lineOfBiz,
          companyCode: TransactionsService.companyCodeUpdate(data.policyInfo.lineOfBiz),
          planName: data.policyInfo.planName,
          ownName: data.clientDetails.policyOwnerName,
          ownMobile: data.clientDetails.mobileNo,
          ownEmail: data.clientDetails.ownEmail,
          ownNric: data.clientDetails.idNo,
        },
        transaction: {
          policyNo: data.policyInfo.policyNo,
          oldFund: _.map(viewData.selectedFromFunds, function(item) {
            return {
              fundCode: item.fundCode,
              allocationRate: String(item.fromFundPct),
            };
          }),
          newFund: _.map(viewData.selectedToFunds, function(item) {
            return {
              fundCode: item.fundCode,
              allocationRate: String(item.toFundPct),
            };
          }),
          newPremAlloc: _.map(viewData.premiumAllocations, function(item) {
            return {
              planCode: data.policyInfo.planCode,
              fundCode: item.fundCode,
              allocationRate: String(item.allocationPercent),
            };
          }),
        },
      };

      // submit to server
      return ResourcesService.submission.submitFundSwitching(submitData)
        .then(function(res) {
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
    }

  };
});