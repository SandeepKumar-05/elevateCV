# ElevateCV — AI Resume Builder

> Build ATS-ready resumes from a single prompt. Match with live jobs. Let AI rewrite your resume for every application.

---

## Features

| Feature | Description |
|---------|-------------|
| **Build from Prompt** | Describe yourself in plain text → AI generates a fully formatted, ATS-ready PDF resume |
| **4 ATS Templates** | Jake's Resume, ModernCV, AltaCV, Deedy (FAANG-style) |
| **Smart Job Match** | Upload your resume, get scored matches from LinkedIn, Naukri, Indeed & Internshala |
| **JD Optimization** | Paste a job description → AI finds missing keywords and rewrites your bullet points |
| **Edit With AI** | Upload an existing PDF → prompt the AI to rewrite or restyle it |
| **Multi-provider AI** | Gemini (primary) + Groq/Llama (fallback) with automatic failover |

---

## Tech Stack

**Frontend** — React 19 · Vite 8 · React Router v7 · Vanilla CSS (brutalist design system)

**Backend** — Node.js · Express · Puppeteer (PDF generation) · Winston (logging) · Zod (validation)

**AI** — Google Gemini 1.5 Flash · Groq (Llama 3.3 70B)

**Infrastructure** — Docker · Nginx (SPA + API proxy)

---

## Project Structure

```
elevateCV/                  # React frontend (Vite)
│  ├── src/
│  │   ├── pages/          # Build, Match, Optimize, Edit, Home
│  │   ├── components/     # Navbar, Footer, Toast, AuthModal
│  │   └── index.css       # Global design system
│  ├── Dockerfile
│  └── nginx.conf          # SPA routing + /api proxy

resumeai-backend/           # Node/Express API server
│  ├── server.js            # Express app + all routes
│  ├── ai-providers.js      # Gemini + Groq integration
│  ├── resume-builder.js    # 3-stage AI pipeline
│  ├── prompt-engine.js     # Prompt construction
│  ├── html-templates.js    # Template rendering
│  ├── pdf-generator.js     # Puppeteer PDF output
│  ├── schemas.js           # Zod validation schemas
│  ├── logger.js            # Winston logger
│  └── templates/           # HTML resume templates
│      ├── jake.html
│      ├── moderncv.html
│      ├── altacv.html
│      └── deedy.html

docker-compose.yml           # Full-stack orchestration
.env.example                 # Environment variable template
```

---

## Quick Start — Development

### Prerequisites
- Node.js 20+
- npm 9+

### 1. Clone & setup environment

```bash
git clone https://github.com/your-username/elevateCV.git
cd elevateCV

# Copy and fill in your API keys
cp .env.example resumeai-backend/.env
```

Edit `resumeai-backend/.env` and add your keys:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
PORT=3002
NODE_ENV=development
```

> Get Gemini key: https://aistudio.google.com/app/apikey  
> Get Groq key: https://console.groq.com/keys

### 2. Install dependencies

```bash
# Backend
cd resumeai-backend && npm install && cd ..

# Frontend
cd elevateCV && npm install && cd ..
```

### 3. Run (two terminals)

**Terminal 1 — Backend:**
```bash
cd resumeai-backend
npm run dev       # Uses nodemon for auto-reload
```

**Terminal 2 — Frontend:**
```bash
cd elevateCV
npm run dev       # Vite dev server at http://localhost:5173
```

Open **http://localhost:5173** — the Vite proxy automatically forwards `/api` calls to the backend.

---

## Quick Start — Docker (Production)

### Prerequisites
- Docker Desktop

### 1. Setup environment

```bash
cp .env.example .env
# Edit .env with your real API keys
```

### 2. Build & run

```bash
docker-compose up --build
```

- Frontend: **http://localhost:3000**
- Backend API: **http://localhost:3002/api/health**

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes* | Google Gemini API key |
| `GROQ_API_KEY` | Yes* | Groq API key |
| `PORT` | No | Backend port (default: `3002`) |
| `NODE_ENV` | No | `development` or `production` |
| `DEFAULT_PROVIDER` | No | `auto`, `gemini`, or `groq` (default: `auto`) |

\* At least one of Gemini or Groq must be configured.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/generate` | Generate resume from prompt → returns PDF |
| `POST` | `/api/optimize` | Optimize resume against a job description |
| `POST` | `/api/edit-resume` | Edit existing resume with AI |
| `POST` | `/api/extract-pdf` | Extract text from uploaded PDF |
| `POST` | `/api/compile-latex` | Compile HTML → PDF via Puppeteer |
| `GET`  | `/api/health` | Health check + provider status |

---

## Resume Templates

| Template | Style | Best For |
|----------|-------|----------|
| **Jake's Resume** | Clean single-column | General use, ATS-safe |
| **ModernCV** | Two-column, bold header | Creative/tech roles |
| **AltaCV** | Sidebar modern | UX/Design/Product |
| **Deedy** | Dense, FAANG-style | Software engineering |

---

## License

MIT © 2025 Sandeep Kumar
# elevateCV
# elevateCV
