angular.module('app.services')

.factory('PopulatedVluesService', function(appValues) {

  function manipulateCountriesList(_arr, sortBy) {
    /*
        Sorting should be like:
          1- Malaysia.
          2- Singapore.
          3- Brunei Darussalam.
             ..
             ..
             ..
          n- ....... A-Z
      */
    var arr = _arr.slice();
    arr = _.sortBy(arr, [sortBy]);
    var tmp = _.remove(arr, function(item) {
      return item.key === 'MAL' || item.key === 'SGP' || item.key === 'BRU'
    });
    tmp = _.sortBy(tmp, [sortBy]);
    return [tmp[1], tmp[2], tmp[0]].concat(arr);
  }

  return {
    getStates: function getStates() {
      return appValues.states;
    },

    getCountries: function getCountries() {
      return manipulateCountriesList(appValues.countries, 'value');
    },

    getDashboardFilters: function() {
      return appValues.sortFilter;
    },

    getIssuedBanks: function() {
      return appValues.banks;
    },

    getBranches: function() {
      return appValues.branches;
    },

    getPaymentFrequencies: function() {
      return appValues.paymentFrequencies;
    },

    getUSstates: function() {
      return appValues.USstates;
    },

    getCRSCountries: function() {
      return manipulateCountriesList(appValues.countries, 'country');
    }
  };
});