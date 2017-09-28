angular.module('app.services')

.factory('TransactionHistoryService', function(ResourcesService, $log) {
  return {
    loadDummy: function() {
      var history = [];
      for(var i=0; i<10; i++) {
        history.push({
          policyOwner: 'Rosita Binti Ramli',
          transactionId: '5640',
          transactionType: 'Make a payment',
          dateSubmitted: '31 October 2016',
        });
      }

      return history;
    }
  }
});