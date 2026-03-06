"use strict";
(() => {
  try { window.stop(); } catch (_) {}

  function showBlockedPage() {
    document.title = "Blocked by FocusFilter";
    document.body.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#666">' +
      '<div style="text-align:center"><h2>TikTok blocked</h2>' +
      '<p>Blocked by FocusFilter</p>' +
      '<button id="ff-home" style="color:#25f4ee;background:none;border:none;cursor:pointer;font-size:16px;text-decoration:underline">Leave this page</button></div></div>';
    document.getElementById("ff-home").addEventListener("click", () => {
      window.location.replace("https://www.google.com");
    });
  }

  if (document.body) {
    showBlockedPage();
  } else {
    document.addEventListener("DOMContentLoaded", showBlockedPage);
  }
})();
