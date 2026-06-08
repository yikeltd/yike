/** Instant branded splash — paints before React hydrates (Android TWA / PWA cold start). */
export function AppBootSplash() {
  const hideScript = `(function(){var s=document.getElementById('yike-boot-splash');if(!s)return;function hide(){s.classList.add('yike-boot-splash--out');setTimeout(function(){s.remove()},400);}if(document.readyState==='complete'){setTimeout(hide,120);}else{window.addEventListener('load',function(){setTimeout(hide,120);});}})();`;

  return (
    <>
      <div id="yike-boot-splash" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.webp" alt="" width={128} height={128} decoding="sync" />
      </div>
      <script dangerouslySetInnerHTML={{ __html: hideScript }} />
    </>
  );
}
