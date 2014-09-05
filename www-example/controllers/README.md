directory for controller implementations


Each controller ´thecontroller.js´ can have one or more views (`*.ehtml`) in
```
views/thecontroller/
```

For each controller

 1. the file name for a controller _must_ start with a lower case letter
 1. the file should only contain the controller implementation (i.e. no additional classes etc.)
 1. the controller class _must_ have the same name as the file, except that its name starts with an upper case letter
 1. the controller _must_ have a function `on_page_load()` specified:<br>
    this function will be called each time a view of this controller was loaded (i.e. similar to page load event).

---

Example

In file `purchase.js` the controller should at least have a constructor and the `on_page_load()` function defined

```javascript

    var Purchase = function(){
    	//initialize ...
    };
    
    Purchase.prototype.on_page_load(){
    	//do something after a view was loaded
    };
```    

The following function are similar to `on_page_load`, but _optional_:
 
 * for each view, a specific page-load function may be defined:<br>
   `on_page_loag_[view name]()`
   <br>In difference to `on_page_load()`, this function will only be called, if
   this specific view was loaded (while `on_page_load()` is called every time,
   any view of the controller is loaded)
 * a function `before_page_load()`:<br>
   similar to `on_page_load()`, this function will be called for each view of the controller,
   but before the view is actually loaded.

```javascript
    ...
    Purchase.prototype.before_page_load(){
    	//do something BEFORE a view will be loaded
    };
    
    Purchase.prototype.on_page_load_viewA(){
    	//do something after view "viewA" is loaded
    };
    
    Purchase.prototype.on_page_load_viewB(){
    	//do something after view "viewB" is loaded
    };
    ...
    
```