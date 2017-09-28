angular.module('app.services')

.factory('MedicalExaminationService', function($cordovaCamera, $log) {
  var options = {
    quality: 60,
    destinationType: Camera.DestinationType.DATA_URL,
    sourceType: Camera.PictureSourceType.CAMERA,
    encodingType: Camera.EncodingType.JPEG,
    // targetWidth: 1200,
    // targetHeight: 1200 * 1.414,
    saveToPhotoAlbum: false
  }

  function getPic() {

    return $cordovaCamera.getPicture(options)
      .then(function(imageData) {
        var newImg = 'data:image/jpeg;base64,' + imageData
        return newImg;
      }, function(err) {
        $log.log(err);
        throw err;
      })
  }

  return {
    scanDoc: getPic,
  }

});