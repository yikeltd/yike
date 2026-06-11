/**
 * Inline boot scripts for PWA / Android TWA — must run before paint.
 * Detects installed app shell vs normal browser so we can show a native splash
 * and hide website-only chrome without affecting SEO web traffic.
 */

/** Class on <html>: yike-app-mode | yike-web-mode + splash enabled/disabled. */
export const bootSplashArmScript = `(function(){try{var nav=window.navigator||{};var ref=document.referrer||'';var app=ref.indexOf('android-app://')===0;if(!app&&window.matchMedia){app=window.matchMedia('(display-mode: standalone)').matches||window.matchMedia('(display-mode: fullscreen)').matches||window.matchMedia('(display-mode: minimal-ui)').matches;}if(!app&&nav.standalone===true)app=true;document.documentElement.classList.add(app?'yike-app-mode':'yike-web-mode');document.documentElement.classList.add(app?'yike-boot-splash-enabled':'yike-boot-splash-disabled');}catch(e){document.documentElement.classList.add('yike-web-mode','yike-boot-splash-disabled');}})();`;

/** Cosmetic splash only — fail open quickly; never blocks on auth or network. */
export const bootSplashHideScript = `(function(){var done=false;var MAX=1800;function htmlDone(){document.documentElement.classList.remove('yike-boot-splash-enabled');document.documentElement.classList.add('yike-boot-splash-disabled');}function hide(){if(done)return;done=true;var s=document.getElementById('yike-boot-splash');if(s)s.classList.add('yike-boot-splash--out');htmlDone();}function showRecovery(){if(done)return;var s=document.getElementById('yike-boot-splash');if(s)s.classList.add('yike-boot-splash--recovery');}function bind(){var c=document.getElementById('yike-boot-continue');var r=document.getElementById('yike-boot-refresh');if(c)c.addEventListener('click',hide,{once:true});if(r)r.addEventListener('click',function(){window.location.reload();},{once:true});}function boot(){bind();if(!document.documentElement.classList.contains('yike-boot-splash-enabled')){hide();return;}setTimeout(showRecovery,1600);setTimeout(hide,900);setTimeout(hide,MAX);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.addEventListener('pageshow',function(){setTimeout(hide,MAX);},{once:true});})();`;

/** Unregister stale browser SW inside TWA — prevents Chrome-tab-like reload stalls. */
export const twaSwCleanupScript = `(function(){try{if(document.referrer.indexOf('android-app://')!==0)return;if(!('serviceWorker' in navigator))return;navigator.serviceWorker.getRegistrations().then(function(regs){regs.forEach(function(r){r.unregister();});});}catch(e){}})();`;
