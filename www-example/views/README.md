directory for views: for each controller, a sub-directory with the 
same name should be created which will contain the views for this controller

E.g. for controller implementation ```login.js```:

    views/login/welcome.ehtml
    views/login/registration.ehtml
    views/login/error.ehtml
    ...

In addition, each controller main have (optionally) one layout specified at 
 ```views/layout/[CONTROLLER NAME].ehtml```
 the controller's layout will be used as base-skeleton for each view of the controller
 (if no specific layout is specified, the default ```views/layout/application.ehtml```
  will be used)