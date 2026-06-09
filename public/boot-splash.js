/** Dismiss #yike-boot-splash after min 3s — backup for cached HTML shells. */
(function () {
  var MIN = 3000;
  var t0 = Date.now();
  var done = false;

  function isApp() {
    try {
      if (window.matchMedia("(display-mode: standalone)").matches) return true;
      if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
      if (window.navigator.standalone) return true;
      if (document.referrer.indexOf("android-app://") === 0) return true;
    } catch (e) {
      /* ignore */
    }
    return false;
  }

  function hide() {
    if (done) return;
    var s = document.getElementById("yike-boot-splash");
    if (!s) return;
    done = true;
    s.classList.add("yike-boot-splash--out");
    setTimeout(function () {
      s.remove();
    }, 400);
  }

  if (!isApp()) {
    function removeNow() {
      var s = document.getElementById("yike-boot-splash");
      if (s) s.remove();
    }
    if (document.body) removeNow();
    else document.addEventListener("DOMContentLoaded", removeNow, { once: true });
    return;
  }

  function schedule() {
    var wait = Math.max(0, MIN - (Date.now() - t0));
    setTimeout(hide, wait);
  }

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });

  setTimeout(hide, MIN + 500);
})();
