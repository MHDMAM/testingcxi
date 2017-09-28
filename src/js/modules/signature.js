angular.module("signature.tpls", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/signaturePad.html", "<ion-modal-view><ion-header-bar class=bar-stable><h1 class=title>Add Signature</h1></ion-header-bar><ion-content scroll=false><div class=\"card list\"><div class=\"item item-body\">Please use your finger or stylus to sign below</div><canvas id=signature-canvas style=\"width: 100%; max-height: 200px;\" class=\"padding-horizontal item\"></canvas><div class=\"item item-checkbox\"><label class=checkbox><input type=checkbox ng-model=signaturePadModel.signatureConfirm></label> I accept the signature above</div></div><div class=\"button-bar padding\"><button ng-click=\"clear(); signatureModal.hide()\" class=button>Cancel</button><button ng-click=clear() class=button>Clear</button><button ng-disabled=\"!(signaturePadModel.signatureConfirm &amp;&amp; signature)\" ng-click=save() class=\"button button-stable\">Accept</button></div></ion-content></ion-modal-view>");
  $templateCache.put("templates/signaturePadButton.html", "<div><a ng-hide=signature ng-click=openSignatureModal() class=\"button button-clear button-stable button-small tap-here-icon\">Tap to sign</a><div ng-show=signature><p><a ng-click=openSignatureModal() class=\"button button-clear button-stable button-small\">Edit Signature</a></p><img ng-src={{signature}} style=\"width:100%; width: 100%; background-color: gainsboro; -webkit-box-shadow: inset 9px 9px 11px -12px rgba(82,82,82,1); -moz-box-shadow: inset 9px 9px 11px -12px rgba(82,82,82,1); box-shadow: inset 9px 9px 11px -12px rgba(82,82,82,1);\"></div></div>");
}]);

// required: bower install signature_pad
angular.module('signature', ['signature.tpls'])
  .directive('tnfSignaturePad', function($ionicModal) {
    var canvas = null,
      ratio = 1.0;

    return {
      scope: {
        signature: '=ngModel'
      },
      link: function($scope, $element, $attrs, $controller) {
        $scope.signaturePadModel = {};

        $ionicModal.fromTemplateUrl('templates/signaturePad.html', {
          animation: 'slide-in-up',
          scope: $scope,
        }).then(function(modal) {
          $scope.signatureModal = modal;
        });

        $scope.$on('$destroy', function() {
          $scope.signatureModal.remove();
        });

        $scope.openSignatureModal = function() {
          $scope.signatureModal.show();
          canvas = angular.element($scope.signatureModal.modalEl).find('canvas')[0];

          $scope.signaturePad = new SignaturePad(canvas, {
            backgroundColor: '#FFF',
            minWidth: 1,
            maxWidth: 1.5,
            dotSize: 3,
            penColor: 'rgb(66, 133, 244)',
            onEnd: function() {
              $scope.signature = $scope.signaturePad.toDataURL();
            }
          });

          if ($scope.signature) {
            // $scope.signaturePad.fromDataURL($scope.signature);
            $scope.signature = null;
          }
          $scope.resizeCanvas();
        };

        $scope.resizeCanvas = function() {
          var ratio = 1.0;
          canvas.width = canvas.offsetWidth * ratio;
          canvas.height = canvas.offsetHeight * ratio;
          canvas.getContext('2d').scale(ratio, ratio);
        };

        $scope.clear = function() {
          $scope.signaturePadModel.signatureConfirm = false;
          $scope.signaturePad.clear();
          $scope.signature = null;
        };

        $scope.save = function() {
          $scope.signaturePadModel = {};
          $scope.signatureModal.hide();
        };
      },
      require: 'ngModel',
      replace: true,
      restrict: 'EA',
      templateUrl: function(element, attrs) {
          return attrs.templateUrl || 'templates/signaturePadButton.html';
        }
        // templateUrl: 'templates/signaturePadButton.html'
    };
  })