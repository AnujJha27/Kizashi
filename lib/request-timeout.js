export const REQUEST_TIMEOUT_MS = 8000;

export function fetchWithTimeout(input, init = {}, timeoutMs = REQUEST_TIMEOUT_MS, fetchImpl = globalThis.fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  if (init.signal) {
    if (init.signal.aborted) controller.abort();
    else init.signal.addEventListener("abort", onAbort, { once: true });
  }
  return fetchImpl(input, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timer);
    init.signal?.removeEventListener("abort", onAbort);
  });
}
