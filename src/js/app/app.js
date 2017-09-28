// Ionic app App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'app' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'app.services' is found in services.js
// 'app.controllers' is found in controllers.js
angular.module('app', ['ionic', 'app.controllers', 'app.services',
  'ngIdle',
  'ngMessages', 'fusionMessages',
  'pascalprecht.translate',
  'ngCordova',
  'googleAnalytics',

  'aiaModules',
  'signature',
  'templates',
  'ngAnimate',
  'checklist-model',
  'chart.js',
  'ngCordova',
])
  .run(function ($ionicPlatform, $log, $rootScope, $state, NotificationService, ga, Idle, PolicyService,
    ResourcesService, UtilityService, $cordovaDevice, BroadcastService, $ionicPopover, UserService, $ionicLoading, $ionicSideMenuDelegate) {
    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(false);
      }

      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }

      ga.init();

      if (typeof aiaPlugin !== 'undefined') {
        aiaPlugin.getDeviceId(function success(uuidObj) {
          var uuid = uuidObj.uuid;
          BroadcastService.uuid(uuid);
          UtilityService.UUID(uuid);
          console.log(uuid);

        }, function (err) {

          console.log('UUID error', err);
        });
      } else console.error('aiaPlugin not avilable');
    });

    // Idel:
    // start watching when the app runs. also starts the Keepalive service by default.
    Idle.watch();

    // check user idel:
    $rootScope.$on('IdleWarn', function (e, countdown) {
      // follows after the IdleStart event, but includes a countdown until the
      // user is considered timed out
      // the countdown arg is the number of seconds remaining until then.
      // you can change the title or display a warning dialog from here.
      // you can let them resume their session by calling Idle.watch()
      if ($state.current.name == 'login') { // <--- need to update.
        Idle.watch(); // run watcher again.
      }
    });

    $rootScope.$on('IdleTimeout', function () {
      // the user has timed out (meaning idleDuration + timeout has passed without any activity)
      // this is where you'd log them
      // $ionicLoading.hide();

      $ionicLoading.hide();

      NotificationService.alert({
        title: 'Session Timeout',
        template: 'Session timeout. Kindly log in again.',
      }).then(function () {
        UtilityService.cleanDom();

        Idle.watch(); // run watcher again.
        $state.go('login');
      });
    });

    function checkAppVer() {
      ResourcesService.appVer()
        .then(function success(data) {
          if (data && data.res && data.res.appVersionInfo) {
            var info = data.res.appVersionInfo;
            if (info.isMajor === 'M') {  // Maintenance mode.
              UtilityService.cleanDom();
              return $state.go('maintenancePage', {
                message: info.message || 'We are currently upgrading our services to serve you better.'
              });
            }
          }
        })
    }
    checkAppVer()
    $ionicPlatform.on('resume', function () {
      checkAppVer()
    });

    $rootScope.$on('$stateChangeError',
      function (event, toState, toParams, fromState, fromParams, error) {
        // this is required if you want to prevent the $UrlRouter reverting the URL to the previous valid location
        event.preventDefault();
        $ionicLoading.hide();
      });

    // logout
    $rootScope.logout = function () {
      UtilityService.cleanDom();
      $state.go('login');
    };

    // languages:
    $rootScope.selectedLang = {
      en: true,
      bm: false,
    };
    $rootScope.switchLang = function () {
      var _key = 'en';
      _.forEach($rootScope.selectedLang, function (value, key) {
        $rootScope.selectedLang[key] = !$rootScope.selectedLang[key];
        if ($rootScope.selectedLang[key])
          _key = key;
      });

      UserService.language[_key]();
    };

    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
      if (toState.name === 'search' || toState.name === 'resetPassword' || toState.name === 'transactionHistory') {
        $rootScope.showSideMenu = true;
        PolicyService.clearCache();
        UtilityService.cleanDom();
      } else $rootScope.showSideMenu = false;

      if (toState.name !== 'login' && toState.name !== 'resetPassword' && toState.name !== 'setPassword')
        $rootScope.showLogout = true;
      else $rootScope.showLogout = false;
    });


    // Side Menu

    $rootScope.openSideMenu = function () {
      $ionicSideMenuDelegate.$getByHandle('searchMenuDelegate').toggleLeft();
    };
  });
