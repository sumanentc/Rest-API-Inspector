# 🔗 Rest API Inspector

> A professional-grade Chrome extension for capturing, inspecting, filtering, and exporting every REST API call your web app makes — right from the browser toolbar.

![Version](https://img.shields.io/badge/version-2.0.0-e8734a?style=flat-square)
![Manifest](https://img.shields.io/badge/manifest-v3-60a5fa?style=flat-square)
![Chrome](https://img.shields.io/badge/chrome-92%2B-4ade80?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-a78bfa?style=flat-square)
![Privacy](https://img.shields.io/badge/data%20collection-none-4ade80?style=flat-square)

---

## What It Does

Rest API Inspector patches `XMLHttpRequest` and `fetch` at the `MAIN` world level so it captures every outgoing request — including calls from third-party scripts — before they leave the browser. No proxy, no backend, no configuration needed.

Open any web app, click the extension icon, and start seeing requests immediately.

---

## Features

### 🎯 Capture & Display
- **Intercepts both XHR and Fetch** — catches all API calls regardless of how the page makes them
- **Live in-progress indicators** — requests appear instantly with a spinning indicator while in flight, then update with the final status and duration when the response arrives
- **Response time tracking** — every request is timed to the millisecond; colour-coded green (fast), yellow (medium), red (slow)
- **Status code colours** — 2xx green, 3xx cyan, 4xx yellow, 5xx red — spot failures at a glance
- **Up to 500 requests** per tab, newest first; oldest are automatically pruned

### 🔍 Filtering & Search
- **Method filter buttons** — one-click to show only GET, POST, PUT, PATCH, or DELETE requests
- **Live text search** — filter by URL, method name, or status code in real time
- **Combinable filters** — method filter and text search work together

### 📋 Request Inspector (5-tab detail panel)
Click any request row to open the full detail view:

| Tab | Contents |
|-----|----------|
| **Overview** | Method, status, duration, request type, timestamp, source page |
| **Req Headers** | All request headers, sorted alphabetically |
| **Req Body** | Request payload — JSON highlighted, FormData decoded, binary labelled |
| **Res Headers** | All response headers, sorted alphabetically |
| **Res Body** | Response body — JSON pretty-printed and syntax-highlighted |

### 📤 Export & Copy
- **Export All** — saves all visible (filtered) requests as a standard **HAR 1.2** file, compatible with Chrome DevTools, Postman, Charles Proxy, and any HAR viewer
- **Download Request** — saves a single request as a self-contained JSON file including all headers and bodies
- **Copy as cURL** — one click copies a complete, runnable `curl` command for the selected request

### ⚙️ Controls
- **Pause / Resume** — freeze capture without reloading the page; existing requests stay visible
- **Clear** — wipe the list instantly to isolate requests from a specific action
- **Badge counter** — the extension icon shows the live request count for the active tab
- **Per-tab isolation** — each tab has its own independent request log

---

## Privacy

**No data ever leaves your browser.**

| What | Detail |
|------|--------|
| Storage | In-memory only, per tab — cleared when the tab closes |
| Network | Zero outbound requests from the extension itself |
| Persistence | Nothing is written to disk or `chrome.storage` |
| Permissions | `tabs` + `activeTab` only — the minimum required |
| Third parties | None. No analytics, no telemetry, no ads |

---

## Installation

### From the Chrome Web Store *(recommended)*
1. Visit the [Chrome Web Store listing](#) and click **Add to Chrome**
2. Click the puzzle-piece icon in the toolbar → pin **Rest API Inspector**
3. Open any web app and click 🔗 — requests appear immediately

### Manual / Developer Install
1. Clone or download this repository
   ```bash
   git clone https://github.com/your-username/rest-api-inspector.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle, top-right)
4. Click **Load unpacked** and select the `rest-api-inspector` folder
5. The 🔗 icon appears in your toolbar

---

## Usage

```
1. Open any website or web app
2. Click the 🔗 icon in the Chrome toolbar
3. Interact with the page — requests appear in real time
4. Click any request row to inspect its full details
5. Use the method buttons or search bar to filter
6. Export All (HAR) or Download a single request as needed
```

### Filtering examples

| Goal | How |
|------|-----|
| Show only POST requests | Click the **POST** filter button |
| Find a specific endpoint | Type part of the URL in the search box |
| Isolate 4xx errors | Type `4` in the search box |
| Combine filters | Click **GET** then type `api/users` |

### Export examples

**Copy as cURL** — reproduce a request in your terminal:
```bash
curl -X POST 'https://api.example.com/users' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJ...' \
  -d '{"name":"Alice","email":"alice@example.com"}'
```

**HAR export** — open in Chrome DevTools:
1. Export All → save the `.har.json` file
2. Open Chrome DevTools → Network tab → Import HAR file

---

## File Structure

```
rest-api-inspector/
├── manifest.json      # Extension manifest (MV3)
├── content.js         # Patches XHR + fetch in MAIN world
├── bridge.js          # Forwards MAIN world events to background (isolated world)
├── background.js      # Service worker — stores requests per tab, updates badge
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic — rendering, filtering, export
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### How it works

```
Page JS                    content.js (MAIN world)
  │                              │
  ├── fetch() ──────────────────▶│ patched fetch → emits CustomEvent
  └── new XHR() ────────────────▶│ patched XHR → emits CustomEvent
                                 │
                           bridge.js (isolated world)
                                 │
                                 │ chrome.runtime.sendMessage
                                 ▼
                           background.js (service worker)
                                 │ stores in memory per tabId
                                 │ updates badge
                                 ▼
                           popup.js
                                 │ polls every 600ms
                                 └── renders list + detail panel
```

`content.js` runs in the `MAIN` world so it shares the same JavaScript context as the page — this is what allows it to patch `window.XMLHttpRequest` and `window.fetch` before the page's own code runs. `bridge.js` runs in the isolated world and acts as a secure relay to the background service worker.

---

## Technical Specifications

| Property | Value |
|----------|-------|
| Manifest version | 3 (MV3) |
| Minimum Chrome | 92 |
| Permissions | `tabs`, `activeTab` |
| Host permissions | `<all_urls>` |
| Intercepts | `XMLHttpRequest`, `fetch` |
| Injection world | `MAIN` |
| Max requests stored | 500 per tab |
| Pending request TTL | 30 seconds |
| Body capture limit | 500 KB per response |
| Export formats | HAR 1.2, JSON |

---

## Development

### Prerequisites
- Google Chrome 92 or later
- No build step required — plain HTML/CSS/JS

### Making changes
```bash
# 1. Edit any source file
# 2. Go to chrome://extensions/
# 3. Click the refresh icon on the Rest API Inspector card
# 4. Re-open the popup to see your changes
```

### Key files to know

**`content.js`** — This is the core interceptor. It patches `window.XMLHttpRequest` and `window.fetch` and emits a `CustomEvent` named `__restApiInspector__` for each request start and completion. The double-injection guard (`window.__restApiInspectorActive__`) prevents multiple patches in multi-frame pages.

**`bridge.js`** — Listens for `__restApiInspector__` events and forwards them via `chrome.runtime.sendMessage`. Runs in the isolated world (required for Chrome API access). Includes a context-invalidation guard (`chrome?.runtime?.id`) to handle extension reloads gracefully.

**`background.js`** — The service worker. Maintains a `store` object keyed by `tabId`, each containing a `requests` array and a `pending` map. Pending requests are expired after 30 seconds (`PENDING_TTL_MS`). Resets pending when a tab navigates.

**`popup.js`** — Polls the background every 600ms for the active tab's request list. All rendering is DOM-based with no external dependencies. `getFiltered()` applies both the method filter and the text search. `renderDetail()` fills all five tab panes when a row is clicked.

---

## Changelog

### v2.0.0
- Added in-progress request indicators with live spinner
- Pending requests now appear immediately and update when complete
- Fixed method filter buttons not applying correctly
- Fixed detail panel not opening on row click
- Fixed Clear button truncation in header
- Removed unused `storage` and `scripting` permissions
- Added stale pending request TTL (30 seconds)
- Added double-injection guard for multi-frame pages
- Added `crypto.randomUUID()` fallback for non-HTTPS pages
- Added `FormData` File entry serialization
- Added font fallback stack for offline use
- Badge capped at `99+`
- Response headers sorted alphabetically
- HAR export excludes in-progress requests
- Added `minimum_chrome_version: 92` to manifest
- Added accessibility attributes to popup HTML

### v1.0.0
- Initial release
- XHR and fetch interception
- Method filter buttons, text search
- 5-tab detail panel with JSON highlighting
- HAR export, single request download, cURL copy
- Pause/resume recording
- Per-tab request isolation

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes and test by loading the extension unpacked
4. Commit with a clear message (`git commit -m 'Add query string parsing'`)
5. Push and open a pull request

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <sub>Built for developers who care about what their apps are actually doing.</sub>
</div>
