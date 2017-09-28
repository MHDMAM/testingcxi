angular.module('app.controllers')

.controller('PolicyDetailsCtrl', function($scope, $state, PolicyService, PopulatedVluesService, UserService, detailsInfo) {

  $scope.viewData = detailsInfo;
  $scope.viewData.showMore = true;
  $scope.viewData.filterLength = 4;
  $scope.viewData.calulatedFeilds = {};
  PolicyService.initData($scope.viewData)

  var countries = PopulatedVluesService.getCountries();
  if ($scope.viewData.clientDetails && $scope.viewData.clientDetails.country)
    $scope.viewData.calulatedFeilds.country = _.find(countries, function find(item) {
      return item.key === $scope.viewData.clientDetails.country;
    })

  // Plan code:
  // $scope.viewData.calulatedFeilds.coverageAmount.planCode

  $scope.transactions = PolicyService.updateTransactionNgIf($scope.viewData);

  $scope.goTo = function(to) {
    var creditCardInfo = fsInfo = {};
    if (to === 'creditCard') {
      creditCardInfo = _.pick($scope.viewData.policyInfo, ['bankName', 'cardNo', 'insuredName']);
    }

    var userInfo = _.pick($scope.viewData.clientDetails, ['idNo', 'mobileNo', 'email', 'policyOwnerName']);
    userInfo.lineOfBiz = $scope.viewData.policyInfo.lineOfBiz;
    userInfo.planName = $scope.viewData.policyInfo.planName;

    // set selected customer name for reference
    var customer = UserService.customer();
    customer.name = $scope.viewData.clientDetails.policyOwnerName;
    UserService.customer(customer);

    $state.go(to, {
      policyNo: $scope.viewData.policyInfo.policyNo,
      // **for credit card
      creditCardInfo: creditCardInfo,
      // **
      userInfo: userInfo,
      originalPolicies: $scope.viewData.originalPolicies,
      directCreditAcctInfo: $scope.viewData.directCreditAcctInfo,
      // Payment
      clientDetails: $scope.viewData.clientDetails,
      customerID: $scope.viewData.clientDetails.idNo,
      stampDuty: detailsInfo.policyInfo.stampDuty,
      // top up & fund switching
      investmentPortfolio: $scope.viewData.investmentPortfolio,
      policyInfo: $scope.viewData.policyInfo,
      myLifePlanner: $scope.viewData.myLifePlanner,
      productType: $scope.viewData.policyInfo.productType,
    });
  };

  $scope.tab = 0;
  $scope.updateTab = function(tab) {
    $scope.tab = tab;
  };


  $scope.showPayment = function showPayment() {
    return PolicyService.canDoPayment($scope.viewData);
  };

  $scope.showFooter = function() {
    $scope.viewData.showMore = !$scope.viewData.showMore;
    if (!$scope.viewData.showMore)
      $scope.viewData.filterLength = $scope.transactions.length;
    else
      $scope.viewData.filterLength = 4;
  }

});