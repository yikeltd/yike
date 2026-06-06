export function notifyActivityChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("yike:activity-changed"));
}
