angular.module('app.services')

.factory('BroadcastService', function($rootScope) {
  var CONST = {
    uuid: 'UUID',
    paymentFailed:'PAYMENT_FAILED',
    paymentSuccess:'PAYMENT_SUCCESS'
  };

  function send(msg, data) {
    $rootScope.$broadcast(msg, data);
  };

  return {
    msgs: CONST,
    send: function(msg, data) {
      return send(msg, data);
    },
    uuid: function(data) {
      return send(CONST.uuid, data);
    },
    on: function(msg, cb) {
      return $rootScope.$on(msg, cb);
    },

    paymentFailed:function () {
      return send(CONST.paymentFailed)
    },

    paymentSuccess:function () {
      return send(CONST.paymentSuccess)
    },
  }
});