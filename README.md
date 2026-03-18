# Rest API Inspector

<img src="icon128.png" alt="Rest API Inspector" width="128"/>

> A professional-grade developer tool for capturing, inspecting, filtering, and exporting every REST API call your web app makes — right from the browser toolbar.

**Chrome Extension · v2.0.0 · Manifest V3 · Zero Data Collection**

---

## Features

### Core Features

**📡 Live Request Capture**
Automatically intercepts every `XMLHttpRequest` and `fetch()` call the moment a page loads — no setup, no code changes needed. Works on any website.

**⏱ In-Progress Indicators**
Requests appear instantly with a live spinner while in flight. The row updates automatically when the response arrives, showing the final status and exact duration.

**⚡ Response Time Tracking**
Every request is timed from the first byte sent to the last byte received. Duration is colour-coded so slow requests are instantly obvious:
- `< 300ms` — fast (green)
- `300ms – 1s` — medium (yellow)
- `> 1s` — slow (red)

**🔍 Method Filtering**
One-click filters let you focus on only the HTTP methods you care about: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`. Combine with the text search to pinpoint any specific request instantly.

**🔎 Smart Search**
Filter the request list in real time by URL, HTTP method name, or status code. Combine with method filters to drill down to exactly what you need.

**🎨 Status Code Colours**
Every response is immediately colour-coded: green for 2xx success, cyan for 3xx redirects, yellow for 4xx client errors, red for 5xx server errors — scan a list of requests at a glance.

---

### Request Inspector

**Five-Tab Detail Panel**
Click any request to open its complete profile in the right panel. Five dedicated tabs cover every dimension of the exchange:

| Tab | Contents |
|-----|----------|
| Overview | Method, status, duration, request type, timestamp, source page |
| Req Headers | All request headers in a two-column table |
| Req Body | Captured request payload |
| Res Headers | All response headers in a two-column table |
| Res Body | Full response payload |

**✨ JSON Syntax Highlighting**
Request and response bodies with valid JSON are automatically pretty-printed and syntax-highlighted — keys, strings, numbers, booleans and nulls each in a distinct colour.

**📊 Full Headers View**
All request and response headers listed alphabetically in a clean two-column table. Copy any value with a single click.

**📦 Request Body Capture**
Captures JSON, URL-encoded, FormData, and plain text bodies. Binary and Blob payloads are labelled with their size so you always know what was sent.

---

### Export & Share

**⬇ Export as HAR**
Export all visible (filtered) requests as a standard `.har.json` file. Compatible with Chrome DevTools, Postman, Charles Proxy, and any HAR-viewer tool (HAR 1.2 format).

**💾 Download Single Request**
Save any individual request as a self-contained JSON file that includes the method, URL, status, duration, all headers, request body, and response body.

**📋 Copy as cURL**
One click to copy any selected request as a complete, runnable cURL command — with all headers and body included. Paste straight into a terminal to reproduce the call.

---

### Recording Controls

**⏸ Pause & Resume**
Freeze capture instantly with the Pause button. Existing requests stay visible for inspection while new ones are ignored. Resume recording with a single click.

**✕ Clear All Requests**
Wipe the list and start fresh at any time. Useful for isolating just the requests from a specific user action without reloading the page.

**🔢 Live Badge Counter**
The extension icon badge shows the total number of captured requests for the active tab. Jump straight to the count without opening the panel.

**🌐 Works on All Websites**
Captures requests on any domain — SPAs, REST APIs, GraphQL endpoints, third-party analytics, and CDN calls. No configuration or allow-lists required.

**📋 Up to 500 Requests**
Keeps the 500 most recent completed requests per tab in memory. Oldest entries are automatically dropped to keep performance smooth on long-running sessions.

**🔄 Per-Tab Isolation**
Each browser tab tracks its own independent request log. Switch tabs freely — the inspector always shows requests for whichever tab is currently active.

---

### Privacy

**🔒 100% Private — Data Never Leaves Your Browser**

Rest API Inspector stores all captured requests **in memory only**, scoped to your browser tab. No data is ever sent to any server, logged to disk, shared with third parties, or retained after you close the tab.

The extension requests the minimum necessary permissions: `tabs` and `activeTab` only. No `storage`, no `webRequest`, no background data collection of any kind.

---

## Project Structure

```
Rest-API-Inspector/
├── rest-api-inspector/       # Extension source (v2.0.0)
│   ├── manifest.json         # MV3 manifest
│   ├── background.js         # Service worker — tab management & badge counter
│   ├── content.js            # MAIN world script — intercepts XHR & fetch()
│   ├── bridge.js             # Isolated world bridge — relays events to background
│   ├── popup.html            # Inspector UI shell
│   ├── popup.js              # Inspector UI logic — rendering, filters, export
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── icon16.png                # Root-level icons (referenced by store listing)
├── icon48.png
├── icon128.png
├── LICENSE.txt
└── README.md
```

---

## Technical Specifications

| Specification | Value |
|---------------|-------|
| Manifest | Version 3 (MV3) |
| Minimum Chrome | Chrome 92+ |
| Intercepts | XHR + Fetch |
| Permissions | tabs, activeTab |
| Request Limit | 500 per tab |
| Export Formats | HAR 1.2, JSON |
| Injection Method | MAIN world |
| Body Size Cap | 500 KB / response |

---

## How to Use

**Step 1 — Install**
Download the extension from the Chrome Web Store and click **Add to Chrome**. No account or sign-in required.

**Step 2 — Pin**
Pin the extension to your toolbar via the puzzle-piece icon so the 🔗 icon is always one click away.

**Step 3 — Open the Inspector**
Open any web app and click the 🔗 icon to launch the inspector. API calls appear in real time as you interact with the page. *No page reload required.*

**Step 4 — Inspect & Export**
Click any request in the list to inspect its full headers, body, and response. Use the filter buttons or search bar to find specific calls, then export or copy as needed.

---

## License

MIT License — Copyright (c) 2021 Suman Das

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
