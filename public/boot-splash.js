/** Dismiss #yike-boot-splash — polls through React hydration re-inserts on cached builds. */
(function () {
  function hide() {
    var s = document.getElementById("yike-boot-splash");
    if (!s) return;
    s.classList.add("yike-boot-splash--out");
    setTimeout(function () {
      s.remove();
    }, 400);
  }

  var n = 0;
  var poll = setInterval(function () {
    hide();
    if (++n > 60) clearInterval(poll);
  }, 100);

  document.addEventListener("DOMContentLoaded", hide, { once: true });
  window.addEventListener(
    "load",
    function () {
      hide();
      clearInterval(poll);
    },
    { once: true }
  );
  setTimeout(function () {
    hide();
    clearInterval(poll);
  }, 3500);
})();
