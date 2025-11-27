# fng-clone

Minimal clone of the Alternative.me Fear & Greed Index (latest value only).

Features
- Backend (Next.js API routes) with simple in-memory caching (5 min TTL)
- Endpoints:
	- `/api/fng/latest` — latest from Alternative.me
	- `/api/fng/aggregate` — aggregated index from up to 4 sources (Alternative.me + 3 stubs)
- Frontend built with Next.js that shows the latest index value + classification and attribution

Requirements
- Node.js 18+ recommended

Quick start (development)

```bash
cd /Users/edibez/VisualStudioProject/fng-clone
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

Build for production

```bash
npm run build
npm start
```

Notes
- You must display attribution to Alternative.me next to any use of the data (done in the UI).
- This is a minimal prototype suitable for local testing. For production consider using persistent cache (Redis), proper error handling, rate-limiting, and deployment on a platform that supports Next.js (Vercel, etc.).
 
Environment variables
- Copy `.env.example` to `.env.local` and set keys for your additional sources:

```
SOURCE2_API_KEY=your-key
SOURCE2_API_SECRET=your-secret
SOURCE3_API_KEY=your-key
SOURCE3_API_SECRET=your-secret
SOURCE4_API_KEY=your-key
SOURCE4_API_SECRET=your-secret
```

Implementation notes
- The aggregate endpoint currently computes a simple average of the numeric values provided by the sources. We can switch to weighted average or custom rules once the other sources are defined.
- The three additional sources are stubs; provide their endpoints and expected value mapping and I’ll wire them up quickly.
