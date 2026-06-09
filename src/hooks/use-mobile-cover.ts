"use client";

import { useEffect, useState } from "react";

/** True below md breakpoint — use smaller cover WebP variant. */
export function useMobileCover() {
  const [mobile, setMobile] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return mobile;
}
