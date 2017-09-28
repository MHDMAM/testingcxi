/*
 Tests the Fusion Messages directive that wraps `ngMessages` and provides a
 configuration directive.
 */
describe('Fusion Messages Directives', function () {

  beforeEach(module('fusionMessages'));

  describe('fus-messages', function () {

    var getEl, scope, $document;

    beforeEach(inject(function ($rootScope, $compile) {

      $document = angular.element(document);

      scope = $rootScope.$new();

      getEl = function (transcluded) {

        var el = angular.element(
            '<form name="fusForm">' +
            '<input type="email" name="fusEmail" ng-model="email" required>' +
            '<div fus-messages="fusForm.fusEmail"> ' + transcluded + '</div>' +
            '</form>'
        );

        el = $compile(el)(scope);
        scope.$digest();
        return el;
      };

    }));

    it('adds the ng-messages directive', function () {
      var el = getEl();
      var fm = jqLite(el).find('div').find('div');

      expect(fm.attr('ng-messages')).toBeDefined(true);
    });

    it('is hidden when there are no error', function () {
      var el = getEl();
      var fm = jqLite(el).find('div').find('div');

      expect(fm.hasClass('ng-hide')).toBe(true);
    });

    it('displays no error when the input field is not dirty', function () {
      var el = getEl('<div ng-message="required">input is required</div>');
      scope.$digest();
      var fm = jqLite(el).find('div').find('div');
      var required = fm.find('div');

      expect(angular.element(fm).hasClass('ng-hide')).toBe(true);
    });

    it('displays a custom error when the input field is dirty', function () {
      var el = getEl('<div ng-message="required">input is required</div>');
      var fm = jqLite(el).find('div').find('div');
      var required = fm.find('div');

      scope.fusForm.fusEmail.$setDirty();
      scope.$digest();

      expect(fm.hasClass('ng-hide')).toBe(false);
      expect(required.attr('ng-message')).toBeDefined();
      expect(required.text()).toEqual('input is required');
    });

    it('displays a custom error when the form is submitted', function () {
      var el = getEl('<div ng-message="required">input is required</div>');
      var fm = jqLite(el).find('div').find('div');
      var required = fm.find('div');

      scope.fusForm.$setSubmitted();
      scope.$digest();

      expect(fm.hasClass('ng-hide')).toBe(false);
      expect(required.attr('ng-message')).toBeDefined();
      expect(required.text()).toEqual('input is required');
    });

  });

  describe('fus-messages-defaults', function () {

    var getEl, scope, $document;

    beforeEach(inject(function ($rootScope, $compile) {

      $document = angular.element(document);
      scope = $rootScope.$new();
      scope.defaults = {
        'required' : 'default required message',
        'email' : 'default email message'
      };

      scope.$digest();

      getEl = function (transcluded) {

        var el = angular.element(
            '<form name="fusForm" fus-messages-defaults="defaults">' +
            '<input type="email" name="fusEmail" ng-model="email" required>' +
            '<div fus-messages="fusForm.fusEmail"> ' + transcluded + '</div>' +
            '</form>'
        );

        el = $compile(el)(scope);
        scope.$digest();
        return el;

      };
    }));

    it('uses a custom configuration', function () {
      var el = getEl();
      var fm = jqLite(el).find('div').find('div');
      var messages = jqLite(fm).find('div')[0];

      expect(jqLite(messages).text()).toEqual('default required message');
    });

    it('prioritizes custom messages over defaults', function () {
      var el = getEl('<div ng-message="required">custom message</div>');
      var fm = jqLite(el).find('div').find('div');
      var messages = jqLite(fm).find('div')[0];

      // field is required, display custom message
      expect(jqLite(messages).text()).toEqual('custom message');

      // satisfy the `required` validation, expect default email error
      scope.fusForm.fusEmail.$setViewValue('invalidEmail');
      scope.$digest();

      // lookup messages value
      messages = jqLite(fm).find('div')[0];
      expect(jqLite(messages).text()).toEqual('default email message');

    });

  });

});

function jqLite(element) {
  return angular.element(element);
}
