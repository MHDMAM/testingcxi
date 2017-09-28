angular.module('app.services')

.factory('StorageService', function() {
  var APP_DATA = '_DaTa_';
  // DB looks like:
  // storage: {
  //   _DaTa_: {
  //     user1: '2q342421415',
  //     user2: 'dfgthetrr',
  //     user3: 'lkj345is',
  //   }
  // }

  function getData() {
    var data = localStorage.getItem(APP_DATA);
    return JSON.parse(data);
  }

  function setValue(key, value) {
    var data = getData();
    if (_.isNull(data))
      data = {};

    data[key] = value;
    data = JSON.stringify(data);
    localStorage.setItem(APP_DATA, data);
  }
  // return full user data.
  function getValue(id) {
    var data = getData();
    if (!data || !data[id]) return null;
    return data[id];
  }

  return {
    wipeData: function() {
      localStorage.removeItem(APP_DATA);
    },

    login: function(id) {
      return getValue(id);
    },

    signup: function(value, id) {
      setValue(id, value);
    },
  };
});