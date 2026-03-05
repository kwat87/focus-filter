"use strict";
(() => {
  const REELS_SELECTORS = [
    'a[href*="/reels"]',
    'a[href*="/reel/"]',
    'div[data-testid="reels-tray"]',
    '[aria-label="Reels"]'
  ];
  const SELECTOR = REELS_SELECTORS.join(",");

  let isShowingBlockedPage = false;

  function isBlockedPath() {
    return location.pathname.startsWith("/reels") || location.pathname.startsWith("/reel/");
  }

  function showBlockedPage() {
    if (isShowingBlockedPage) return;
    isShowingBlockedPage = true;
    observer && observer.disconnect();
    function doBlock() {
      document.title = "Blocked by FocusFilter";
      document.body.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#666">' +
        '<div style="text-align:center"><h2>Instagram Reels blocked</h2>' +
        '<p>Blocked by FocusFilter</p>' +
        '<button onclick="window.location.replace(\'https://www.instagram.com\')" style="color:#0095f6;background:none;border:none;cursor:pointer;font-size:16px;text-decoration:underline">Go to Instagram home</button></div></div>';
    }
    if (document.body) doBlock();
    else document.addEventListener("DOMContentLoaded", doBlock);
  }

  function handleNavigation() {
    if (isBlockedPath()) {
      showBlockedPage();
      return true;
    }
    return false;
  }

  function hideReelsElements() {
    for (const el of document.querySelectorAll(SELECTOR)) {
      if (!el.classList.contains("ff-hidden")) {
        el.style.setProperty("display", "none", "important");
        el.classList.add("ff-hidden");
      }
    }
  }

  if (isBlockedPath()) {
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
      if (!handleNavigation()) hideReelsElements();
    }, 100);
  });

  function start() {
    hideReelsElements();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start);
})();
