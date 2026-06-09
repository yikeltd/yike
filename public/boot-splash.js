/** Dismiss #yike-boot-splash — backup for cached HTML shells. */
(function () {
  var done = false;

  function isTwa() {
    try {
      return document.referrer.indexOf("android-app://") === 0;
    } catch (e) {
      return false;
    }
  }

  function isApp() {
    try {
      if (isTwa()) return true;
      if (window.matchMedia("(display-mode: standalone)").matches) return true;
      if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
      if (window.navigator.standalone) return true;
    } catch (e) {
      /* ignore */
    }
    return false;
  }

  function hide() {
    if (done) return;
    var s = document.getElementById("yike-boot-splash");
    if (!s) {
      setTimeout(hide, 32);
      return;
    }
    done = true;
    s.classList.add("yike-boot-splash--out");
    setTimeout(function () {
      s.remove();
    }, 280);
  }

  function removeNow() {
    var s = document.getElementById("yike-boot-splash");
    if (s) s.remove();
  }

  function boot() {
    if (!isApp()) {
      removeNow();
      return;
    }
    var wait = isTwa() ? 600 : 1800;
    setTimeout(hide, wait);
    setTimeout(hide, wait + 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
