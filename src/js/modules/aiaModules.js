angular.module('aiaModules', [])

.factory('NotificationService', function ($ionicPopup) {
  return {
    alert: function (args) {
      var alertPopup = $ionicPopup.alert({
        title: args.title || 'Connection Error',
        template: args.template || 'Sorry, please try again.',
        okText: args.okText || 'OK',
        okType: args.okType || 'button-stable button-major',
      });

      return alertPopup.then(function (res) {
        return res;
      });
    },

    confirm: function (args) {
      var alertPopup = $ionicPopup.confirm({
        title: args.title || 'Connection Error',
        template: args.template || 'Sorry, please try again.',
        okText: args.okText || 'OK',
        okType: /* args.okType || */ 'button-stable button-major',

        cancelText: args.cancelText || 'Cancel',
        cancelType: args.cancelType || 'button-calm button-major',
      });

      return alertPopup.then(function (res) {
        return res;
      });
    },
  };
})

.factory('BaseResourcesService', function ($q, $http, ServerUrls, SecurityService, UtilityService,
  AppMeta /*, $cordovaNetwork*/) {

  function getServerPublicKey(cb) {
    $http.get(ServerUrls.baseURI + ServerUrls.serverPublicKeyURL).then(function (response) {
      cb(null, response.data.KEY);
    }, function failure(err) {

      cb('Please try again later.');
    });
  }

  // Usage:
  //   var data = { 'first name': 'George', 'last name': 'Jetson', 'age': 110 }
  //   var querystring = EncodeQueryData(data)
  //
  function EncodeQueryData(data) {
    var ret = [];
    for (var d in data) {
      if (_.isObject(data[d]))
        ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(JSON.stringify(data[d])));
      else
        ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
    }

    return ret.join('&');
  }

  var _BaseResourcesService = {
    HttpCall: function HttpCall(data, url) {
      var promise = $q.defer();
      var sharedKey = null,
        publicKey = null,
        serverPublicKey = null;
      var waterfallArray = [
        // function checkConnection(callback) {
        //   if ($cordovaNetwork.isOffline())
        //     return callback('You should be online, Please check your internet connection.');
        //   callback();
        // },

        function getServerDHPublicKey(callback) {
          getServerPublicKey(function (err, key) {
            serverPublicKey = key;
            callback(err);
          });
        },

        function getSharedKey(callback) {
          aiaPlugin.getSharedKey(serverPublicKey, function success(obj) {
            // {sharedKey, publicKey}
            sharedKey = obj.sharedKey;
            publicKey = obj.publicKey;
            callback();
          }, function (err) {

            callback(err);
          });
        },
      ];

      async.series(waterfallArray, function callbackFn(err, result) {
        if (err)
          return promise.reject(err);

        var params = EncodeQueryData({
          cKey: publicKey,
          data: SecurityService.encrypt(sharedKey, {
            appVersionNo: AppMeta.version,
            deviceId: UtilityService.UUID(),
            data: data, // api spicific data
          }),

        });

        $http.post(ServerUrls.baseURI + url, params, {
          transformResponse: function (response, headersGetter, status) {
            var decryptedRes = SecurityService.decrypt(sharedKey, response);
            try {
              decryptedRes = JSON.parse(decryptedRes);
            } catch (_er) {} finally {
              return decryptedRes || null;
            }
          },
        }).then(function success(res) {
          if (res.data && _.parseInt(res.data.status) === 0) {
            if (res.data.data)
              return promise.resolve({
                res: res.data.data,
                msg: res.data.message,
              });
            return promise.resolve({}); // No data!!!
          } else if (res.data && res.data.message && _.parseInt(res.data.status) !== 0)
            return promise.reject(res.data.message);
          else return promise.reject('Please try again, something went wrong!');
        }, function failure(err) {

          return promise.reject('Please try again, something went wrong!');
        });
      });

      return promise.promise;
    },

    HttpCall2: function HttpCall2(data, url) {
      var promise = $q.defer();
      var sharedKey = null,
        publicKey = null,
        serverPublicKey = null;
      var waterfallArray = [
        // function checkConnection(callback) {
        //   if ($cordovaNetwork.isOffline())
        //     return callback('You should be online, Please check your internet connection.');
        //   callback();
        // },

        function getServerDHPublicKey(callback) {
          getServerPublicKey(function (err, key) {
            serverPublicKey = key;
            callback(err);
          });
        },

        function getSharedKey(callback) {
          aiaPlugin.getSharedKey(serverPublicKey, function success(obj) {
            // {sharedKey, publicKey}
            sharedKey = obj.sharedKey;
            publicKey = obj.publicKey;
            callback();
          }, function (err) {

            callback(err);
          });
        },
      ];

      async.series(waterfallArray, function callbackFn(err, result) {
        if (err)
          return promise.reject(err);

        var params = EncodeQueryData({
          cKey: publicKey,
          data: SecurityService.encrypt(sharedKey, data),

        });

        $http.post(ServerUrls.baseURI + url, params, {
          transformResponse: function (response, headersGetter, status) {
            var decryptedRes = SecurityService.decrypt(sharedKey, response);
            try {
              decryptedRes = JSON.parse(decryptedRes);
            } catch (_er) {} finally {
              return decryptedRes || null;
            }
          },
        }).then(function success(res) {
          if (res.data && res.data.respHeader && res.data.respHeader.respInfo &&
            res.data.respHeader.respInfo.length > 0 &&
            _.parseInt(res.data.respHeader.respInfo[0].respCode) === 0) {

            if (res.data.respBody)
              return promise.resolve({
                res: res.data.respBody,
                msg: res.data.respHeader.respInfo[0].respDesc,
              });
            return promise.resolve({}); // No data!!!
          } else if (res.data && res.data.respHeader && res.data.respHeader.respInfo &&
            res.data.respHeader.respInfo.length > 0 &&
            _.parseInt(res.data.respHeader.respInfo[0].respCode) !== 0 &&
            res.data.respHeader.respInfo[0].respDesc)

            return promise.reject(res.data.respHeader.respInfo[0].respDesc);
          else return promise.reject('Please try again, something went wrong!');
        }, function failure(err) {

          return promise.reject('Please try again, something went wrong!');
        });
      });

      return promise.promise;
    },

    HttpNoEnc: function HttpNoEnc(data, url) {
      // return _BaseResourcesService.HttpCall2(data, url);
      var promise = $q.defer();
      var params = EncodeQueryData({
        cKey: '123',
        data: data,
      });

      $http.post(ServerUrls.baseURI + url, params).then(function success(res) {
        if (res.data && res.data.respHeader && res.data.respHeader.respInfo &&
          res.data.respHeader.respInfo.length > 0 &&
          _.parseInt(res.data.respHeader.respInfo[0].respCode) === 0) {

          if (res.data.respBody)
            return promise.resolve({
              res: res.data.respBody,
              msg: res.data.respHeader.respInfo[0].respDesc,
            });
          return promise.resolve({}); // No data!!!
        } else if (res.data && res.data.respHeader && res.data.respHeader.respInfo &&
          res.data.respHeader.respInfo.length > 0 &&
          _.parseInt(res.data.respHeader.respInfo[0].respCode) !== 0 &&
          res.data.respHeader.respInfo[0].respDesc)

          return promise.reject(res.data.respHeader.respInfo[0].respDesc);
        else return promise.reject('Please try again, something went wrong!');
      }, function failure(err) {

        return promise.reject('Please try again, something went wrong!');
      });

      return promise.promise;
    },

    HttpGet: function HttpNoEnc(data, url) {
      var promise = $q.defer();

      $http.get(url).then(function success(res) {
        if (res.data && res.data.respHeader && res.data.respHeader.respInfo &&
          res.data.respHeader.respInfo.length > 0 &&
          _.parseInt(res.data.respHeader.respInfo[0].respCode) === 0) {

          if (res.data.respBody)
            return promise.resolve({
              res: res.data.respBody,
              msg: res.data.respHeader.respInfo[0].respDesc,
            });
          return promise.resolve({}); // No data!!!
        } else if (res.data && res.data.respHeader && res.data.respHeader.respInfo &&
          res.data.respHeader.respInfo.length > 0 &&
          _.parseInt(res.data.respHeader.respInfo[0].respCode) !== 0 &&
          res.data.respHeader.respInfo[0].respDesc)

          return promise.reject(res.data.respHeader.respInfo[0].respDesc);
        else return promise.reject('Please try again, something went wrong!');
      }, function failure(err) {

        return promise.reject('Please try again, something went wrong!');
      });

      return promise.promise;
    },
  };
  return _BaseResourcesService;
})

.factory('UtilityService', function ($ionicHistory, BroadcastService) {
  var _UUID = null;

  return {
    cleanDom: function () {
      $ionicHistory.clearHistory();
      $ionicHistory.clearCache();
      $ionicHistory.nextViewOptions({
        disableBack: true,
      });
    },

    toBoolean: function (val) {
      return (val.toLowerCase() === 'true');
    },

    UUID: function (uuid) {
      if (uuid)
        return _UUID = uuid;
      return _UUID;
    },

    parseRoundFloat: function parseRoundFloat(num) {
      var tmp = Math.round(parseFloat(num) * 100) / 100;
      if (_.isNaN(tmp))
        tmp = 0;
      return tmp;
    },

    toDecimalDisplay: function toDecimalDisplay(input) {
      if (!input) return 0;
      return numeral(input).format('0,0.00');
    },

  };
})

.factory('SecurityService', function (AppMeta) {
  function randomIV() {
    var text = '';
    var possible = '0123456789ABCDEF';

    var array = new Uint32Array(16);
    window.crypto.getRandomValues(array);

    for (var i = 0; i < array.length; i++) {
      text += possible.charAt(array[i] % 15);
    }

    return text;
  }

  function decryption(v, k) {
    var ivsTmp = v.substring(0, 16);
    v = v.substring(16);

    var key = CryptoJS.enc.Utf8.parse(k),
      ivs = CryptoJS.enc.Utf8.parse(ivsTmp);

    var data = CryptoJS.AES.decrypt(v, key, {
      iv: ivs,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return data.toString(CryptoJS.enc.Utf8);
  }

  function encryption(v, k) {
    var key = CryptoJS.enc.Utf8.parse(k),
      tmpIvs = randomIV(),
      ivs = CryptoJS.enc.Utf8.parse(tmpIvs),
      enco = CryptoJS.AES.encrypt(v, key, {
        iv: ivs,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

    return tmpIvs.concat(enco.toString());
  }

  // #END Decryption & Encryption

  return {
    encrypt: function (key, value) {
      return encryption(JSON.stringify(value), key);
    },

    decrypt: function (key, value) {
      try {
        return decryption(value, key);
      } catch (_e) {
        console.log(_e);
        return null;

      }
    },

    encryptUserData: function (key, value) {
      // Encrypt
      return CryptoJS.AES.encrypt(value, key).toString();
    },

    decryptUserData: function (key, value) {
      // Decrypt
      var bytes = CryptoJS.AES.decrypt(value, key);
      var plaintext = bytes.toString(CryptoJS.enc.Utf8);
      if (!_.isNull(plaintext) || !_.isEmpty(plaintext))
        return JSON.parse(plaintext);
      return null;
    },

    /*
      << Flags: >>
        -1: wipe data.
        eval(allowedOfflinePeriod-diff): notify user. (between 20-30).
        100: all good.
      */

    shouldChangePassword: function (userData) {
      var now = moment();
      var lastOnline = userData.lastOnline || now.unix();
      lastOnline = _.parseInt(lastOnline);
      var diff = now.diff(moment.unix(lastOnline), 'd');
      if (diff >= AppMeta.allowedOfflinePeriod) { // wipe data :D
        return -1;
      }

      if (diff >= AppMeta.notifyUserOfflinePeriod) { // notify user :/
        return AppMeta.allowedOfflinePeriod - diff;
      } else { // good user :@ :/ ..... :P
        return 100;
      }
    },

    getRandomNumber: function () {
      return window.crypto.getRandomValues(new Uint32Array(1))[0] / 0x100000000;
    },
  };
})

.factory('ValidationService', function (UserService, appValues) {

  var passwordValidation = {
    /*
    • Password Complexity Must be alphanumeric and meets the following criteria:
    • At least 1 Non-alphabetic character (i.e. numeric or special character)       √
    • Non dictionary words                                                          (not implamented, don't have dectionary to to validate)
    • Non derivative of the user-ID                                                 √
    • Non common character sequences (i.e. 123456)
    • Non repeating characters (i.e. AAAAAAAA)                                      √
      ------------------------------------ */

    // -------------------------------------------------------
    // an algorithm for finding substrings in strings.
    // ref: http://en.wikipedia.org/wiki/Boyer%E2%80%93Moore%E2%80%93Horspool_algorithm

    // return false if found any substrings otherwise true

    boyer_moore_horspool: function boyer_moore_horspool(haystack, needle) {
      var badMatchTable = {};
      var maxOffset = haystack.length - needle.length;
      var offset = 0;
      var last = needle.length - 1;
      var scan;

      // Generate the bad match table, which is the location of offsets
      // to jump forward when a comparison fails
      _.each(needle, function (char, i) {
        badMatchTable[char] = last - i;
      });

      // Now look for the needle
      while (offset <= maxOffset) {
        // Search right-to-left, checking to see if the current offset at
        // needle and haystack match.  If they do, rewind 1, repeat, and if we
        // eventually match the first character, return the offset.
        for (scan = last; needle[scan] === haystack[scan + offset]; scan--) {
          if (scan === 0) {
            return true;
          }
        }

        offset += badMatchTable[haystack[offset + last]] || last;
      }

      return false;
    },

    hasUserID: function hasUserID(str) {
      var thisObj = this;
      var agentCode = UserService.user.userId();
      if (!agentCode || agentCode.length === 0) // just coz it breaks sometimes without a clear reason.
        return false;

      for (i = 0; i < str.length - agentCode.length + 1; i++) {
        var phrase = str.substr(i, agentCode.length);
        var found = thisObj.boyer_moore_horspool(agentCode, phrase);
        if (found) return found;
      }

      if (agentCode.length < 10) return false; // nothing to check!
      var newAgentCode = agentCode.substring(5);
      for (i = 0; i < str.length - newAgentCode.length + 1; i++) {
        var phrase = str.substr(i, newAgentCode.length);
        var found = thisObj.boyer_moore_horspool(newAgentCode, phrase);
        if (found) return found;
      }

      return false;
    },

    // repeating characters (i.e. AAAAAAAA)
    isRepeatedLetters: function isRepeatedLetters(str) {
      var patt = /^([a-z])\1+$/;
      var result = patt.test(str);
      return result;
    },

    // str.length should be >= 8.
    // at less 1 CAP latter.
    // at less 1 Number.
    checkPassword: function checkPassword(str) {
      return (/^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])[a-zA-Z0-9!@#$%^&*]{8,}$/).test(str);
    },

  };

  var policyRegExp = {
    // regexp policy# validation:
    // accepted:
    Az09Twice_five09_Az09Once: new RegExp('[A-z0-9]{2}[0-9]{5}[A-z0-9]{1}$'),
    nine09: new RegExp('[0-9]{9}$'),
    Az09Twice_five09_Az09Once_09Twice: new RegExp('[A-z0-9]{2}[0-9]{5}[A-z0-9]{1}[0-9]{2}$'),

    // rejected:
    FTJ0_9six_Az09Once_09TwiceOptinal: new RegExp('[fFtTjJ]{1}[0-9]{6}[A-z0-9]{1}(:?[0-9]{2})?$'),
    Az09_09six_Az09Once_09TwiceOptinal: new RegExp('[A-z0-9]{2}[0-9]{6}[A-z0-9]{1}(:?[0-9]{2})?$'),
  };

  return {
    checkNewPassword: function (pass, agentCode) {
      return passwordValidation.checkPassword(pass) && !passwordValidation.hasUserID(pass, agentCode) && !passwordValidation.isRepeatedLetters(pass);
    },

    validatePolicyNumber: function validatePolicyNumber(value) {
      return (
        policyRegExp.Az09Twice_five09_Az09Once.test(value) ||
        policyRegExp.nine09.test(value) ||
        policyRegExp.Az09Twice_five09_Az09Once_09Twice.test(value) &&
        (!policyRegExp.FTJ0_9six_Az09Once_09TwiceOptinal.test(value) ||
          !policyRegExp.Az09_09six_Az09Once_09TwiceOptinal.test(value)));

    },

    validateAddress: function (name) {
      var gi = appValues.validationRestriction.addressNotAllowed;
      if (!name) return;
      return name.replace(/[^a-z\s]/gi, '');
    },
    // validate CC luhn algorithm.
    validateCreditCard: function luhnChk(a) {
      return function (c) {
        for (var l = c.length, b = 1, s = 0, v; l;) v = parseInt(c.charAt(--l), 10), s += (b ^= 1) ? a[v] : v;
        return s && 0 === s % 10;
      };
    }([0, 2, 4, 6, 8, 1, 3, 5, 7, 9]),
  };
})

.factory('SqlService', function (UserService) {
  return {
    wipeData: function () {},
  };
})

// Directives:
.directive('icFormat', function () {
  var REGEX = /^\d{6}-\d{2}-\d{4}$/;

  return {
    require: 'ngModel',
    link: function (scope, element, attrs, ctrl) {
      ctrl.$validators.format = function (modelValue, viewValue) {
        if (REGEX.test(viewValue)) {
          return true;
        }

        return false;
      };

      var formating = function (inputValue) {
        if (!inputValue) return;
        var formated = inputValue;
        if ((/^\d{6}$/).test(formated))
          formated += '-';

        if ((/^\d{6}-\d{2}$/).test(formated))
          formated += '-';

        if (formated !== inputValue) {
          ctrl.$setViewValue(formated);
          ctrl.$render();
        }

        return formated;
      };

      ctrl.$parsers.push(formating);
      formating(scope[attrs.ngModel]); // formating initial value
    },
  };
})

.directive('aiaAgentcode', function ($parse) {
  return {
    require: 'ngModel',
    link: function (scope, element, attrs, ctrl) {
      ctrl.$viewChangeListeners.push(function () {
        element.on('blur', function () {
          if (ctrl.$modelValue && ctrl.$modelValue.length > 0 && ctrl.$modelValue.length < 10) {
            $parse(attrs.ngModel).assign(scope, ('0000000000' + ctrl.$modelValue.toUpperCase()).slice(-10));
            scope.$apply();
          }
        });
      });
    },
  };
})

// checking inputs
.directive('validateAddress', function (appValues) {
  return {
    require: 'ngModel',
    scope: {
      ngModel: '=',
    },
    link: function (scope, element, attr, ctrl) {
      function fromUser(text) {
        var transformedInput = text.replace(appValues.validationRestriction.addressNotAllowed, '');
        if (transformedInput !== text) {
          ctrl.$setViewValue(transformedInput);
          ctrl.$render();
        }

        return transformedInput;
      }

      ctrl.$parsers.push(fromUser);
    },
  };
})

.directive('icNodashes', function (appValues) {
  return {
    require: 'ngModel',
    link: function (scope, element, attrs, ctrl) {
      ctrl.$validators['ic-nodashes'] = function (modelValue, viewValue) {
        if (!viewValue) return false;
        return appValues.validationRestriction.numbers.test(viewValue);
        // return (/^[a-zA-Z0-9]+$/g).test(viewValue);
      };
    },
  };
})

.directive('aiaUsername', function (appValues) {
  return {
    require: 'ngModel',
    link: function (scope, element, attr, ctrl) {
      function fromUser(text) {
        var transformedInput = text.replace(appValues.validationRestriction.nameNotAllowed, '');
        if (transformedInput !== text) {
          ctrl.$setViewValue(transformedInput);
          ctrl.$render();
        }

        return transformedInput;
      }

      ctrl.$parsers.push(fromUser);
    },
  };
})

.directive('numbers', function () {
  return {
    require: 'ngModel',
    link: function (scope, element, attr, ctrl) {
      function fromUser(text) {
        var transformedInput = text.replace(/(\D+)|(\s)/, '');
        if (transformedInput !== text) {
          ctrl.$setViewValue(transformedInput);
          ctrl.$render();
        }

        return transformedInput;
      }

      ctrl.$parsers.push(fromUser);
    },
  };
})

.directive('alphNums', function (appValues) {
  return {
    require: 'ngModel',
    link: function (scope, element, attr, ctrl) {
      function fromUser(text) {
        var transformedInput = text.replace(appValues.validationRestriction.alphNums, '');
        if (transformedInput !== text) {
          ctrl.$setViewValue(transformedInput);
          ctrl.$render();
        }

        return transformedInput;
      }

      ctrl.$parsers.push(fromUser);
    },
  };
})

.directive('capitalize', function () {
  return {
    require: 'ngModel',
    link: function (scope, element, attrs, modelCtrl) {
      var capitalize = function (inputValue) {
        if (inputValue == undefined) inputValue = '';
        var capitalized = inputValue.toUpperCase();
        if (capitalized !== inputValue) {
          modelCtrl.$setViewValue(capitalized);
          modelCtrl.$render();
        }

        return capitalized;
      };

      modelCtrl.$parsers.push(capitalize);
      capitalize(scope[attrs.ngModel]); // capitalize initial value
    },
  };
})

// validation:
.directive('email', function (appValues) {
  return {
    require: 'ngModel',
    link: function (scope, element, attrs, ctrl) {
      ctrl.$validators['email'] = function (modelValue, viewValue) {
        if (!viewValue) return false;
        return appValues.validationRestriction.email.test(viewValue);
      };
    },
  };
})

.directive('ccValidation', function (ValidationService) {
  return {
    require: 'ngModel',
    link: function (scope, element, attrs, ctrl) {
      ctrl.$validators['cc-validation'] = function (modelValue, viewValue) {
        if (!viewValue) return false;
        return ValidationService.validateCreditCard(viewValue);
      };
    },
  };
})

.directive('aiaPassword', function (ValidationService) {
  return {
    require: 'ngModel',
    link: function (scope, element, attrs, ctrl) {
      ctrl.$validators.aiapassword = function (modelValue, viewValue) {
        if (!viewValue) return false;
        return ValidationService.checkNewPassword(viewValue);
      };
    },
  };
})

.directive('passwordComparison', function () {
  return {
    require: 'ngModel',
    scope: {
      otherModelValue: '=passwordComparison',
    },
    link: function (scope, element, attrs, ctrl) {
      ctrl.$validators['password-equals'] = function (modelValue, viewValue) {
        if (!viewValue) return false;
        return (viewValue === scope.otherModelValue);
      };
    },
  };
})

.directive('crsTinValidation', function () {
  return {
    require: 'ngModel',
    scope: {
      otherModelValue: '=crsTinValidation',
    },
    link: function (scope, element, attrs, ctrl) {
      ctrl.$parsers.unshift(function (tinVlaue) {
        if (!scope.otherModelValue || !tinVlaue) return false;
        var valid = scope.otherModelValue.test(tinVlaue);
        ctrl.$setValidity('crsTinValidation', valid);

        return tinVlaue;
      });
      // ctrl.$validators['crsTinValidation'] = function(modelValue, viewValue) {
      //   if (!viewValue) return false;
      //   if(!scope.otherModelValue) return false;
      //   if(scope.otherModelValue === true) return true;
      //   return scope.otherModelValue.test(viewValue);
      // };
    },
  };
})

.directive('policynumberValidation', function (ValidationService) {
  return {
    require: 'ngModel',
    link: function (scope, element, attrs, ctrl) {
      ctrl.$validators['policynumber-validation'] = function (modelValue, viewValue) {
        if (!viewValue) return false;
        return ValidationService.validatePolicyNumber(viewValue);
      };
    },
  };
})

.directive('aiaIncremental', function () {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      initval: '=initVal',
      maxval: '=maxVal',
      myupdate: '&',
    },
    controller: function controller($scope, $element, $attrs) {
      // $scope.maxval = 12 / $scope.maxval;
      // if ($scope.maxval === 3) $scope.maxval = 4;
      var maxval = 12 / $scope.maxval;
      if (maxval === 3) $scope.maxval = 4;

      if (!$scope.initval) $scope.initval = 0;

      $scope.inc = function () {
        if ($scope.initval < $scope.maxval)
          $scope.initval += 1;
      };

      $scope.dec = function () {
        if ($scope.initval > 0)
          $scope.initval -= 1;
      };

      $scope.$watch('initval', function (nv, ov) {
        // console.log('initval', nv, ov);
        $scope.myupdate();
      }, true);
    },

    controllerAs: 'ctrl',
    template: '<div class="incremental-wrapper">' +
      '<div class="incremental-sign-container min" ng-click="dec()"><span class="button button-icon icon ion-minus"></span></div>' +
      '<div class="incremental-text-container">{{initval}}</div>' +
      '<div class="incremental-sign-container" ng-click="inc()"><span class="button button-icon icon ion-plus"></span></div>' +
      '</div>',
  };
})

.directive('ccDateValidation', function () {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, elem, attr, ngModel) {
      ngModel.$validators['cc-date-validation'] = function (modelValue, viewValue) {
        var now = moment();
        var expiry = moment(viewValue);
        var daysBetween = expiry.diff(now, 'days');
        //console.log(viewValue + ', ' + (daysBetween > 30));

        //ngModel.$setValidity('cc-date-validation', daysBetween > 30);
        return daysBetween > 30;
      };
    },
  };
})

.directive('removeCharacters', function ($timeout) {
  return {
    require: 'ngModel',
    scope: {
      removeSet: '=removeSet',
    },
    link: function (scope, element, attr, ctrl) {
      if (!scope.removeSet) return;
      function fromUser(text) {
        var transformedInput = text.replace(scope.removeSet, '');
        if (transformedInput !== text) {
          ctrl.$setViewValue(transformedInput);
          ctrl.$render();
        }

        return transformedInput;
      }

      ctrl.$parsers.push(fromUser);
    },
  };
})

// filters
.filter('aiadate', function () {

  return function (input, format) {
    if (!input) return 'N/A';
    format = format || 'DD MMM YYYY';
    // return moment(Date(input)).format(format);
    var date = new Date(input);
    date = date.toISOString();
    return moment(date).format(format);
  };

})

.filter('duepay', function () {

  return function (input) {
    if (!input) return 'N/A';
    var txt = ' Paid ';
    input = _.parseInt(input);
    switch (input) {
      case 1:
        // return txt + 'Monthly';
        return txt + 'Yearly';
        break;
      case 2:
        return txt + 'Half-yearly';
        break;
      case 4:
        return txt + 'Quarterly';
        break;
      case 12:
        // return txt + 'Yearly';
        return txt + 'Monthly';
        break;

      default:
        return 'N/A';
    }

  };

})

.filter('duedatenumbertotext', function () {

  return function (input) {
    if (!input) return 'N/A';
    input = _.parseInt(input);
    switch (input) {
      case 0:
      case 1:
        return 'Yearly';
      case 2:
        return 'Half-yearly';
      case 4:
        return 'Quarterly';
      case 12:
        return 'Monthly';

      default:
        return 'N/A';
    }

  };

})

.filter('payment', function () {

  return function (input) {
    if (!input || !input.lineOfBiz) return;
    var pa = 'inclusive of stamp duty and GST RM ';
    var la = 'inclusive of GST RM ';
    var gst = input.gstAmount;
    if (input.reinstatementOutstandingAmount != 0)
      gst = input.reinstatementOutstandingGSTAmount;
    if (input.lineOfBiz.toLowerCase().indexOf('pa') >= 0)
      return pa + gst;
    return la + gst;
  };
})

.filter('paymentSimple', function () {

  return function (input) {
    if (!input) return;
    var pa = 'inclusive of stamp duty and GST RM ';
    var la = 'inclusive of GST RM ';
    var gst = input.gstAmount;
    if (input.lineOfBiz && input.lineOfBiz.toLowerCase().indexOf('pa') >= 0)
      return pa + gst;
    return la + gst;
  };
})

.filter('lineofbiztotext', function () {

  return function (input) {
    if (!input) return;
    switch (input.toLowerCase()) {
      case 'la':
        return 'Life Insurance';

      case 'laft':
        return 'Takaful';

      case 'pa':
        return 'General Insurance';

      default:
        return input;
    }

  };

})

.filter('fix2', function (UtilityService) {

  return function (input) {
    if (!input) return 0;
    return UtilityService.parseRoundFloat(input).toFixed(2);
  };

})

.filter('aiadecimal', function (UtilityService) {

  return function (input) {
    return UtilityService.toDecimalDisplay(input);
  };

})

.filter('filterbypolicycode', function (UtilityService, TransactionsService) {

  return function (policies, showStatusCode) {
    if (!policies || policies && policies.length == 0) return;
    if (!showStatusCode) return policies;

    var status = [];
    switch (showStatusCode) {
      case 0:
        status = ['IF'];
        break;
      case 1:
        status = ['SU'];
        break;
      case 2:
        status = ['LA'];
        break;

      default:
        return null;
    }

    policies = _.flatten(policies);
    var tmp = _.filter(policies, function (item) {
      return status.indexOf(item.policyStatusCode) >= 0;
    });

    return TransactionsService.splitDataForSlider(policies);
  };

})

.filter('phonemask', function () {

  return function (phone) {
    if (!phone || phone.length === 0) return 'N/A';
    var leadDigits = 4;
    var tailDigits = 3;

    if (leadDigits + tailDigits > phone.length) return 'N/A';
    // throw 'phone number is too short!'

    var masked = '';
    var length = phone.length;

    if (phone.charAt(0) === '+')
      leadDigits++;

    for (var i = 0; i < length; i++) {
      if (i <= (leadDigits - 1) || i >= (length - tailDigits)) {
        masked += phone.charAt(i);
      } else {
        masked += 'X';
      }
    }

    return masked;
  };
})

.filter('countrycode', function (PopulatedVluesService) {
  var countriesList = PopulatedVluesService.getCRSCountries();

  return function (input) {
    if (!input) return 'N/A';
    var tmp = _.find(countriesList, function (item) {
      return item.countryCode === input;
    });

    if (tmp) return tmp.country;
    return 'N/A';
  };

})
.filter('countrykey', function (PopulatedVluesService) {
  var countriesList = PopulatedVluesService.getCRSCountries();

  return function (input) {
    if (!input) return 'N/A';
    var tmp = _.find(countriesList, function (item) {
      return item.key === input;
    });

    if (tmp) return tmp.country;
    return 'N/A';
  };

});
