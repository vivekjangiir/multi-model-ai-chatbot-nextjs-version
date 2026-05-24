# NIM Chat — Next.js

A streaming chatbot for 100+ NVIDIA NIM models, built with Next.js 14 (App Router). This is the Next.js port of the original `chat.html` + `server.py` version — same design, same model catalog, no separate proxy server needed.

---

## What's inside

```
next js chatbot/
├── app/
│   ├── api/chat/route.ts   ← Proxy to NVIDIA NIM (replaces server.py)
│   ├── layout.tsx
│   ├── page.tsx            ← Main chatbot page
│   └── globals.css
├── components/
│   ├── Sidebar.tsx         ← Model catalog + search + API key button
│   ├── ChatArea.tsx        ← Message list + streaming bubble
│   ├── MessageInput.tsx    ← Textarea + send button
│   └── ApiKeyModal.tsx     ← API key entry dialog
├── lib/
│   └── catalog.ts          ← Full model catalog (100+ models)
├── .env.local.example
├── next.config.js
└── package.json
```

---

## Quick start

### 1. Install dependencies

```bash
cd "next js chatbot"
npm install
```

### 2. Set your API key

**Option A — environment variable (recommended for self-hosting):**

```bash
cp .env.local.example .env.local
# Edit .env.local and add your key:
# NVIDIA_API_KEY=nvapi-...
```

**Option B — enter it in the UI:**  
Leave `.env.local` blank. When you open the app, a dialog will prompt you for your key. It's stored in `localStorage` and sent securely to the Next.js API route via a header.

Get a free key at [build.nvidia.com/settings/api-keys](https://build.nvidia.com/settings/api-keys).

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How it works

```
Browser  →  POST /api/chat  →  NVIDIA NIM API
              (Next.js route)      (SSE stream)
         ←  SSE stream      ←
```

The Next.js API route (`app/api/chat/route.ts`) acts as a lightweight proxy — it resolves your API key (from `.env.local` or the request header) and streams the NVIDIA NIM response straight through to your browser. No separate proxy server needed, unlike the Python version.

**API key resolution order:**
1. `x-nvidia-key` header sent from the browser (entered via UI → stored in localStorage)
2. `NVIDIA_API_KEY` environment variable in `.env.local`

---

## Models

The sidebar includes 100+ models across 6 categories:

| Category | Highlights |
|----------|-----------|
| 💬 Chat | Llama 4 Maverick, Mistral Large 3 675B, MiniMax M2.7 |
| 🧠 Reasoning | Kimi K2.6 (1T MoE), DeepSeek V4, Nemotron Ultra 253B |
| 💻 Coding | Qwen3 Coder 480B, Mistral Nemotron |
| 👁️ Vision | Llama 3.2 Vision, Gemma 4, Phi-4 Multimodal |
| 🔬 Science | AlphaFold2, ESMFold, Evo2 (DNA) |
| 🛡️ Safety | NemoGuard, GLiNER PII |

---

## Production build

```bash
npm run build
npm start
```

---

## Differences from the HTML + Python version

| | HTML + Python | Next.js |
|---|---|---|
| Proxy server | `python server.py` (port 5000) | Built-in Next.js API route |
| Frontend | Static HTML file | React components |
| State | Vanilla JS + localStorage | React state + localStorage |
| Deployment | Run two processes | Single `npm start` |
| TypeScript | No | Yes |
