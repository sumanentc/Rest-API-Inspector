// Rest API Inspector v2.0.0 - Background Service Worker

const MAX_COMPLETED  = 500;   // max completed requests kept per tab
const PENDING_TTL_MS = 30000; // drop pending requests older than 30 seconds

const store = {}; // tabId -> { requests: Request[], pending: { [id]: PendingRequest } }

function getStore(tabId) {
  if (!store[tabId]) store[tabId] = { requests: [], pending: {} };
  return store[tabId];
}

// Purge pending entries that are older than PENDING_TTL_MS
function purgeStalePending(s) {
  const cutoff = Date.now() - PENDING_TTL_MS;
  for (const id in s.pending) {
    const ts = new Date(s.pending[id].timestamp).getTime();
    if (!isNaN(ts) && ts < cutoff) delete s.pending[id];
  }
}

function updateBadge(tabId, s) {
  const total = s.requests.length + Object.keys(s.pending).length;
  const label = total === 0 ? '' : total > 99 ? '99+' : String(total);
  chrome.action.setBadgeText({ text: label, tabId }).catch(() => {});
  chrome.action.setBadgeBackgroundColor({ color: '#E8734A', tabId }).catch(() => {});
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const tabId = sender.tab?.id;

  // ── Intercept data from content/bridge ──────────────────────────────────
  if (msg.type === 'API_REQUEST') {
    if (!tabId) { sendResponse({ ok: false }); return true; }
    const s = getStore(tabId);
    purgeStalePending(s);
    const data = msg.data;

    if (data.pending) {
      s.pending[data.id] = data;
    } else {
      delete s.pending[data.id];
      s.requests.unshift(data);
      if (s.requests.length > MAX_COMPLETED) {
        s.requests = s.requests.slice(0, MAX_COMPLETED);
      }
    }

    updateBadge(tabId, s);

    // Notify popup if open (silently ignore if not)
    chrome.runtime.sendMessage({ type: 'NEW_REQUEST', tabId }).catch(() => {});
    sendResponse({ ok: true });
  }

  // ── Popup requests full list ─────────────────────────────────────────────
  if (msg.type === 'GET_REQUESTS') {
    const s = getStore(msg.tabId);
    purgeStalePending(s);
    const pendingList = Object.values(s.pending).map(p => ({ ...p, _pending: true }));
    sendResponse({ requests: [...pendingList, ...s.requests] });
  }

  // ── Popup clears the list ────────────────────────────────────────────────
  if (msg.type === 'CLEAR_REQUESTS') {
    store[msg.tabId] = { requests: [], pending: {} };
    chrome.action.setBadgeText({ text: '', tabId: msg.tabId }).catch(() => {});
    sendResponse({ ok: true });
  }

  return true; // keep message channel open for async sendResponse
});

// Clean up store when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  delete store[tabId];
});

// Reset pending when a tab navigates (new page = fresh state for pending)
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading' && store[tabId]) {
    store[tabId].pending = {};
    updateBadge(tabId, store[tabId]);
  }
});
