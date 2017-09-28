var exec = require("cordova/exec");

var AiaPlugin = function() {
  this.name = "AiaPlugin";
};


AiaPlugin.prototype.getSharedKey = function(serverPublicKey, successCallback, failureCallback) {
  exec(successCallback, failureCallback, "AiaPlugin", "encryptionKey", [serverPublicKey]);
};

AiaPlugin.prototype.getDeviceId = function(successCallback, failureCallback) {
  exec(successCallback, failureCallback, "AiaPlugin", "uuid", []);
};

module.exports = new AiaPlugin();