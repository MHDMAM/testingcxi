# fusion-messages  [![GitHub version](https://badge.fury.io/gh/corinna000%2Ffusion-messages.svg)](http://badge.fury.io/gh/corinna000%2Ffusion-messages)
===

A friendly wrapper for [ngMessages](https://docs.angularjs.org/api/ngMessages/directive/ngMessages).

This directive address a few usability issues with `ngMessages`.

1. `ngMessages` displays all of the error messages for all input fields. `fusionMessages` only displays an error if the field is dirty or if the form has been submitted.
2. `ngMessages` requires you pass the `$error` object manually. `fusionMessages` will look this up from the input name.
3. `fusionMessages` provides and imperative mechanism for adding validation messages. Helpful for importing third-party validator messages.

## Usage

1. `bower install fusion-messages` (_coming soon!_)
2. add `fusion-messages.jpg` script to your application
3. add `fusionMessages` as a module dependency for your application

### Basic Usage

`fusionMessages` wraps `ngMessages`. At minimum you can use it to add friendlier message behavior:

````html
<form name="myForm">
  <label for="myEmail">Email Address: </label>
  <input type="email" name="myEmail" ng-model="model.email" required>
  <div fus-messages="myForm.myEmail">
    <div ng-message="required">Field Required</div>
    <div ng-message="email">Invalid Email</div>
  </div>
</form>
````

### Supplying default messages via a controller

With `fusMessagesDefaults` directive you can assign default messages for an entire form at once.

````html
<script>
  app.controller('MainCtrl', function ($scope) {
      $scope.errorMsgs = {
        'required' : 'field is required',
        'email' : 'invalid email address'
      }
  });
</script>
<form name="myForm" fus-messages-defaults="errorMsgs">
  <label for="myEmail">Email Address: </label>
  <input type="email" name="myEmail" ng-model="model.email" required>
  <div fus-messages="myForm.myEmail"></div>
</form>
````
## Testing

Install all the project dependencies with `npm install` and `bower install` and run `npm test`.
