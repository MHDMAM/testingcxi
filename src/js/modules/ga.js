/**
 * googleAnalytics Module
 *
 * Description
 */
angular.module('googleAnalytics', ['ngCordova'])
  .factory('ga', function($cordovaGoogleAnalytics, $log, AppMeta) {
    return {
      init: function() {
        try {
          $cordovaGoogleAnalytics.startTrackerWithId(AppMeta.gaAccount);
        } catch (ga_err) {
          $log.error(ga_err);
        }
      },
      trackView: function(viewName) {
        $cordovaGoogleAnalytics.trackView(viewName);
      },
      trackEvent: function(category, action, label, value) {
        $cordovaGoogleAnalytics.trackEvent(category, action, label, value);
      }
    };
  });