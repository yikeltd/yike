/**
 * Inline boot scripts for PWA / Android TWA — must run before paint.
 * Detects installed app shell vs normal browser so we can show a native splash
 * and hide website-only chrome without affecting SEO web traffic.
 */

/**
 * Critical CSS — splash is invisible unless app mode arms it.
 * Prevents FOUC before globals.css loads (web must never flash splash).
 */
export const bootSplashCriticalCss = `#yike-boot-splash{display:none!important;opacity:0;visibility:hidden;pointer-events:none}html.yike-boot-splash-enabled #yike-boot-splash{display:flex!important;opacity:1;visibility:visible;pointer-events:auto}`;

/** Class on <html>: yike-app-mode | yike-web-mode + splash enabled/disabled. */
export const bootSplashArmScript = `(function(){try{var nav=window.navigator||{};var ref=document.referrer||'';var app=ref.indexOf('android-app://')===0;if(!app&&window.matchMedia){app=window.matchMedia('(display-mode: standalone)').matches||window.matchMedia('(display-mode: fullscreen)').matches||window.matchMedia('(display-mode: minimal-ui)').matches;}if(!app&&nav.standalone===true)app=true;document.documentElement.classList.add(app?'yike-app-mode':'yike-web-mode');document.documentElement.classList.add(app?'yike-boot-splash-enabled':'yike-boot-splash-disabled');}catch(e){document.documentElement.classList.add('yike-web-mode','yike-boot-splash-disabled');}})();`;

/**
 * Cosmetic splash only in app mode — fail open by 2.6s; never waits on auth or network.
 * Web: keep splash DOM (hydration-safe) but never enable/show/load real splash image.
 */
export const bootSplashHideScript = `(function(){var done=false;var MAX=2600;var SRC='/splash/splash-1080x1920.webp';function htmlDone(){document.documentElement.classList.remove('yike-boot-splash-enabled');document.documentElement.classList.add('yike-boot-splash-disabled');}function hide(){if(done)return;done=true;var s=document.getElementById('yike-boot-splash');if(s)s.classList.add('yike-boot-splash--out');htmlDone();}function showRecovery(){if(done)return;var s=document.getElementById('yike-boot-splash');if(s)s.classList.add('yike-boot-splash--recovery');}function bind(){var c=document.getElementById('yike-boot-continue');var r=document.getElementById('yike-boot-refresh');if(c)c.addEventListener('click',hide,{once:true});if(r)r.addEventListener('click',function(){window.location.reload();},{once:true});}function armImage(){var img=document.getElementById('yike-boot-splash-img');if(img)img.setAttribute('src',SRC);}function boot(){if(!document.documentElement.classList.contains('yike-boot-splash-enabled')){htmlDone();return;}armImage();bind();setTimeout(showRecovery,2300);setTimeout(hide,2000);setTimeout(hide,MAX);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.addEventListener('pageshow',function(){if(!document.documentElement.classList.contains('yike-boot-splash-enabled')){htmlDone();return;}setTimeout(hide,MAX);},{once:true});})();`;

/** Unregister stale browser SW inside TWA — prevents Chrome-tab-like reload stalls. */
export const twaSwCleanupScript = `(function(){try{if(document.referrer.indexOf('android-app://')!==0)return;if(!('serviceWorker' in navigator))return;navigator.serviceWorker.getRegistrations().then(function(regs){regs.forEach(function(r){r.unregister();});});}catch(e){}})();`;
