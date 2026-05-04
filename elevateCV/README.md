# ResumeAI Setup Instructions

This repository contains the Node.js backend to generate PDF resumes from AI-generated JSON using Puppeteer, along with the UI connector script.

## 1. Local Installation

```bash
cd backend
npm install
```
*Note: Puppeteer automatically downloads Chromium (~170MB). If it fails on Linux, see troubleshooting below.*

## 2. Setting the Groq API Key

The backend uses the Groq API (Llama 3.1) to structure user prompts.
Store your free API key from [console.groq.com](https://console.groq.com):

**On Mac/Linux:**
```bash
export GROQ_API_KEY="your_api_key_here"
```

**On Windows (Powershell):**
```powershell
$env:GROQ_API_KEY="your_api_key_here"
```

## 3. Start the Backend

```bash
cd backend
npm start
```

Expected output:
```
ResumeAI backend running on http://localhost:3001
Registered Routes:
 - POST /api/generate
 - POST /api/html-to-pdf
 - POST /api/compile-html
 - GET  /api/health
```

## 4. Frontend Integration

Add the connector to your existing HTML file right before the `</body>` tag:
```html
<script src="frontend/api-connector.js"></script>
```
The script will replace mock functions (`doGenerate`, `doDownload`, etc.) with real API calls. Make sure your elements match the IDs in `api-connector.js` (`#resumePrompt`, `#li`, `#gh`, etc).

## 5. Full Flow Overview

1. User enters a prompt in the UI text box.
2. `doGenerate` triggers `POST /api/generate`.
3. The server calls Groq to parse the unstructured text into a highly structured JSON profile.
4. The JSON is injected into the selected HTML template (e.g. `jake.html`, `moderncv.html`).
5. Puppeteer launches a headless browser, renders the HTML (waiting for Google Fonts to load), and captures it as an A4 PDF.
6. The PDF binary buffer is sent to the frontend.
7. The frontend loads the blob URL into an `iframe` and prepares the download button.

## API Reference

| Route | Method | Body | Description |
|-------|--------|------|-------------|
| `/api/generate` | POST | `{ prompt, template, pages, linkedin... }` | Main resume generation |
| `/api/html-to-pdf` | POST | `{ html, filename, pages }` | Raw HTML -> PDF service |
| `/api/compile-html`| POST | `{ html, pages }` | Editor manual compile service |
| `/api/health` | GET | n/a | Server status check |

## Docker Deployment (Production)

To deploy the entire stack locally:
```bash
docker-compose up --build -d
```
*Frontend runs on http://localhost:8080. Backend on http://localhost:3001.*

## Troubleshooting

- **Puppeteer "No usable sandbox" crash on Linux:** The `server.js` disables the sandbox using `--no-sandbox`. This is already handled.
- **Google Fonts missing in PDF:** Handled via `waitUntil: 'networkidle0'`. Do not change this in `server.js` or standard fonts will render.
- **PDF sizing looks wrong:** Ensure `@page { margin: 0; size: A4; }` is left inside the HTML templates, and the `{{PAGE_HEIGHT}}` placeholder receives standard sizing dimensions (279mm/558mm/837mm).
- **Groq API HTTP 429 (Rate Limit):** If you hit the free tier limit, switch the model string in `server.js` from `llama-3.1-70b-versatile` to `llama-3.1-8b-instant`.
