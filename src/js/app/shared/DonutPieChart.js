angular.module('app.controllers')

.directive('donutPieChart', function() {
	return {
      scope: {
          pieChartLabels: '=',
          pieChartData: '=',
          pieChartDataset: '=',
          donutChartLabels: '=',
          donutChartData: '=',
          donutChartDataset: '=',
          chartSize: '@',
      },
      restrict : 'EA',
      transclude: true,
      templateUrl: 'templates/shared/donut-pie-chart.html',
      // bindToController: true,
      // controllerAs: 'ctrl',
      controller: function($scope, $element) {
        if(!$scope.pieChartLabels)
          $scope.pieChartLabels = [];
        if(!$scope.donutChartLabels)
          $scope.donutChartLabels = [];

        $scope.pieSize = $scope.chartSize * 0.6875;
        $scope.margin = '-87px !important';
        // $scope.margin = ($scope.chartSize / -0.404) + 'px !important';
      },
    }
});