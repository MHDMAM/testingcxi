angular.module('app')
  .config(function ($ionicConfigProvider) {
    // Enable native scrolling.
    $ionicConfigProvider.scrolling.jsScrolling(true);
    // Set max cache to 5 levels.
    // if some viwes need NOT to be saved use:
    // {{ion-view cache-view="false"}} // on the view itself.
    // or: {{cache: false}}
    // in routes -> stateProvider -> state.
    $ionicConfigProvider.views.maxCache(0);
  })
  .config(function ($translateProvider, AppMetaProvider) {
    // add translation table
    $translateProvider
    .translations('en', AppMetaProvider.$get().locals.en)
    .translations('ms', AppMetaProvider.$get().locals.ms)
      .useSanitizeValueStrategy('sanitize')
      .fallbackLanguage('en')
      .preferredLanguage('en');
  })
  .config(function (IdleProvider, KeepaliveProvider, AppMetaProvider) {
    // configure Idle settings
    IdleProvider.idle(60 * AppMetaProvider.$get().idleIn); // in seconds
    IdleProvider.timeout(5); // in seconds
    IdleProvider.keepalive(false); // in seconds
  });
