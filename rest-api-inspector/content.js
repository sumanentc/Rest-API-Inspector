// Rest API Inspector v2.0.0 - Content Script (runs in MAIN world)
// Patches XMLHttpRequest and fetch to capture all API calls.
(function () {
  'use strict';

  // Guard: don't double-patch if already injected (e.g. multiple iframes)
  if (window.__restApiInspectorActive__) return;
  window.__restApiInspectorActive__ = true;

  function emit(data) {
    window.dispatchEvent(new CustomEvent('__restApiInspector__', {
      detail: JSON.stringify(data)
    }));
  }

  // ── Patch XMLHttpRequest ─────────────────────────────────────────────────
  const OrigXHR = window.XMLHttpRequest;

  function PatchedXHR() {
    const xhr = new OrigXHR();
    const m = {
      method: 'GET', url: '', reqHeaders: {},
      reqBody: null, t0: null,
      id: (typeof crypto !== 'undefined' && crypto.randomUUID)
           ? crypto.randomUUID()
           : Math.random().toString(36).slice(2)
    };

    const _open   = xhr.open.bind(xhr);
    const _send   = xhr.send.bind(xhr);
    const _setHdr = xhr.setRequestHeader.bind(xhr);

    xhr.open = (method, url, ...rest) => {
      m.method = (method || 'GET').toUpperCase();
      m.url    = url || '';
      return _open(method, url, ...rest);
    };

    xhr.setRequestHeader = (n, v) => {
      m.reqHeaders[n] = v;
      return _setHdr(n, v);
    };

    xhr.send = function (body) {
      m.t0     = performance.now();
      m.reqBody = serializeBody(body);

      emit({
        id: m.id, pending: true, type: 'XHR',
        method: m.method, url: m.url,
        requestHeaders: m.reqHeaders, requestBody: m.reqBody,
        timestamp: new Date().toISOString(), pageUrl: window.location.href
      });

      xhr.addEventListener('loadend', function () {
        const duration = Math.round(performance.now() - m.t0);
        let resBody = '';
        try { resBody = xhr.responseText; } catch (_) {}

        const resHeaders = {};
        try {
          (xhr.getAllResponseHeaders() || '').trim().split('\r\n').forEach(line => {
            const idx = line.indexOf(': ');
            if (idx > -1) resHeaders[line.slice(0, idx)] = line.slice(idx + 2);
          });
        } catch (_) {}

        emit({
          id: m.id, pending: false, type: 'XHR',
          method: m.method, url: m.url,
          status: xhr.status, statusText: xhr.statusText, duration,
          requestHeaders: m.reqHeaders, requestBody: m.reqBody,
          responseHeaders: resHeaders, responseBody: trunc(resBody, 500000),
          timestamp: new Date().toISOString(), pageUrl: window.location.href
        });
      });

      return _send(body);
    };

    return xhr;
  }

  PatchedXHR.prototype = OrigXHR.prototype;
  Object.defineProperty(window, 'XMLHttpRequest', {
    value: PatchedXHR, writable: true, configurable: true
  });

  // ── Patch fetch ──────────────────────────────────────────────────────────
  if (typeof window.fetch === 'function') {
    const origFetch = window.fetch.bind(window);

    window.fetch = async function (input, init) {
      init = init || {};
      const id  = (typeof crypto !== 'undefined' && crypto.randomUUID)
                  ? crypto.randomUUID()
                  : Math.random().toString(36).slice(2);
      const t0  = performance.now();
      const method = ((init.method) || (input instanceof Request ? input.method : null) || 'GET').toUpperCase();
      const url    = input instanceof Request ? input.url : String(input);
      const reqHeaders = hdrsToObj(init.headers || (input instanceof Request ? input.headers : null));

      let reqBody = null;
      try {
        if (init.body)                                    reqBody = serializeBody(init.body);
        else if (input instanceof Request && input.body)  reqBody = await input.clone().text().catch(() => null);
      } catch (_) {}

      emit({
        id, pending: true, type: 'Fetch', method, url,
        requestHeaders: reqHeaders, requestBody: reqBody,
        timestamp: new Date().toISOString(), pageUrl: window.location.href
      });

      let response;
      try {
        response = await origFetch(input, init);
      } catch (err) {
        emit({
          id, pending: false, type: 'Fetch', method, url,
          status: 0, statusText: 'Network Error',
          duration: Math.round(performance.now() - t0),
          requestHeaders: reqHeaders, requestBody: reqBody,
          responseHeaders: {}, responseBody: err.message, error: true,
          timestamp: new Date().toISOString(), pageUrl: window.location.href
        });
        throw err;
      }

      const duration    = Math.round(performance.now() - t0);
      const resHeaders  = hdrsToObj(response.headers);

      // Clone before reading body so original Response is untouched
      response.clone().text().then(body => {
        emit({
          id, pending: false, type: 'Fetch', method, url,
          status: response.status, statusText: response.statusText, duration,
          requestHeaders: reqHeaders, requestBody: reqBody,
          responseHeaders: resHeaders, responseBody: trunc(body, 500000),
          timestamp: new Date().toISOString(), pageUrl: window.location.href
        });
      }).catch(() => {
        emit({
          id, pending: false, type: 'Fetch', method, url,
          status: response.status, statusText: response.statusText, duration,
          requestHeaders: reqHeaders, requestBody: reqBody,
          responseHeaders: resHeaders, responseBody: '[Binary or unreadable response body]',
          timestamp: new Date().toISOString(), pageUrl: window.location.href
        });
      });

      return response;
    };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  function serializeBody(b) {
    if (b == null) return null;
    if (typeof b === 'string') return b;
    if (b instanceof URLSearchParams) return b.toString();
    if (b instanceof FormData) {
      const o = {};
      b.forEach((v, k) => { o[k] = (v instanceof File) ? `[File: ${v.name}]` : v; });
      return JSON.stringify(o);
    }
    if (b instanceof Blob)        return `[Blob: ${b.size} bytes, type: ${b.type || 'unknown'}]`;
    if (b instanceof ArrayBuffer || ArrayBuffer.isView(b)) return `[Binary: ${b.byteLength || b.length} bytes]`;
    try { return JSON.stringify(b); } catch (_) { return String(b); }
  }

  function hdrsToObj(h) {
    const o = {};
    if (!h) return o;
    if (h instanceof Headers) { h.forEach((v, k) => { o[k] = v; }); return o; }
    if (Array.isArray(h))     { h.forEach(([k, v]) => { o[k] = v; }); return o; }
    if (typeof h === 'object') Object.assign(o, h);
    return o;
  }

  function trunc(s, max) {
    if (!s || s.length <= max) return s;
    return s.slice(0, max) + `\n\n[Truncated — full size: ${s.length} bytes]`;
  }
})();
