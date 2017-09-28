angular.module('app.services')

.factory('TopUpService', function(NotificationService, UtilityService, PopulatedVluesService, TransactionsService, ResourcesService, $log) {

  function updateFundAllocaton(data, premiumVal) {
    _.each(data, function(item) {
      item.valueOfUnits = item.allocationPercent * premiumVal / 100 || 'N/A';
    });
  }

  function updateFund(data, premiumVal) {
    _.each(data, function(item) {
      if (premiumVal && item.allocationPercent)
        item.valueOfUnits = (item.allocationPercent * premiumVal / 100) || 'N/A';
    });
  }

  function sumAllocation(data) {
    var tmpAllocation = _.map(data, function(item) {
      return item.allocationPercent || 0;
    });

    return _.sum(tmpAllocation);
  }

  function disableAllFunds(data) {
    _.each(data, function(item) {
      if (item.allocationPercent)
        item.isEnabled = false;
    });
  }

  function checkPreviousValues(data) {
    var index = 0;
    if (data && data.length >= 2)
      index = data.length - 1;

    if (data.length == 0) return true;

    return (data[index].typeOfFund && data[index].valueOfUnits);
  }

  function addFund(data) {
    disableAllFunds(data);
    if (!checkPreviousValues(data)) return false;
    var sum = sumAllocation(data);
    if (sum >= 100) {
      NotificationService.alert({
        title: 'Error',
        template: 'can not add more funds, your total 100%',
      });
      return false;
    } else {
      return true;
    }
  }

  function removeFund(data, index) {
    NotificationService.confirm({
      title: 'Fund Remove',
      template: 'Fund remove, are you sure?'
    }).then(function(remove) {
      if (remove)
        data.splice(index, 1);
    });
  }


  function updateAllocation(data, index) {
    var sum = sumAllocation(data);
    if (sum > 100)
      NotificationService.alert({
        title: 'Error',
        template: 'Can not add more funds allocation, your total ' + sum + ' %',
      }).then(function() {
        data[index].allocationPercent = 0;
      });
  }


  function submitTopUp(data, viewData, isScheduleTopUp) {
    // construct submission payload
    var submitData = {
      info: {
        policyNo: data.policyInfo.policyNo,
        sourceSystem: data.policyInfo.lineOfBiz,
        companyCode: TransactionsService.companyCodeUpdate(data.policyInfo.lineOfBiz),
        planName: data.policyInfo.planName,
        ownMobile: data.clientDetails.mobileNo,
        ownEmail: data.clientDetails.ownEmail,
        ownName: data.clientDetails.policyOwnerName,
        ownNric: data.clientDetails.idNo,
      },
      transaction: {
        policyNo: data.policyInfo.policyNo,
        planCode: data.policyInfo.planCode,
        topUpAmount: String(data.premiumVal),
        scheduleAmount: String(data.premiumVal),
        crossSubsidy: viewData.crossSubsidy ? 'Y' : 'N',
        premAlloc: _.map(data.fundAllocation, function(item) {
          return {
            fundCode: item.fundCode,
            allocationRate: String(item.allocationPercent),
          };
        }),
      },
    };

    if (isScheduleTopUp)
      delete submitData.transaction.topUpAmount;
    else
      delete submitData.transaction.scheduleAmount;

    return {
      submitData: submitData,
      submitFunc: isScheduleTopUp ? ResourcesService.submission.submitScheduleTopUp : ResourcesService.submission.submitAdHocTopUp,
    };
  }

  function getScheduleMinAmount(data) {
    return data.scheduleDetail ? data.scheduleDetail.amount : (120 / parseInt(data.policyInfo.freq));
  }

  function getAdHocMinAmount(data) {
    return data.topupDetail && data.topupDetail.amount ? data.topupDetail.amount : 200;
  }

  return {
    init: function init(info) {
      var data = _.cloneDeep(info);
      var freqs = PopulatedVluesService.getPaymentFrequencies();
      var thisFreq = ('00' + data.policyInfo.freq).slice(-2);
      var mapedFreq = _.find(freqs, function(item) {
        return thisFreq == item.value
      });
      data.policyInfo.freq = mapedFreq;

      _.each(data.investmentPortfolio, function(fund) {
        var foundIndex = _.findIndex(data.fundDetails, function(item) {
          return item.fundCode === fund.fundCode
        });
        if (foundIndex >= 0) {
          data.fundDetails[foundIndex] = fund;
        }
      });

      var returnObj = {
        data: {
          premiumVal: 0,
          frequency: data.policyInfo.freq,
          fundAllocation: _.map(data.investmentPortfolio, function mapFun(item) {
            if (item.allocationPercent)
              item.allocationPercent = UtilityService.parseRoundFloat(item.allocationPercent)

            // for existing fund highlighting purpose
            item.highlight = true;

            return item;
          }),
          policyInfo: data.policyInfo,
          fundDetails: data.fundDetails,
          clientDetails: data.clientDetails,
        },
        viewData: {
          minTopUp: 0,
          success: true,
          topUpMode: null,
          topUpValues: [{
            name: 'Schedule Top UP',
            val: 0,
          }, {
            name: 'One-time Top UP',
            val: 1,
          }, ],
          allocationTypes: [{
            val: 1,
            name: 'Current Allocation',
          }, {
            val: 2,
            name: 'New Allocation',
          }],
          freqs: freqs,

        }
      }
      $log.info(returnObj)
      return returnObj;
    },
    updateFundAllocaton: updateFundAllocaton,
    updateFund: updateFund,
    sumAllocation: sumAllocation,
    disableAllFunds: disableAllFunds,
    addFund: addFund,
    removeFund: removeFund,
    updateAllocation: updateAllocation,
    checkPreviousValues: checkPreviousValues,
    submitTopUp: submitTopUp,
    getScheduleMinAmount: getScheduleMinAmount,
    getAdHocMinAmount: getAdHocMinAmount,
  };

});