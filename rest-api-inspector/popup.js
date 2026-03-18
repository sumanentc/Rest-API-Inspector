// Rest API Inspector v2.0.0 - Popup Script
'use strict';

// ── State ─────────────────────────────────────────────────────────────────
let allRequests  = [];
let selected     = null;
let filterMethod = 'ALL';
let filterText   = '';
let isPaused     = false;
let currentTabId = null;
let pollTimer    = null;

// ── Boot ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  bindAllEvents();
  renderList(); // show empty state immediately

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab) return;
    currentTabId = tab.id;
    loadRequests();
    pollTimer = setInterval(() => { if (!isPaused) loadRequests(); }, 600);
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'NEW_REQUEST' && msg.tabId === currentTabId && !isPaused) {
      loadRequests();
    }
  });
});

// ── Data ──────────────────────────────────────────────────────────────────
function loadRequests() {
  if (!currentTabId) return;
  chrome.runtime.sendMessage({ type: 'GET_REQUESTS', tabId: currentTabId }, (res) => {
    if (chrome.runtime.lastError) return; // popup context lost
    if (!res?.requests) return;
    allRequests = res.requests;

    // If currently-selected request just completed, refresh detail panel
    if (selected) {
      const updated = allRequests.find(r => r.id === selected.id);
      if (updated && !updated._pending && selected._pending) {
        selected = updated;
        renderDetail();
      }
    }
    renderList();
  });
}

// ── Filter ────────────────────────────────────────────────────────────────
function getFiltered() {
  return allRequests.filter(req => {
    const method = req.method || '';
    if (filterMethod !== 'ALL' && method !== filterMethod) return false;
    if (filterText) {
      const q = filterText.toLowerCase();
      return (req.url    || '').toLowerCase().includes(q)
          || method.toLowerCase().includes(q)
          || String(req.status || '').includes(q);
    }
    return true;
  });
}

// ── Render list ───────────────────────────────────────────────────────────
function renderList() {
  const filtered  = getFiltered();
  const container = document.getElementById('requestList');
  const countEl   = document.getElementById('reqCount');
  const sbRight   = document.getElementById('sbRight');

  // Header count
  const completed = allRequests.filter(r => !r._pending).length;
  const pending   = allRequests.filter(r => r._pending).length;
  countEl.innerHTML = pending > 0
    ? `<strong>${completed}</strong> req &nbsp;<span style="color:var(--accent)">${pending} pending</span>`
    : `<strong>${completed}</strong> request${completed !== 1 ? 's' : ''}`;

  sbRight.textContent = filtered.length !== allRequests.length
    ? `Showing ${filtered.length} of ${allRequests.length}` : '';

  // Empty states
  if (allRequests.length === 0) {
    container.innerHTML = `
      <div class="state-msg">
        <div class="ico">📡</div>
        <p>No requests captured yet.<br>Navigate or interact with<br>a page to see API calls here.</p>
      </div>`;
    return;
  }
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="state-msg">
        <div class="ico">🔍</div>
        <p>No requests match the current filter.</p>
      </div>`;
    return;
  }

  // Preserve scroll
  const scrollTop = container.scrollTop;
  const frag = document.createDocumentFragment();

  filtered.forEach(req => {
    const row = document.createElement('div');
    row.className = 'req-row'
      + (selected && selected.id === req.id ? ' selected' : '')
      + (req._pending ? ' pending-row' : '');

    const u = parseUrl(req.url || '');

    // Status cell
    let statusHtml;
    if (req._pending) {
      statusHtml = `<span class="spinner" title="In progress"></span>`;
    } else if (req.error) {
      statusHtml = `<span class="s5xx">ERR</span>`;
    } else {
      statusHtml = `<span class="${getStatusClass(req.status)}">${req.status || '—'}</span>`;
    }

    // Time cell
    const timeHtml = req._pending
      ? `<span style="color:var(--accent);font-size:9px">…</span>`
      : `<span class="${getDurationClass(req.duration)}">${fmtDur(req.duration)}</span>`;

    row.innerHTML = `
      <span class="mbadge ${req.method}" title="${esc(req.method)}">${esc(req.method)}</span>
      <span class="req-url-cell" title="${esc(req.url)}">
        <span class="req-host">${esc(u.host)}</span><span class="req-path">${esc(u.path)}</span>
      </span>
      <span class="req-status-cell" style="text-align:right">${statusHtml}</span>
      <span class="req-time-cell">${timeHtml}</span>`;

    row.addEventListener('click', () => {
      selected = req;
      renderList();
      renderDetail();
    });

    frag.appendChild(row);
  });

  container.innerHTML = '';
  container.appendChild(frag);
  container.scrollTop = scrollTop;
}

// ── Render detail ─────────────────────────────────────────────────────────
function renderDetail() {
  if (!selected) return;
  const req = selected;

  document.getElementById('detailEmpty').style.display = 'none';
  document.getElementById('detailContent').classList.add('show');

  // Top bar — method badge
  const badge = document.getElementById('dBadge');
  badge.className   = 'mbadge ' + (req.method || '');
  badge.textContent = req.method || '?';

  // Top bar — status
  const statusEl = document.getElementById('dStatus');
  if (req._pending) {
    statusEl.className = 'req-status-cell s0';
    statusEl.innerHTML = `<span class="spinner"></span> &nbsp;In Progress`;
  } else if (req.error) {
    statusEl.className   = 'req-status-cell s5xx';
    statusEl.textContent = 'Network Error';
  } else {
    statusEl.className   = 'req-status-cell ' + getStatusClass(req.status);
    statusEl.textContent = req.status
      ? `${req.status}${req.statusText ? ' ' + req.statusText : ''}`
      : '—';
  }

  // Top bar — URL
  const urlEl = document.getElementById('dUrl');
  urlEl.textContent = req.url || '';
  urlEl.title       = req.url || '';

  // ── Overview tab ─────────────────────────────────────────────────────────
  document.getElementById('metaGrid').innerHTML =
    mi('Method',   `<span class="mbadge ${req.method}" style="width:auto">${esc(req.method)}</span>`) +
    mi('Status',   req._pending
      ? '<span style="color:var(--accent)">⏳ Pending</span>'
      : `<span class="${getStatusClass(req.status)}">${req.status || '—'}${req.statusText ? ' ' + esc(req.statusText) : ''}</span>`) +
    mi('Duration', req._pending
      ? '<span style="color:var(--text3)">…</span>'
      : `<span class="${getDurationClass(req.duration)}">${fmtDur(req.duration)}</span>`) +
    mi('Type',      esc(req.type || '—')) +
    mi('Time',      new Date(req.timestamp).toLocaleTimeString()) +
    mi('Page',      esc(shortenUrl(req.pageUrl || '')));

  // Full URL block
  setCodeBlock('fullUrl', req.url || '');

  // ── Headers ───────────────────────────────────────────────────────────────
  fillHdrTable('tblReqHdr', req.requestHeaders  || {});
  fillHdrTable('tblResHdr', req.responseHeaders || {});

  // ── Bodies ────────────────────────────────────────────────────────────────
  fillBody('reqBodyEl', req.requestBody);
  fillBody('resBodyEl', req.responseBody);

  // Status bar summary
  document.getElementById('sbRight').textContent = req._pending
    ? `${req.method} — in progress`
    : `${req.method} · ${req.status || 'ERR'} · ${fmtDur(req.duration)}`;
}

// ── Detail helpers ────────────────────────────────────────────────────────
function mi(label, val) {
  return `<div class="meta-item"><div class="meta-label">${label}</div><div class="meta-val">${val}</div></div>`;
}

function fillHdrTable(id, headers) {
  const t       = document.getElementById(id);
  const entries = Object.entries(headers);
  if (!entries.length) {
    t.innerHTML = '<tr><td colspan="2" style="color:var(--text3);padding:8px 6px">No headers captured</td></tr>';
    return;
  }
  t.innerHTML = entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(String(v))}</td></tr>`)
    .join('');
}

function fillBody(id, body) {
  const el  = document.getElementById(id);
  const btn = el.querySelector('.copy-over');
  el.innerHTML = '';
  if (btn) el.appendChild(btn);

  if (!body) {
    el.insertAdjacentHTML('beforeend', '<span style="color:var(--text3)">Empty body</span>');
    return;
  }
  try {
    const parsed = JSON.parse(body);
    const span   = document.createElement('span');
    span.innerHTML = jsonHL(JSON.stringify(parsed, null, 2));
    el.appendChild(span);
  } catch (_) {
    el.appendChild(document.createTextNode(body));
  }
}

// Set a code-block's text without losing the copy button
function setCodeBlock(id, text) {
  const el  = document.getElementById(id);
  const btn = el.querySelector('.copy-over');
  el.innerHTML = '';
  if (btn) el.appendChild(btn);
  el.appendChild(document.createTextNode(text));
}

// Copy the text content of a code-block element (skip the "Copy" button text)
window.copyEl = function (id) {
  const el   = document.getElementById(id);
  let   text = '';
  el.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) text += node.textContent;
    else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('copy-over')) {
      text += node.innerText || node.textContent;
    }
  });
  navigator.clipboard.writeText(text.trim()).catch(() => {});
};

// JSON syntax highlighter
function jsonHL(json) {
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(
      /("(?:\\u[0-9a-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      m => {
        let c = 'jn'; // number
        if (/^"/.test(m))             c = /:$/.test(m) ? 'jk' : 'js'; // key or string
        else if (/true|false/.test(m)) c = 'jb';  // boolean
        else if (/null/.test(m))       c = 'jz';  // null
        return `<span class="${c}">${m}</span>`;
      }
    );
}

// ── Event binding ─────────────────────────────────────────────────────────
function bindAllEvents() {

  // Method filter buttons
  document.getElementById('methodFilters').addEventListener('click', e => {
    const btn = e.target.closest('[data-method]');
    if (!btn) return;
    filterMethod = btn.dataset.method;
    document.querySelectorAll('[data-method]')
      .forEach(b => b.classList.toggle('active', b === btn));
    renderList();
  });

  // Search / filter input
  document.getElementById('searchInput').addEventListener('input', e => {
    filterText = e.target.value.trim();
    renderList();
  });

  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const pane = document.getElementById('pane-' + tab.dataset.tab);
      if (pane) pane.classList.add('active');
    });
  });

  // Pause / Resume
  document.getElementById('btnPause').addEventListener('click', function () {
    isPaused = !isPaused;
    this.textContent = isPaused ? '▶ Resume' : '⏸ Pause';
    this.classList.toggle('paused', isPaused);
    const dot = document.getElementById('recDot');
    dot.style.animationPlayState = isPaused ? 'paused' : 'running';
    dot.style.background = isPaused ? 'var(--yellow)' : 'var(--red)';
    document.getElementById('sbLeft').textContent = isPaused ? '⏸ Paused' : 'Recording';
  });

  // Clear
  document.getElementById('btnClear').addEventListener('click', () => {
    if (!currentTabId) return;
    chrome.runtime.sendMessage({ type: 'CLEAR_REQUESTS', tabId: currentTabId }, () => {
      if (chrome.runtime.lastError) return;
      allRequests = [];
      selected    = null;
      document.getElementById('detailContent').classList.remove('show');
      document.getElementById('detailEmpty').style.display = '';
      renderList();
    });
  });

  // Export All (HAR)
  document.getElementById('btnExport').addEventListener('click', () => {
    const exportable = getFiltered().filter(r => !r._pending);
    if (!exportable.length) return;
    dlJSON(buildHAR(exportable), `api-inspector-${Date.now()}.har.json`);
  });

  // Download single request
  document.getElementById('btnDownload').addEventListener('click', () => {
    if (!selected || selected._pending) return;
    const r = selected;
    dlJSON({
      version:    '2.0.0',
      id:          r.id,
      timestamp:   r.timestamp,
      type:        r.type,
      method:      r.method,
      url:         r.url,
      status:      r.status,
      statusText:  r.statusText,
      durationMs:  r.duration,
      pageUrl:     r.pageUrl,
      request:  { headers: r.requestHeaders  || {}, body: tryJSON(r.requestBody)  },
      response: { headers: r.responseHeaders || {}, body: tryJSON(r.responseBody) }
    }, `${(r.method || 'req').toLowerCase()}-${safeName(r.url)}-${Date.now()}.json`);
  });

  // Copy as cURL
  document.getElementById('btnCurl').addEventListener('click', function () {
    if (!selected) return;
    navigator.clipboard.writeText(toCurl(selected)).then(() => {
      this.textContent = '✓ Copied!';
      setTimeout(() => { this.textContent = 'Copy cURL'; }, 1500);
    }).catch(() => {});
  });
}

// ── Export helpers ────────────────────────────────────────────────────────
function buildHAR(reqs) {
  return {
    log: {
      version: '1.2',
      creator: { name: 'Rest API Inspector', version: '2.0.0' },
      entries: reqs.map(r => ({
        startedDateTime: r.timestamp,
        time: r.duration || 0,
        request: {
          method: r.method, url: r.url, httpVersion: 'HTTP/1.1',
          headers: toHARHeaders(r.requestHeaders), queryString: [],
          cookies: [], headersSize: -1,
          bodySize: r.requestBody ? r.requestBody.length : 0,
          ...(r.requestBody
            ? { postData: { mimeType: 'application/json', text: r.requestBody } }
            : {})
        },
        response: {
          status: r.status || 0, statusText: r.statusText || '',
          httpVersion: 'HTTP/1.1',
          headers: toHARHeaders(r.responseHeaders),
          cookies: [],
          content: {
            size:     r.responseBody ? r.responseBody.length : 0,
            mimeType: (r.responseHeaders || {})['content-type'] || 'application/json',
            text:     r.responseBody || ''
          },
          redirectURL: '', headersSize: -1,
          bodySize: r.responseBody ? r.responseBody.length : -1
        },
        cache: {},
        timings: { send: 0, wait: r.duration || 0, receive: 0 }
      }))
    }
  };
}

function toHARHeaders(obj) {
  return Object.entries(obj || {}).map(([name, value]) => ({ name, value: String(value) }));
}

function toCurl(r) {
  let s = `curl -X ${r.method} '${r.url}'`;
  Object.entries(r.requestHeaders || {}).forEach(([k, v]) => {
    s += ` \\\n  -H '${k}: ${v.replace(/'/g, "\\'")}'`;
  });
  if (r.requestBody) {
    s += ` \\\n  -d '${r.requestBody.replace(/'/g, "\\'")}'`;
  }
  return s;
}

function dlJSON(data, name) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Utility ───────────────────────────────────────────────────────────────
function parseUrl(url) {
  try {
    const u = new URL(url);
    const qs = u.search ? u.search.slice(0, 60) + (u.search.length > 60 ? '…' : '') : '';
    return { host: u.hostname, path: u.pathname + qs };
  } catch (_) {
    const i = url.indexOf('/', 8);
    return { host: url.slice(0, i > 0 ? i : 40), path: i > 0 ? url.slice(i) : '' };
  }
}

function shortenUrl(url) {
  try { return new URL(url).hostname; } catch (_) { return url.slice(0, 40); }
}

function fmtDur(ms) {
  if (ms == null || ms === undefined) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function getDurationClass(ms) {
  if (!ms) return '';
  if (ms < 300)  return 'fast';
  if (ms < 1000) return 'medium';
  return 'slow';
}

function getStatusClass(s) {
  if (!s)    return 's0';
  if (s < 300) return 's2xx';
  if (s < 400) return 's3xx';
  if (s < 500) return 's4xx';
  return 's5xx';
}

function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function tryJSON(s) {
  if (!s) return null;
  try { return JSON.parse(s); } catch (_) { return s; }
}

function safeName(url) {
  try {
    const u = new URL(url);
    return (u.hostname + u.pathname).replace(/[^a-z0-9]/gi, '-').slice(0, 60);
  } catch (_) {
    return url.replace(/[^a-z0-9]/gi, '-').slice(0, 60);
  }
}
