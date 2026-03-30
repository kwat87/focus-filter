"use strict";
(() => {
  const BLOCKED_PATHS = ["/watch", "/reel/", "/reel", "/reels", "/share/v/", "/share/r/", "/story.php", "/video"];
  const VIDEOS_RE = /\/videos\//;
  const BLOCKED_LINK_RE = /\/(reel\/|reel$|watch|reels|share\/[vr]\/|videos\/)/;

  const NAV_SELECTORS = [
    'a[href*="/watch"]',
    'a[href*="/reel/"]',
    'a[href*="/reels"]',
    'a[href*="/share/v/"]',
    'a[href*="/share/r/"]',
    'a[href*="/videos/"]',
    'a[href*="/video/"]',
    'a[href*="/story.php"]',
    'div[data-pagelet="WatchFeed"]',
    'div[data-pagelet*="Reel"]',
    'div[aria-label="Reels"]',
    '[aria-label="Watch"]'
  ];

  const NAV_SELECTOR = NAV_SELECTORS.join(",");

  function isBlockedPath(pathname) {
    if (pathname.startsWith("/marketplace")) return false;
    if (VIDEOS_RE.test(pathname)) return true;
    return BLOCKED_PATHS.some(p => pathname.startsWith(p));
  }

  let isShowingBlockedPage = false;

  function showBlockedPage() {
    if (isShowingBlockedPage) return;
    isShowingBlockedPage = true;
    observer && observer.disconnect();
    function doBlock() {
      document.title = "Blocked by FocusFilter";
      document.body.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#666">' +
        '<div style="text-align:center"><h2>Facebook Watch/Reels blocked</h2>' +
        '<p>Blocked by FocusFilter</p>' +
        '<button id="ff-home" style="color:#1877f2;background:none;border:none;cursor:pointer;font-size:16px;text-decoration:underline">Go to Facebook home</button></div></div>';
      document.getElementById("ff-home").addEventListener("click", () => {
        window.location.replace("https://www.facebook.com");
      });
    }
    if (document.body) {
      doBlock();
    } else {
      document.addEventListener("DOMContentLoaded", doBlock);
    }
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

  const HIDDEN = "ff-hidden";
  function hide(el) {
    if (!el.classList.contains(HIDDEN)) {
      el.style.setProperty("display", "none", "important");
      el.classList.add(HIDDEN);
    }
  }

  function isOnMarketplace() {
    return location.pathname.startsWith("/marketplace");
  }

  function removeElements() {
    if (isOnMarketplace()) return;

    // Nav elements (Watch/Reels links, pagelets, aria labels) are hidden
    // purely by CSS (body.ff-active scoped rules). Applying inline styles
    // via JS creates a MutationObserver feedback loop with React, causing
    // elements like the profile "Reels" tab to flash repeatedly.

    for (const link of document.querySelectorAll(
      'a[href*="/share/v/"], a[href*="/share/r/"], a[href*="/reel/"], a[href*="/watch"], a[href*="/videos/"], a[href*="/video/"], a[href*="/story.php"]'
    )) {
      const post = findPostContainer(link);
      hide(post || link);
    }

    if (isOnFeed()) {
      for (const video of document.querySelectorAll("video")) {
        const post = findPostContainer(video);
        hide(post || video);
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

  // Immediate check - block as early as possible
  if (isBlockedPath(location.pathname)) {
    try { window.stop(); } catch (_) {}
    showBlockedPage();
    document.addEventListener("DOMContentLoaded", () => {
      if (!isShowingBlockedPage) showBlockedPage();
      else if (document.body && !document.getElementById("ff-home")) {
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
      if (!handleNavigation()) removeElements();
    }, 100);
  });

  function start() {
    if (!isOnMarketplace()) document.body.classList.add("ff-active");
    removeElements();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start);
})();
