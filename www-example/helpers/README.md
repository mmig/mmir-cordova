directory for (optional) helper implementations

each controller `thecontroller.js` may have (optionally) one helper `thecontrollerHelper.js`
(i.e. the file name for the helper is the same as the controller's, but with the additional postfix `Helper`).

The implementing class in the file must have the same name as the file, but with an upper case first letter:

```javascript
     var ThecontrollerHelper = function(){};
     ....
```
