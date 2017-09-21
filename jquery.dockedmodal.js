/*
    A simple docked jQuery modal 
    Version 1.0.0
    https://github.com/reinrl/jquery-dockedmodal
    (based on https://github.com/kylefox/jquery-modal)
*/

;(function (factory) {
  // Making your jQuery plugin work better with npm tools
  // http://blog.npmjs.org/post/112712169830/making-your-jquery-plugin-work-better-with-npm
  if(typeof module === "object" && typeof module.exports === "object") {
    factory(require("jquery"), window, document);
  }
  else {
    factory(jQuery, window, document);
  }
}(function($, window, document, undefined) {

  var focusableElementsString = "a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]";
  
  var modals = [],
      getCurrent = function() {
        return modals.length ? modals[modals.length - 1] : null;
      },
      selectCurrent = function() {
        var i,
            selected = false;
        for (i=modals.length-1; i>=0; i--) {
          if (modals[i].$blocker) {
            modals[i].$blocker.toggleClass("current",!selected).toggleClass("behind",selected);
            selected = true;
          }
        }
      };

  $.dockedmodal = function(el, options) {
    var remove, target;
    this.$body = $("body");
    this.options = $.extend({}, $.dockedmodal.defaults, options);
    this.options.doFade = !isNaN(parseInt(this.options.fadeDuration, 10));
    this.$blocker = null;
    if (this.options.closeExisting)
      while ($.dockedmodal.isActive())
        $.dockedmodal.close(); // Close any open modals.
    modals.push(this);
    if (el.is("a")) {
      target = el.attr("href");
      //Select element by id from href
      if (/^#/.test(target)) {
        this.$elm = $(target);
        if (this.$elm.length !== 1) return null;
        this.$body.append(this.$elm);
        this.open();
      //AJAX
      } else {
        this.$elm = $("<div>");
        this.$body.append(this.$elm);
        remove = function(event, modal) { modal.elm.remove(); };
        this.showSpinner();
        el.trigger($.dockedmodal.AJAX_SEND);
        $.get(target).done(function(html) {
          if (!$.dockedmodal.isActive()) return;
          el.trigger($.dockedmodal.AJAX_SUCCESS);
          var current = getCurrent();
          current.$elm.empty().append(html).on($.dockedmodal.CLOSE, remove);
          current.hideSpinner();
          current.open();
          el.trigger($.dockedmodal.AJAX_COMPLETE);
        }).fail(function() {
          el.trigger($.dockedmodal.AJAX_FAIL);
          var current = getCurrent();
          current.hideSpinner();
          modals.pop(); // remove expected modal from the list
          el.trigger($.dockedmodal.AJAX_COMPLETE);
        });
      }
    } else {
      this.$elm = el;
      this.$body.append(this.$elm);
      this.open();
    }
  };

  $.dockedmodal.prototype = {
    constructor: $.dockedmodal,

    open: function() {
      var m = this;
      this.block();
      if(this.options.doFade) {
        setTimeout(function() {
          m.show();
        }, this.options.fadeDuration * this.options.fadeDelay);
      } else {
        this.show();
      }
      $(document).off("keydown.modal").on("keydown.modal", function(event) {
        var current = getCurrent();
        if (event.which == 27 && current.options.escapeClose) current.close();
      });
      if (this.options.clickClose)
        this.$blocker.click(function(e) {
          if (e.target==this)
            $.dockedmodal.close();
        });
    },

    close: function() {
      modals.pop();
      this.unblock();
      this.hide();
      if (!$.dockedmodal.isActive())
        $(document).off("keydown.modal");
    },

    block: function() {
      this.$elm.trigger($.dockedmodal.BEFORE_BLOCK, [this._ctx()]);
      if (this.options.scrollToTop) {
      	this.$body.css("overflow","hidden");
      }
      this.$blocker = $("<div class=\"jquery-modal blocker current\"></div>").appendTo(this.$body);
      selectCurrent();
      if(this.options.doFade) {
        this.$blocker.css("opacity",0).animate({opacity: 1}, this.options.fadeDuration);
      }
      this.$elm.trigger($.dockedmodal.BLOCK, [this._ctx()]);
    },

    unblock: function(now) {
      if (!now && this.options.doFade)
        this.$blocker.fadeOut(this.options.fadeDuration, this.unblock.bind(this,true));
      else {
        this.$blocker.children().appendTo(this.$body);
        this.$blocker.remove();
        this.$blocker = null;
        selectCurrent();
        if (!$.dockedmodal.isActive() && this.options.scrollToTop)
          this.$body.css("overflow","");
      }
    },

    show: function() {
      this.$elm.trigger($.dockedmodal.BEFORE_OPEN, [this._ctx()]);
      if (this.options.showClose) {
        this.closeButton = $("<a href=\"#close-modal\" rel=\"dockedmodal:close\" class=\"close-modal " + this.options.closeClass + "\">" + this.options.closeText + "</a>");
        this.$elm.append(this.closeButton);
      }
      this.$elm.addClass(this.options.modalClass).appendTo(this.$blocker);
      if(this.options.doFade) {
        this.$elm.css("opacity",0).show().animate({opacity: 1}, this.options.fadeDuration);
      } else {
        this.$elm.show();
      }
      this.$elm.trigger($.dockedmodal.OPEN, [this._ctx()]);
      
      if (this.options.elmDock) {
        var $elOpener = this.options.elmDock;
        var linkOffset = $elOpener.offset();
        var rightPos = $(window).width() - linkOffset.left - $elOpener.outerWidth();
        var topPos = linkOffset.top + $elOpener.outerHeight();
        if (!this.options.scrollToTop) {
            topPos = topPos - $(window).scrollTop();
        }
        // Horizontal position for tooltip
        this.$elm.css("right", rightPos);
        // Vertical position for tooltip
        this.$elm.css("top", topPos);
        // add class to make visible
        this.$elm.addClass(this.options.modalClass + "-visible");
      }
    },

    hide: function() {
      this.$elm.trigger($.dockedmodal.BEFORE_CLOSE, [this._ctx()]);
      if (this.closeButton) this.closeButton.remove();
      var _this = this;
      if(this.options.doFade) {
        this.$elm.fadeOut(this.options.fadeDuration, function () {
          _this.$elm.trigger($.dockedmodal.AFTER_CLOSE, [_this._ctx()]);
        });
      } else {
        this.$elm.hide(0, function () {
          _this.$elm.trigger($.dockedmodal.AFTER_CLOSE, [_this._ctx()]);
        });
      }
      // add class to make visible
      this.$elm.removeClass(this.options.modalClass + "-visible");
      this.$elm.trigger($.dockedmodal.CLOSE, [this._ctx()]);
    },

    showSpinner: function() {
      if (!this.options.showSpinner) return;
      this.spinner = this.spinner || $("<div class=\"" + this.options.modalClass + "-spinner\"></div>")
        .append(this.options.spinnerHtml);
      this.$body.append(this.spinner);
      this.spinner.show();
    },

    hideSpinner: function() {
      if (this.spinner) this.spinner.remove();
    },

    //Return context for custom events
    _ctx: function() {
      return {elm: this.$elm, $blocker: this.$blocker, options: this.options};
    }
  };

  $.dockedmodal.close = function(event) {
    if (!$.dockedmodal.isActive()) return;
    if (event) event.preventDefault();
    var current = getCurrent();
    current.close();
    return current.$elm;
  };

  // Returns if there currently is an active modal
  $.dockedmodal.isActive = function () {
    return modals.length > 0;
  };

  $.dockedmodal.getCurrent = getCurrent;

  $.dockedmodal.defaults = {
    closeExisting: true,
    escapeClose: true,
    clickClose: true,
    closeText: "Close",
    closeClass: "",
    modalClass: "dockedmodal",
    spinnerHtml: null,
    showSpinner: true,
    showClose: false,
    fadeDuration: null,   // Number of milliseconds the fade animation takes.
    fadeDelay: 1.0,       // Point during the overlay's fade-in that the modal begins to fade in (.5 = 50%, 1.5 = 150%, etc.)
    scrollToTop: false     // Keeps body overflow visible, body scrolling enabled, is set to true. Default is false.
  };

  // Event constants
  $.dockedmodal.BEFORE_BLOCK = "dockedmodal:before-block";
  $.dockedmodal.BLOCK = "dockedmodal:block";
  $.dockedmodal.BEFORE_OPEN = "dockedmodal:before-open";
  $.dockedmodal.OPEN = "dockedmodal:open";
  $.dockedmodal.BEFORE_CLOSE = "dockedmodal:before-close";
  $.dockedmodal.CLOSE = "dockedmodal:close";
  $.dockedmodal.AFTER_CLOSE = "dockedmodal:after-close";
  $.dockedmodal.AJAX_SEND = "dockedmodal:ajax:send";
  $.dockedmodal.AJAX_SUCCESS = "dockedmodal:ajax:success";
  $.dockedmodal.AJAX_FAIL = "dockedmodal:ajax:fail";
  $.dockedmodal.AJAX_COMPLETE = "dockedmodal:ajax:complete";

  $.fn.dockedmodal = function(options){
    if (this.length === 1) {      
      new $.dockedmodal(this, options);
    }
    return this;
  };

  // Automatically bind buttons and links with rel="dockedmodal:close" to, well, close the modal.
  $(document).on("click.modal", "button[rel~=\"dockedmodal:close\"]", $.dockedmodal.close);
  $(document).on("click.modal", "a[rel~=\"dockedmodal:close\"]", $.dockedmodal.close);
  $(document).on("click.modal", "a[rel~=\"dockedmodal:open\"]", function(event) {
    event.preventDefault();
    $(this).dockedmodal();
  });
  
  // Keep keyboard focus inside of currently active popup
  $(document).on("keydown", function(event) {
    if(modals.length && event.which == 9) {
      // If tab or shift-tab pressed
      var elementId = getCurrent().$elm[0].id;
      var el = document.getElementById(elementId);

      // Get list of all children elements in given object
      var popupItems = $(el).find("*");

      // Get list of focusable items
      var focusableItems = popupItems.filter(focusableElementsString).filter(":visible");

      // Get currently focused item
      var focusedItem = $(":focus");

      // Get the number of focusable items
      var numberOfFocusableItems = focusableItems.length;

      // Get the index of the currently focused item
      var focusedItemIndex = focusableItems.index(focusedItem);

      // If popup doesn't contain focusable elements, focus popup itself
      if (numberOfFocusableItems === 0) {
        $(el).focus();
        event.preventDefault();
      } else {
        if (event.shiftKey) {
          // Back tab
          // If focused on first item and user presses back-tab (or not yet focused in modal), go to the last focusable item
          if (focusedItemIndex === -1 || focusedItemIndex === 0) {
            focusableItems.get(numberOfFocusableItems - 1).focus();
            event.preventDefault();
          }

        } else {
          // Forward tab
          // If focused on the last item and user presses tab (or not yet focused in modal), go to the first focusable item
          if (focusedItemIndex === -1 || focusedItemIndex == numberOfFocusableItems - 1) {
            focusableItems.get(0).focus();
            event.preventDefault();
          }
        }
      }  
    }
  });
}));
