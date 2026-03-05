"use strict";
(() => {
  function showBlockedPage() {
    document.title = "Blocked by FocusFilter";
    document.body.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#666">' +
      '<div style="text-align:center"><h2>TikTok blocked</h2>' +
      '<p>Blocked by FocusFilter</p>' +
      '<a href="https://www.google.com" style="color:#25f4ee">Leave this page</a></div></div>';
  }

  if (document.body) {
    showBlockedPage();
  } else {
    document.addEventListener("DOMContentLoaded", showBlockedPage);
  }
})();
