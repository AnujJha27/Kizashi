"use client";

import { useEffect } from "react";

export function ServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js?v=7").catch(() => undefined);
  }, []);

  return null;
}
