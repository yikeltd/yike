/** Dismiss #yike-boot-splash — backup for cached HTML shells. */
(function () {
  var MAX = 2600;
  var done = false;

  function isTwa() {
    try {
      return document.referrer.indexOf("android-app://") === 0;
    } catch {
      return false;
    }
  }

  function isApp() {
    try {
      if (isTwa()) return true;
      if (window.matchMedia("(display-mode: standalone)").matches) return true;
      if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
      if (window.matchMedia("(display-mode: minimal-ui)").matches) return true;
      if (window.navigator.standalone) return true;
    } catch {
      /* ignore */
    }
    return false;
  }

  function htmlDone() {
    document.documentElement.classList.remove("yike-boot-splash-enabled");
    document.documentElement.classList.add("yike-boot-splash-disabled");
  }

  function hide() {
    if (done) return;
    var s = document.getElementById("yike-boot-splash");
    if (!s) {
      htmlDone();
      done = true;
      return;
    }
    done = true;
    htmlDone();
    s.classList.add("yike-boot-splash--out");
    setTimeout(function () {
      if (s && s.parentNode) s.parentNode.removeChild(s);
    }, 280);
  }

  function showRecovery() {
    if (done) return;
    var s = document.getElementById("yike-boot-splash");
    if (s) s.classList.add("yike-boot-splash--recovery");
  }

  function bind() {
    var c = document.getElementById("yike-boot-continue");
    var r = document.getElementById("yike-boot-refresh");
    if (c) c.addEventListener("click", hide, { once: true });
    if (r) {
      r.addEventListener(
        "click",
        function () {
          window.location.reload();
        },
        { once: true }
      );
    }
  }

  function removeNow() {
    var s = document.getElementById("yike-boot-splash");
    if (s) s.remove();
    htmlDone();
  }

  function boot() {
    if (!isApp()) {
      document.documentElement.classList.add("yike-web-mode");
      removeNow();
      return;
    }
    document.documentElement.classList.add("yike-app-mode");
    document.documentElement.classList.add("yike-boot-splash-enabled");
    bind();
    setTimeout(showRecovery, 2300);
    setTimeout(hide, isTwa() ? 1200 : 1500);
    setTimeout(hide, MAX);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
  window.addEventListener(
    "pageshow",
    function () {
      setTimeout(hide, MAX);
    },
    { once: true }
  );
})();
