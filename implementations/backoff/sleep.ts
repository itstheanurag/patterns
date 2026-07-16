export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  
  if (ms <= 0) {
    
    if (signal?.aborted) {
      return Promise.reject(signal.reason ?? new Error("Sleep aborted"));
    }
    
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new Error("Sleep aborted"));
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason ?? new Error("Sleep aborted"));
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
