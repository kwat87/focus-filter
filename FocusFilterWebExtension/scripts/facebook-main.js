"use strict";
(function() {
  var blocked = ["/watch", "/reel/", "/reels", "/share/v/", "/share/r/"];
  function isBlocked(url) {
    try {
      var p = new URL(url, location.origin).pathname;
      return blocked.some(function(b) { return p.startsWith(b); });
    } catch(e) { return false; }
  }
  var origPush = history.pushState;
  history.pushState = function() {
    if (arguments[2] && isBlocked(String(arguments[2]))) {
      window.dispatchEvent(new CustomEvent("focusfilter-blocked"));
      return;
    }
    return origPush.apply(this, arguments);
  };
  var origReplace = history.replaceState;
  history.replaceState = function() {
    if (arguments[2] && isBlocked(String(arguments[2]))) {
      window.dispatchEvent(new CustomEvent("focusfilter-blocked"));
      return;
    }
    return origReplace.apply(this, arguments);
  };
})();
