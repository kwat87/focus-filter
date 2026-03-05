"use strict";
(() => {
  const BLOCKED_PATHS = ["/watch", "/reel/", "/reel", "/reels", "/share/v/", "/share/r/"];
  const VIDEOS_RE = /\/videos\//;
  const BLOCKED_LINK_RE = /\/(reel\/|reel$|watch|reels|share\/[vr]\/|videos\/)/;

  const NAV_SELECTORS = [
    'a[href*="/watch"]',
    'a[href*="/reel/"]',
    'a[href*="/reels"]',
    'a[href*="/share/v/"]',
    'a[href*="/share/r/"]',
    'a[href*="/videos/"]',
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
        '<button onclick="window.location.replace(\'https://www.facebook.com\')" style="color:#1877f2;background:none;border:none;cursor:pointer;font-size:16px;text-decoration:underline">Go to Facebook home</button></div></div>';
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

  // Inject pushState/replaceState interception into the page's main world.
  // Safari allows extension content scripts to inject <script> elements
  // that bypass the page's CSP.
  function injectMainWorldScript() {
    const script = document.createElement("script");
    script.textContent = `(function() {
      var blocked = ["/watch", "/reel/", "/reel", "/reels", "/share/v/", "/share/r/"];
      function isBlocked(url) {
        try {
          var p = new URL(url, location.origin).pathname;
          if (p.startsWith("/marketplace")) return false;
          if (/\/videos\//.test(p)) return true;
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
    })();`;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  }

  function findPostContainer(el) {
    const known = el.closest('div[data-pagelet^="FeedUnit"], div[role="article"]');
    if (known) return known;

    const feed = el.closest('div[role="feed"]');
    if (feed) {
      let node = el;
      while (node && node.parentElement !== feed) {
        node = node.parentElement;
      }
      if (node && node.parentElement === feed) return node;
    }

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

  function removeElements() {
    for (const el of document.querySelectorAll(NAV_SELECTOR)) {
      hide(el);
    }

    for (const link of document.querySelectorAll(
      'a[href*="/share/v/"], a[href*="/share/r/"], a[href*="/reel/"], a[href*="/watch"], a[href*="/videos/"]'
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

  // Listen for blocked navigations from the injected main-world script
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

  // Inject the main-world pushState interception
  try { injectMainWorldScript(); } catch (_) {}

  // Immediate check before body exists - block as early as possible
  if (isBlockedPath(location.pathname)) {
    try { window.stop(); } catch (_) {}
    try { document.documentElement.innerHTML = ""; } catch (_) {}
    showBlockedPage();
    // Also handle the case where window.stop didn't fully work
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
