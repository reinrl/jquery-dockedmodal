A simple & lightweight method of displaying docked (visually tied to an element) modal windows with jQuery.

# Why another modal plugin?

Most plugins I've found try to do too much, and have specialized ways of handling photo galleries, iframes and video.  The resulting HTML & CSS is often bloated and difficult to customize.

By contrast, this plugin handles the two most common scenarios I run into

* displaying an existing DOM element
* loading a page with AJAX

and does so with as little HTML & CSS as possible.

# Installation

Use it the good old fashioned way of including the scripts & styles manually:

```html
<script src="jquery.dockedmodal.js" type="text/javascript" charset="utf-8"></script>
<link rel="stylesheet" href="jquery.dockedmodal.css" type="text/css" media="screen" />
```

_(You'll obviously need to include jQuery as well)._

**jQuery Requirements:** jQuery 1.7 is required.

# Opening

#### Method 1: Automatically attaching to links

The simplest approach is to add `rel="dockedmodal:open"` to your links and use the `href` attribute to specify what to open in the modal.

Open an existing DOM element by ID:

```html
<form id="login-form" class="dockedmodal">
  ...
</form>

<a href="#login-form" rel="dockedmodal:open">Login</a>
```

Load a remote URL with AJAX:

```html
<a href="login.html" rel="dockedmodal:open">Login</a>
```

#### Method 2: Manually

You can manually open a modal by calling the `.dockedmodal()` method on the element:

```html
<form id="login-form" class="dockedmodal">
  ...
</form>
```

```js
$('#login-form').dockedmodal();
```

You can also invoke `.dockedmodal()` directly on links:

```html
<a href="#ex5" data-dockedmodal>Open a DOM element</a>
<a href="ajax.html" data-dockedmodal>Open an AJAX modal</a>
```

```js
$('a[data-dockedmodal]').click(function(event) {
  $(this).dockedmodal();
  return false;
});
```

### Compatibility Fallback

You can provide a clean fallback for users who have JavaScript disabled by manually attaching the modal via the `data-dockedmodal` attribute. This allows you to write your links pointing to the `href` as normal (fallback) while enabling modals where JavaScript is enabled.

```html
<!-- By default link takes user to /login.html -->
<a href="/login.html" data-dockedmodal="#login-modal">Login</a>

<!-- Login modal embedded in page -->
<div id="login-modal" class="dockedmodal">
  ...
</div>

<!-- For browsers with JavaScript, open the modal. -->
<script>
  $(function() {
    $('a[data-dockedmodal]').on('click', function() {
      $($(this).data('modal')).dockedmodal();
      return false;
    });
  });
</script>
```

#### Fade Transitions

By default the overlay & window appear instantaneously, but you can enable a fade effect by specifying the `fadeDuration` option.

```js
$('a.open-dockedmodal').click(function(event) {
  $(this).dockedmodal({
    fadeDuration: 250
  });
  return false;
});
```

This will fade in the overlay and modal over 250 milliseconds _simultaneously._ If you want the effect of the overlay appearing _before_ the window, you can specify the `fadeDelay` option. This indicates at what point during the overlay transition the window transition should begin.

So if you wanted the window to fade in when the overlay's was 80% finished:

```js
$(elm).dockedmodal({
  fadeDuration: 250,
  fadeDelay: 0.80
});
```

Or, if you wanted the window to fade in a few moments after the overlay transition has completely finished:

```js
$(elm).dockedmodal({
  fadeDuration: 250,
  fadeDelay: 1.5
});
```

The `fadeDelay` option only applies when opening the modal. When closing the modal, both the modal and the overlay fade out simultaneously according to the `fadeDuration` setting.

Fading is the only supported transition.

# Closing

Because there can be only one modal active at a single time, there's no need to select which modal to close:

```js
$.dockedmodal.close();
```

Similar to how links can be automatically bound to open modals, they can be bound to close modals using `rel="dockedmodal:close"`:

```html
<a href="#close" rel="dockedmodal:close">Close window</a>
```

_(Note that modals loaded with AJAX are removed from the DOM when closed)._

# Checking current state

* Use `$.dockedmodal.isActive()` to check if a modal is currently being displayed.
* Use `$.dockedmodal.getCurrent()` to retrieve a reference to the currently active modal instance, if any.

# Options

These are the supported options and their default values:

```js
$.dockedmodal.defaults = {
  closeExisting: true,    // Close existing modals. Set this to false if you need to stack multiple modal instances.
  escapeClose: true,      // Allows the user to close the modal by pressing `ESC`
  clickClose: true,       // Allows the user to close the modal by clicking the overlay
  closeText: 'Close',     // Text content for the close <a> tag.
  closeClass: '',         // Add additional class(es) to the close <a> tag.
  showClose: true,        // Shows a (X) icon/link in the top-right corner
  modalClass: "dockedmodal",    // CSS class added to the element being displayed in the modal.
  spinnerHtml: null,      // HTML appended to the default spinner during AJAX requests.
  showSpinner: true,      // Enable/disable the default spinner during AJAX requests.
  fadeDuration: null,     // Number of milliseconds the fade transition takes (null means no transition)
  fadeDelay: 1.0          // Point during the overlay's fade-in that the modal begins to fade in (.5 = 50%, 1.5 = 150%, etc.)
};
```

# Events

The following events are triggered on the modal element at various points in the open/close cycle (see below for AJAX events).

```javascript
$.dockedmodal.BEFORE_BLOCK = 'dockedmodal:before-block';    // Fires just before the overlay (blocker) appears.
$.dockedmodal.BLOCK = 'dockedmodal:block';                  // Fires after the overlay (block) is visible.
$.dockedmodal.BEFORE_OPEN = 'dockedmodal:before-open';      // Fires just before the modal opens.
$.dockedmodal.OPEN = 'dockedmodal:open';                    // Fires after the modal has finished opening.
$.dockedmodal.BEFORE_CLOSE = 'dockedmodal:before-close';    // Fires when the modal has been requested to close.
$.dockedmodal.CLOSE = 'dockedmodal:close';                  // Fires when the modal begins closing (including animations).
$.dockedmodal.AFTER_CLOSE = 'dockedmodal:after-close';      // Fires after the modal has fully closed (including animations).
```

The first and only argument passed to these event handlers is the `modal` object, which has three properties:

```js
dockedmodal.$elm;       // Original jQuery object upon which modal() was invoked.
dockedmodal.options;    // Options passed to the modal.
dockedmodal.$blocker;   // The overlay element.
```

So, you could do something like this:

```js
$('#purchase-form').on($.dockedmodal.BEFORE_CLOSE, function(event, modal) {
  clear_shopping_cart();
});
```

# AJAX

## Basic support

jQuery Modal uses $.get for basic AJAX support. A simple spinner will be displayed by default (if you've included dockedmodal.css) and will have the class `dockedmodal-spinner`. If you've set the `modalClass` option, the spinner will be prefixed with that class name instead.

You can add text or additional HTML to the spinner with the `spinnerHtml` option, or disable the spinner entirely by setting `showSpinner: false`.

## Events

The following events are triggered when AJAX modals are requested.

```js
$.dockedmodal.AJAX_SEND = 'dockedmodal:ajax:send';
$.dockedmodal.AJAX_SUCCESS = 'dockedmodal:ajax:success';
$.dockedmodal.AJAX_FAIL = 'dockedmodal:ajax:fail';
$.dockedmodal.AJAX_COMPLETE = 'dockedmodal:ajax:complete';
```

The handlers receive no arguments. The events are triggered on the `<a>` element which initiated the AJAX modal.

## More advanced AJAX handling

It's a good idea to provide more robust AJAX handling -- error handling, in particular. Instead of accommodating the myriad [`$.ajax` options](http://api.jquery.com/jQuery.ajax/) jQuery provides, jquery-dockedmodal makes it possible to directly modify the AJAX request itself.

Simply bypass the default AJAX handling (i.e.: don't use `rel="dockedmodal"`)

```html
<a href="ajax.html" rel="ajax:dockedmodal">Click me!</a>
```

and make your AJAX request in the link's click handler. Note that you need to manually append the new HTML/modal in the `success` callback:

```js
$('a[rel="ajax:dockedmodal"]').click(function(event) {

  $.ajax({

    url: $(this).attr('href'),

    success: function(newHTML, textStatus, jqXHR) {
      $(newHTML).appendTo('body').dockedmodal();
    },

    error: function(jqXHR, textStatus, errorThrown) {
      // Handle AJAX errors
    }

    // More AJAX customization goes here.

  });

  return false;
});
```

Note that the AJAX response must be wrapped in a div with class <code>dockedmodal</code> when using the second (manual) method.

# Support

Unfortunately I am unable to provide free email support.

# License (MIT)

jQuery DockedModal is distributed under the [MIT License](Learn more at http://opensource.org/licenses/mit-license.php):

    Copyright (c) 2012 Kyle Fox

    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    "Software"), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to
    permit persons to whom the Software is furnished to do so, subject to
    the following conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
    LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
    OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
    WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
