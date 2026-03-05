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

  let isShowingBlockedPage = false;

  function showBlockedPage() {
    if (isShowingBlockedPage) return;
    isShowingBlockedPage = true;
    observer && observer.disconnect();
    function doBlock() {
      document.title = "Blocked by FocusFilter";
      document.body.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#666">' +
        '<div style="text-align:center"><h2>YouTube Shorts blocked</h2>' +
        '<p>Blocked by FocusFilter</p>' +
        '<button onclick="window.location.replace(\'https://www.youtube.com\')" style="color:#065fd4;background:none;border:none;cursor:pointer;font-size:16px;text-decoration:underline">Go to YouTube home</button></div></div>';
    }
    if (document.body) doBlock();
    else document.addEventListener("DOMContentLoaded", doBlock);
  }

  function handleNavigation() {
    if (location.pathname.startsWith("/shorts")) {
      showBlockedPage();
      return true;
    }
    return false;
  }

  function hideShortsElements() {
    for (const el of document.querySelectorAll(SELECTOR)) {
      if (!el.classList.contains("ff-hidden")) {
        el.style.setProperty("display", "none", "important");
        el.classList.add("ff-hidden");
      }
    }
  }

  if (location.pathname.startsWith("/shorts")) {
    try { window.stop(); } catch (_) {}
    showBlockedPage();
    document.addEventListener("DOMContentLoaded", () => {
      if (!isShowingBlockedPage) showBlockedPage();
      else if (document.body && !document.body.querySelector("button")) {
        isShowingBlockedPage = false;
        showBlockedPage();
      }
    });
    return;
  }

  let debounceTimer;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (!handleNavigation()) hideShortsElements();
    }, 100);
  });

  function start() {
    hideShortsElements();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start);
})();
