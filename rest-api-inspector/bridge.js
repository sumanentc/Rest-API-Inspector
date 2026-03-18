// Rest API Inspector v2.0.0 - Bridge (isolated world)
// Forwards MAIN-world custom events to the background service worker.

window.addEventListener('__restApiInspector__', (event) => {
  // Guard: extension context may be invalidated after an update
  if (!chrome?.runtime?.id) return;
  try {
    const data = JSON.parse(event.detail);
    chrome.runtime.sendMessage({ type: 'API_REQUEST', data }, () => {
      // Swallow "receiving end does not exist" when popup is closed
      void chrome.runtime.lastError;
    });
  } catch (_) {
    // Ignore JSON parse errors or disconnected context
  }
});
