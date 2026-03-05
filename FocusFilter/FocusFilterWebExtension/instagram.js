"use strict";
(() => {
  const REELS_SELECTORS = [
    'a[href*="/reels"]',
    'a[href*="/reel/"]',
    'div[data-testid="reels-tray"]',
    '[aria-label="Reels"]'
  ];
  const SELECTOR = REELS_SELECTORS.join(",");

  function showBlockedPage() {
    document.title = "Blocked by FocusFilter";
    document.body.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#666">' +
      '<div style="text-align:center"><h2>Instagram Reels blocked</h2>' +
      '<p>Blocked by FocusFilter</p>' +
      '<a href="https://www.instagram.com" style="color:#0095f6">Go to Instagram home</a></div></div>';
  }

  function handleNavigation() {
    if (location.pathname.startsWith("/reels") || location.pathname.startsWith("/reel/")) {
      showBlockedPage();
      return true;
    }
    return false;
  }

  function removeReelsElements() {
    for (const el of document.querySelectorAll(SELECTOR)) {
      el.remove();
    }
  }

  if (handleNavigation()) return;

  let debounceTimer;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (!handleNavigation()) removeReelsElements();
    }, 100);
  });

  function start() {
    removeReelsElements();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start);
})();
