directory for views: for each controller, a sub-directory with the 
same name should be created which will contain the views for this controller

E.g. for controller implementation ```login.js```:

    views/login/welcome.ehtml
    views/login/registration.ehtml
    views/login/error.ehtml
    views/login/~contextMenu.ehtml
    ...

In addition, each controller may have (optionally) one layout specified at 
 ```views/layouts/[CONTROLLER NAME].ehtml```
 the controller's layout will be used as base-skeleton for each view of the controller
 (if no controller-specific layout is defined, the default ```views/layouts/default.ehtml```
  will be used):
  
    views/layouts/default.ehtml              <- the default layout definition MUST exist
    views/layouts/home.ehtml                 <- a layout definition that will be used 
                                                for all views of controller "home"
  