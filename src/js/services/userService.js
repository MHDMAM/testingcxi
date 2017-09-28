angular.module('app.services')

.factory('UserService', function($translate, $q, SecurityService, StorageService, AppMeta) {
  var _RECEIPTINFO = {};
  var _data = {
    nric: null,
    username: 'user name',
    branchName: 'KL Main',
    userId: 'h825580',
    // updates
    password: null,
    oldPasswords: [],
    lastLogin: null, // unix
    lastPasswordChange: null, // unix
    loginAttempts: 0, // no need to save it, session based.
    isLocked: false,
    // END
    loginStatus: {
      isActivation: false,
    },
    staffInfo: {
      // code: 
      // laCashierId: 
      // laftCashierId: 
      // polaCashierId: 
    },
    customer: {
      dob: null,
      nric: null,
      name: null,
    },
  };

  function getUserData(key) {
    key = key.toUpperCase();
    var userData = StorageService.login(key);
    if (!userData) throw 'Wrong Credentials';
    var data = SecurityService.decryptUserData(key, userData);
    _.assign(_data, data);
    _data.loginAttempts = _.parseInt(_data.loginAttempts);
    if (!_data.loginAttempts || _.isNaN(_data.loginAttempts))
      _data.loginAttempts = 0;
  }

  function checkUserAttemptions() {
    if (_data && _data.loginAttempts >= AppMeta.MaxLoginAttemps) {
      _data.isLocked = true;
      _data.loginAttempts = 0;
      updateUserInfo();
      return false;
    }
    return true;
  }


  function updateUserInfo() {
    var encData = SecurityService.encryptUserData(_data.userId.toUpperCase(), JSON.stringify(_data));
    StorageService.signup(encData, _data.userId.toUpperCase());
  }


  function hash(info) {
    return CryptoJS.SHA256(info).toString();
  }

  function canUsePassword(password) {
    var hased = hash(password)
    return (_data.oldPasswords.indexOf(hased) < 0);
  }

  function changeLanguage(langKey) {
    $translate.use(langKey);
  }

  function checkLastLogin() {
    _data.lastLogin = _.parseInt(_data.lastLogin) || moment().unix();

    var diff = moment().diff(moment.unix(_data.lastLogin), 'd');
    if (diff >= AppMeta.allowedOfflinePeriod) {
      _data.isLocked = true;
      _data.loginAttempts = 0;
      updateUserInfo();
      return 'Your account has been locked due to long time offline, Please reactivate again.';
    }
    return false;


  }

  return {
    activation: function(active) {
      if (!_.isUndefined(active))
        return _data.loginStatus.isActivation = active;
      return _data.loginStatus.isActivation;
    },

    customer: function(cust) {
      if (!cust)
        return _data.customer;
      if (!_data.customer) _data.customer = {};
      _data.customer.dob = cust.dob;
      _data.customer.nric = cust.nric;
      _data.customer.name = cust.name;
    },

    canUpdatePassword: function canUpdatePassword() {
      var lastPasswordChangedStr = _data.lastPasswordChange;
      var lastChanged = moment().subtract(2, 'd').unix(); // timestamp --unix format. -- init value 2 days ago if there no old vaule.
      if (lastPasswordChangedStr)
        lastChanged = _.parseInt(lastPasswordChangedStr)

      var diff = moment().diff(moment.unix(lastChanged), 'h');
      // if (_data.isLocked) return true;
      if (diff >= AppMeta.changePasswordPeriod)
        return true;
      updateUserInfo();
      return false;
    },
    staff: {
      get: function() {
        return _data.staffInfo;
      },
      set: function(info) {
        _data.staffInfo = info;
        updateUserInfo();
      }
    },
    user: {
      username: function(user) {
        if (user)
          return _data.username = user;
        return _data.username;
      },

      userId: function(id) {
        if (id)
          return _data.userId = id.toUpperCase();
        return _data.userId ? _data.userId.toUpperCase() : null;
      },

      init: function(obj) {
        // _data.password = obj.password;
        // _data.username = obj.name;
        _data.userId = obj.staffId.toUpperCase();
        // _data.nric = obj.nric;


      },

      user: function() {
        return {
          username: _data.username,
          branchName: _data.branchName,
          userId: _data.userId.toUpperCase(),
          nric: _data.nric,
        };
      },
    },

    language: {
      get: function() {
        return $translate.use();
      },

      bm: function() {
        changeLanguage('ms');
      },

      en: function() {
        changeLanguage('en');
      },
    },

    getReceiptInfo: function getReceiptInfo() {
      return _RECEIPTINFO;
    },

    setReceiptInfo: function setReceiptInfo(info) {
      _.assign(_RECEIPTINFO, info);
    },

    login: function(id, pass) {

      return new Promise(function(resolve, reject) {
        getUserData(id);
        if (!checkUserAttemptions()) reject('Account is locked, Activate again please.');
        try {
          if (_data.isLocked)
            return reject('Account is locked, Activate again please.');

          var lastLogin = checkLastLogin();
          if (lastLogin != false)
            reject(lastLogin); // lastLogin is a message
          _data.lastLogin = moment().unix();
          if (_data.password !== pass) {
            _data.loginAttempts++;
            updateUserInfo();
            return reject('Wrong Credentials');
          }
          if (_data.loginAttempts > 0) {
            _data.loginAttempts = 0; // reset number of attemps.
            updateUserInfo();
          }
          return resolve();
        } catch (_e) {
          return reject('Wrong Credentials');
          _data.loginAttempts++;
        }
        _data.loginAttempts++;
        return reject('Wrong Credentials');
      });

    },

    signup: function(userInfo) {
      if (!canUsePassword(userInfo.password)) throw 'This Password already Used';
      _data.branchName = userInfo.branchName;
      _data.username = userInfo.staffName;
      _data.password = userInfo.password;
      _data.lastLogin = _data.lastPasswordChange = moment().unix();
      _data.isLocked = false;

      _data.oldPasswords[_data.oldPasswords.length % 8] = hash(userInfo.password);
      updateUserInfo();
    },
  };
});