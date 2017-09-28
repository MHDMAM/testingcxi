angular.module('app.controllers')

.controller('FundSwitchingCtrl', function($scope, $log, $ionicScrollDelegate, FundSwitchingService, ModalService, TransactionsService, NotificationService, PopulatedVluesService, AppMeta, fsInfo) {
  $log.info(fsInfo);
  init();
  $scope.isPremAloccValid = true;
  $scope.otpSessionId = null;

  function filterFunds(funds) {
    return _.filter(funds, function(item) {
      return item.meta.switchable;
    });
  }

  function init() {
    $scope.steps = 1;
    $scope.data = {};
    $scope.data.policyInfo = fsInfo.policyInfo;
    $scope.data.clientDetails = fsInfo.userInfo;

    $scope.data.fromFunds = FundSwitchingService.initFromFunds($scope.data.policyInfo.lineOfBiz, _.cloneDeep(fsInfo.investmentPortfolio));
    $scope.data.toFunds = FundSwitchingService.initToFunds($scope.data.policyInfo.policyNo, $scope.data.policyInfo.lineOfBiz, _.cloneDeep(fsInfo.toFunds), $scope.data.policyInfo.coveragePeriod.start);

    $scope.data.fromFunds = filterFunds($scope.data.fromFunds);
    $scope.data.toFunds = filterFunds($scope.data.toFunds);

    $scope.viewData = {
      userFromFunds: [{}],
      selectedFromFunds: [],
      userToFunds: [{}],
      selectedToFunds: [],
      premiumAllocations: [],
      success: false,
      current_date: moment().format('DD MMMM YYYY')
    };

    // get frequency
    $scope.viewData.freqDesc = _.find(PopulatedVluesService.getPaymentFrequencies(), function(item) {
      return (item.value === $scope.data.policyInfo.freq);
    }).key;

    // init charts
    initChart();

    // loadDummyData();
  }

  function initChart() {
    $scope.viewData.donutChartDataset = {
      borderWidth: 0,
      backgroundColor: FundSwitchingService.getChartColors(),
    };
    $scope.viewData.pieChartDataset = {
      backgroundColor: FundSwitchingService.getPieChartColors(),
    };
  }

  function loadDummyData() {
    $scope.viewData.success = true;

    var funds = ['AIA Fixed Income Fund', 'AIA Balanced Fund', 'AIA Equity Plus Fund'];
    for (var i = 0; i < funds.length; i++) {
      $scope.data.fromFunds.push({
        fundCode: 'ABC',
        typeOfFund: funds[i],
        noOfUnits: 30,
        allocationPercent: 56,
        unitPrice: 100.00,
        valueOfUnits: 123.00,
      });
    }
  }

  $scope.updateState = function(step) {
    if (step === 3) {
      // show add allocation factor modal
      FundSwitchingService.confirmAllocationModal($scope);
    } else if (step === 4) {
      // load chart data
      FundSwitchingService.loadChartData($scope);
      $scope.steps = TransactionsService.updateState(step);
    } else {
      $scope.steps = TransactionsService.updateState(step);
    }
  }

  $scope.termsNconditions = function() {
    ModalService.showModal($scope, {
      templateUrl: 'templates/modals/tcFundSwitch.html'
    });
  }

  $scope.close = function() {
    TransactionsService.backAfterSubmition();
  }

  $scope.addFromFund = function() {
    $scope.viewData.userFromFunds.push({});
    $ionicScrollDelegate.scrollBottom(true);
  }

  $scope.addToFund = function() {
    $scope.viewData.userToFunds.push({});
    $ionicScrollDelegate.scrollBottom(true);
  }

  $scope.cancelFromFund = function(index) {
    FundSwitchingService.removeFund($scope.viewData.userFromFunds, $scope.viewData.selectedFromFunds, index);
    $ionicScrollDelegate.scrollBottom(true);
  }

  $scope.cancelToFund = function(index) {
    FundSwitchingService.removeFund($scope.viewData.userToFunds, $scope.viewData.selectedToFunds, index);
    $ionicScrollDelegate.scrollBottom(true);
  }

  $scope.cancel = function() {
    FundSwitchingService.cancelFundSwitchingModal($scope);
  }

  $scope.validateStep1Form = function() {
    return FundSwitchingService.validateStep1Form($scope.data.fromFunds);
  }

  $scope.validateStep2Form = function() {
    var valid = FundSwitchingService.validateStep2Form($scope.viewData.selectedFromFunds, $scope.viewData.selectedToFunds);
    $scope.viewData.valid = valid;

    if (valid) {
      $scope.updateState(3);
    }
  }

  $scope.validateStep3Form = function() {
    var valid = FundSwitchingService.validateStep3Form($scope.viewData.premiumAllocations);
    if (valid) {
      $scope.updateState(4);
    }
  }

  $scope.fundSelected = function(funds, index, type) {
    var fund = funds[index];

    if (fund) {
      // pre-polulate the minimum allocation
      // if(!fund.fromFundPct)
      fund.fromFundPct = fund.meta.minAllocation;

      $scope.viewData.valid = FundSwitchingService.validateSelectedFund(funds, fund, index, $scope.viewData.selectedFromFunds, $scope.viewData.selectedToFunds, type);
    }
  }

  $scope.fundChange = function(funds, index, type) {
    var fund = funds[index];

    if (fund) {
      if (type === 'from') {
        if (fund.fromFundPct && parseFloat(fund.fromFundPct) < fund.meta.minAllocation) {
          fund.fromFundPct = fund.meta.minAllocation;
        }
      }

      $scope.viewData.valid = FundSwitchingService.validateSelectedFund(funds, fund, index, $scope.viewData.selectedFromFunds, $scope.viewData.selectedToFunds, type);
    }
  }

  $scope.$watch('viewData.premiumAllocations', function(nv, ov) {
    if (nv === ov) return;
    $scope.isPremAloccValid = FundSwitchingService.validateStep3Form(nv, false);
    nv = _.each(nv, function(item) {
      item.allocationPercent = _.toNumber(item.allocationPercent);
      if (item.allocationPercent === 0) item.allocationPercent = null;
    })
  }, true);

  $scope.dataForOTP = {
    transactionName: AppMeta.forms.FundSwitching.otpFormType,
    email: fsInfo.userInfo.email,
    mobileNo: fsInfo.userInfo.mobileNo,
    sessionId: $scope.otpSessionId,
    NRIC: fsInfo.userInfo.idNo,
    token: $scope.data.verificationCode
  }


  $scope.requestOTP = function requestOTP() {
    var obj = _.clone($scope.dataForOTP);

    TransactionsService.requestOTP(obj)
      .then(function success(res) {
        $scope.otpSessionId = res.res.sessionId;
      }, function fail(res) {
        console.log(res);
      });
  }

  $scope.submit = function() {
    // submit form
    var obj = _.clone($scope.dataForOTP);
    obj.sessionId = $scope.otpSessionId;
    obj.token = $scope.data.verificationCode;
    var waterfullArr = [
      function(callback) {
        TransactionsService.verifyOTP(obj).then(function(res) {
          if (res != false) {
            callback(null);
          } else {
            callback(true);
          }
        })
      },
      function(callback) {
        FundSwitchingService.submitFundSwitching($scope.data, $scope.viewData)
          .then(function(success) {
            $scope.viewData.success = success;
            if (success) {
              $scope.updateState(5);
            }
            callback(null);
          });
      }
    ]

    async.waterfall(waterfullArr, function(err, result) {
      if (!err) {}
    });

    // FundSwitchingService.submitFundSwitching($scope.data, $scope.viewData)
    // .then(function (success) {
    //   $scope.viewData.success = success;
    //   if(success) {
    //     $scope.updateState(5);
    //   }
    // });
  }
});