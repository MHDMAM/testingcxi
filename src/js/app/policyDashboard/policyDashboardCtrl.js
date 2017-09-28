angular.module('app.controllers')

.controller('PolicyDashboardCtrl', function($scope, $state, $ionicSlideBoxDelegate, $ionicHistory, PopulatedVluesService, TransactionsService, dashInfo) {
  if (!dashInfo) return;

  // $scope.viewData = dashInfo;
  $scope.viewData = _.cloneDeep(dashInfo);
  $scope.filters = {
    filter: null,
    search: '',
  };
  var originalPolicies = _.cloneDeep($scope.viewData.policyRecord.policyInfo);

  function updateSlider(data) {
    if (data.length === 0)
      return $scope.viewData.policyRecord.policyInfo = [];

    $scope.viewData.policyRecord.policyInfo = TransactionsService.splitDataForSlider(data);
    $ionicSlideBoxDelegate.update();

    $ionicSlideBoxDelegate.slide(0, 0);
  }

  updateSlider($scope.viewData.policyRecord.policyInfo);

  function performFilterSearch() {
    var newArr = [];
    var premiumStatus = [];
    var policyStatus = [];
    switch ($scope.filters.filter) {
      case 0: // inforece
        policyStatus = ['IF'];
        break;
      case 1: // Inactive
        premiumStatus = ['AC', 'CE', 'CF', 'CI', 'DH', 'EX', 'MA', 'SU', 'TA', 'TB', 'TP', 'MT', 'NF']
        break;
      case 2: // lapsed 
        policyStatus = ['LA'];
        break;
      case 3: // POLA stupids Awaiting Reneal status.
        policyStatus = ['RR', 'AR', 'MR', 'PN', 'PR'];
        break;
    }

    _.each(originalPolicies, function(item) {
      var searchCond = ($scope.filters.search == '') || item.insuredName.toLowerCase().indexOf($scope.filters.search.toLowerCase()) >= 0;
      var filterCond = true;
      if (policyStatus.length != 0)
        filterCond = ($scope.filters.filter == null) || policyStatus.indexOf(item.policyStatusCode) >= 0;
      else if (premiumStatus.length != 0)
        filterCond = ($scope.filters.filter == null) || premiumStatus.indexOf(item.premiumStatusCode) >= 0;
      if (searchCond && filterCond) {
        newArr.push(item);
      }
    });

    updateSlider(newArr);
  }

  $scope.search = function() {
    performFilterSearch();
  };

  $scope.$watch('filters.filter', function(nv, ov) {
    performFilterSearch();

  }, true);

  $scope.populatedVals = {
    filter: PopulatedVluesService.getDashboardFilters(),
  };

  $scope.goDetails = function() {
    $ionicHistory.clearCache();
    $state.go('policyDetails', {
      policyNo: this.plan.policyNo,
      originalPolicies: originalPolicies,
    });
  };
});