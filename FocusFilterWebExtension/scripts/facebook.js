"use strict";
(() => {
  const BLOCKED_PATHS = ["/watch", "/reel/", "/reels", "/share/v/", "/share/r/"];
  const BLOCKED_LINK_RE = /\/(reel\/|watch|reels|share\/[vr]\/)/;

  const NAV_SELECTORS = [
    'a[href*="/watch"]',
    'a[href*="/reel/"]',
    'a[href*="/reels"]',
    'a[href*="/share/v/"]',
    'a[href*="/share/r/"]',
    'div[data-pagelet="WatchFeed"]',
    'div[data-pagelet*="Reel"]',
    'div[aria-label="Reels"]',
    '[aria-label="Watch"]'
  ];

  const NAV_SELECTOR = NAV_SELECTORS.join(",");

  function isBlockedPath(pathname) {
    return BLOCKED_PATHS.some(p => pathname.startsWith(p));
  }

  function showBlockedPage() {
    document.title = "Blocked by FocusFilter";
    document.body.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#666">' +
      '<div style="text-align:center"><h2>Facebook Watch/Reels blocked</h2>' +
      '<p>Blocked by FocusFilter</p>' +
      '<a href="https://www.facebook.com" style="color:#1877f2">Go to Facebook home</a></div></div>';
  }

  function handleNavigation() {
    if (isBlockedPath(location.pathname)) {
      showBlockedPage();
      return true;
    }
    return false;
  }

  // Walk up from an element to find the feed post that contains it.
  // Strategy: try known selectors, then look for the feed container
  // (role="feed" or data-pagelet="FeedPage") and return the child
  // that contains our element. Final fallback: walk up looking for
  // a node whose parent has 3+ children (feed-list level).
  function findPostContainer(el) {
    const known = el.closest('div[data-pagelet^="FeedUnit"], div[role="article"]');
    if (known) return known;

    // Find the feed container and return the direct child branch
    const feed = el.closest('div[role="feed"]');
    if (feed) {
      let node = el;
      while (node && node.parentElement !== feed) {
        node = node.parentElement;
      }
      if (node && node.parentElement === feed) return node;
    }

    // Fallback: walk up until parent has 3+ children (skip nested wrappers)
    let node = el;
    while (node && node !== document.body) {
      const parent = node.parentElement;
      if (parent && parent.children.length >= 3) {
        return node;
      }
      node = parent;
    }
    return null;
  }

  // Pages where video removal should apply (feed-based pages only)
  const FEED_PATHS = ["/", "/home.php", "/home"];

  function isOnFeed() {
    const p = location.pathname;
    return FEED_PATHS.includes(p) || p === "";
  }

  function removeElements() {
    // Remove nav-level elements everywhere
    for (const el of document.querySelectorAll(NAV_SELECTOR)) {
      el.remove();
    }

    // Walk up from any blocked link and remove the post (everywhere)
    for (const link of document.querySelectorAll(
      'a[href*="/share/v/"], a[href*="/share/r/"], a[href*="/reel/"], a[href*="/watch"]'
    )) {
      const post = findPostContainer(link);
      if (post) post.remove();
      else link.remove();
    }

    // Only remove video posts on the News Feed, not marketplace/groups/etc.
    if (isOnFeed()) {
      for (const video of document.querySelectorAll("video")) {
        const post = findPostContainer(video);
        if (post) post.remove();
        else video.remove();
      }
    }
  }

  // Listen for blocked navigations from the main-world script
  window.addEventListener("focusfilter-blocked", showBlockedPage);
  window.addEventListener("popstate", () => handleNavigation());

  // Click interception in capture phase
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[href]");
    if (link) {
      try {
        const url = new URL(link.href, location.origin);
        if (url.origin === location.origin && isBlockedPath(url.pathname)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          showBlockedPage();
        }
      } catch (_) {}
    }
  }, true);

  // URL polling fallback
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      handleNavigation();
    }
  }, 500);

  if (handleNavigation()) return;

  let debounceTimer;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (!handleNavigation()) removeElements();
    }, 100);
  });

  function start() {
    removeElements();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start);
})();
