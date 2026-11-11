export function toast(msg: string) {
  window.dispatchEvent(new CustomEvent('cf-toast', { detail: msg }));
}
