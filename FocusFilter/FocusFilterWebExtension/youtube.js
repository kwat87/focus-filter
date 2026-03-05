"use strict";
(() => {
  const SHORTS_SELECTORS = [
    "ytd-reel-shelf-renderer",
    "ytd-rich-section-renderer[is-shorts]",
    "ytd-reel-item-renderer",
    "ytd-rich-shelf-renderer[is-shorts]",
    "ytd-reel-video-renderer",
    'a[href*="/shorts/"]',
    'ytm-reel-shelf-renderer',
    'ytm-shorts-lockup-view-model',
    '.reel-shelf-items'
  ];
  const SELECTOR = SHORTS_SELECTORS.join(",");

  function showBlockedPage() {
    document.title = "Blocked by FocusFilter";
    document.body.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#666">' +
      '<div style="text-align:center"><h2>YouTube Shorts blocked</h2>' +
      '<p>Blocked by FocusFilter</p>' +
      '<a href="https://www.youtube.com" style="color:#065fd4">Go to YouTube home</a></div></div>';
  }

  function handleNavigation() {
    if (location.pathname.startsWith("/shorts")) {
      showBlockedPage();
      return true;
    }
    return false;
  }

  function removeShortsElements() {
    for (const el of document.querySelectorAll(SELECTOR)) {
      el.remove();
    }
  }

  if (handleNavigation()) return;

  let debounceTimer;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (!handleNavigation()) removeShortsElements();
    }, 100);
  });

  function start() {
    removeShortsElements();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start);
})();
