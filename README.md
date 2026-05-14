# Zyvex Classroom

[![CI](https://github.com/YOUR_GITHUB_USERNAME/zyvex-classroom/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_GITHUB_USERNAME/zyvex-classroom/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](./LICENSE)

**Zyvex Classroom** is a full-stack learning management experience: **React (Vite)**, **Tailwind CSS**, **Node.js**, **Express**, **MongoDB**, and **JWT** authentication—with premium UI (glass / light–dark), **Socket.IO** live session updates, optional **OpenAI** assistant, **Recharts** analytics, and **Jitsi**-based live classes.

> **Repository name:** `zyvex-classroom`  
> Replace `YOUR_GITHUB_USERNAME` in badge URLs after you publish the repo.

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Screenshots](#screenshots)
- [Architecture & folder layout](#architecture--folder-layout)
- [Prerequisites](#prerequisites)
- [Installation (local development)](#installation-local-development)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [API overview](#api-overview)
- [Database collections](#database-collections)
- [Deploying & hosting](#deploying--hosting)
- [Security](#security)
- [Contributing & Git workflow](#contributing--git-workflow)
- [License](#license)

---

## Overview

Zyvex Classroom supports **students**, **teachers**, and **admins** (seeded). Teachers create **classrooms** with join codes; students enroll, submit **assignments**, take **quizzes**, watch **lecture videos**, join **live sessions**, and review **marks** and **attendance insights**. A floating **AI assistant** helps with navigation and LMS questions (GPT when `OPENAI_API_KEY` is set, otherwise rule-based replies).

---

## Features

| Area | Details |
|------|---------|
| **Auth** | JWT (`Bearer`), register as student/teacher, admin via `npm run seed:admin` |
| **Classrooms** | Create, join by code, roster, role-based access |
| **Assignments** | Teacher uploads; student submissions (multipart) |
| **Quizzes** | Multiple choice, one attempt, scoring |
| **Videos** | Drag-and-drop lecture uploads, subject tags, HTML5 preview |
| **Live classes** | Schedule, start/end status, Jitsi room per session, Socket.IO refresh |
| **Attendance** | Teacher marks sessions; **Insights** tab with charts |
| **Marks** | Optional **subject** label; student notifications |
| **Analytics** | Student dashboard: completion, weekly activity, subject averages (Recharts) |
| **Search** | `Ctrl/⌘+K` global search (classes, assignments, videos) |
| **Theme** | Light/dark luxury UI, Framer Motion page transitions |
| **Notifications** | In-app feed for key events |

---

## Screenshots

Add your own images under [`docs/screenshots/`](docs/screenshots/) (see that folder’s README). Then embed them here, for example:

```markdown
![Dashboard](docs/screenshots/02-dashboard.png)
```

| Placeholder | Suggested capture |
|-------------|-------------------|
| Landing | Hero + CTA |
| Dashboard | Signed-in overview + sidebar |
| Classroom | Tabs: assignments / live / insights |
| Analytics | Student charts |
| Schedule | Upcoming live sessions |

---

## Architecture & folder layout

The repo is a **monorepo**: **`client/` = frontend**, **`server/` = backend**. No rename required—both are first-class top-level folders.

```
zyvex-classroom/
├── .github/
│   └── workflows/
│       └── ci.yml           # GitHub Actions: client build + server npm ci
├── client/                  # Frontend — Vite + React + Tailwind
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       ├── context/         # Auth, theme
│       ├── components/      # Shell, chat, classroom panels, UI primitives
│       ├── lib/             # e.g. Socket.IO client helper
│       └── pages/
├── server/                  # Backend — Express + Mongoose + Socket.IO
│   ├── package.json
│   ├── .env.example
│   ├── uploads/             # Local files (gitignored except .gitkeep)
│   └── src/
│       ├── index.js
│       ├── models/
│       ├── routes/
│       ├── middleware/
│       └── scripts/         # seedAdmin.js
├── docs/
│   └── screenshots/         # Your README images (optional)
├── LICENSE                  # MIT
└── README.md
```

---

## Prerequisites

- **Node.js** 18+ (CI uses 20)
- **npm** 9+
- **MongoDB** 6+ locally, or **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas)**

---

## Installation (local development)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/zyvex-classroom.git
cd zyvex-classroom
```

### 2. Backend

```bash
cd server
cp .env.example .env
# Edit .env: set MONGODB_URI, JWT_SECRET, CLIENT_URL (http://localhost:5173)
npm install
npm run seed:admin
npm run dev
```

Default admin (override with `SEED_ADMIN_*` in env when running seed—see `scripts/seedAdmin.js`):

- **Email:** `admin@zyvex.local`
- **Password:** `Admin123!`

### 3. Frontend (new terminal)

```bash
cd client
cp .env.example .env
# Optional for non-proxy setups: VITE_API_URL=http://localhost:5000
npm install
npm run dev
```

Open **http://localhost:5173**. Vite proxies **`/api`**, **`/uploads`**, and **`/socket.io`** to **http://localhost:5000** by default.

### 4. Production build (client only)

```bash
cd client
npm run build
```

Serve `client/dist` behind HTTPS; set **`VITE_API_URL`** at build time to your public API origin if the API is on another host.

---

## Environment variables

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Default `5000` |
| `MONGODB_URI` | Yes | Mongo connection string |
| `JWT_SECRET` | Yes | Long random string for JWT |
| `CLIENT_URL` | Yes* | CORS origin (e.g. `http://localhost:5173`) |
| `OPENAI_API_KEY` | No | Enables GPT replies in `/api/chat` |
| `OPENAI_MODEL` | No | Default `gpt-4o-mini` |

### Client (`client/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | API base URL; leave empty in dev to use Vite proxy |

---

## Scripts

| Location | Command | Purpose |
|----------|---------|---------|
| `server/` | `npm run dev` | Nodemon API + Socket.IO |
| `server/` | `npm start` | Production `node` |
| `server/` | `npm run seed:admin` | Create/update admin user |
| `client/` | `npm run dev` | Vite dev server |
| `client/` | `npm run build` | Production bundle |

---

## API overview

REST base: **`/api`**. Health: **`GET /api/health`**.

Main groups: **`/api/auth`**, **`/api/classrooms`**, **`/api/assignments`**, **`/api/quizzes`**, **`/api/attendance`**, **`/api/marks`**, **`/api/notifications`**, **`/api/chat`**, **`/api/live-sessions`**, **`/api/videos`**, **`/api/analytics`**, **`/api/users`**, **`/api/admin`** (admin role).

Socket.IO shares the same server; clients join `classroom:<id>` for live session events.

---

## Database collections

Mongoose models map to collections such as: `users`, `classrooms`, `assignments`, `submissions`, `quizzes`, `quizattempts`, `attendances`, `marks`, `notifications`, `livesessions`, `lecturevideos`. Users may store `preferences.theme` (`dark` | `light`).

---

## Deploying & hosting

- **GitHub** stores source; use **MongoDB Atlas** + a Node host (**Railway**, **Render**, **Fly.io**, **VPS**) for the API.
- **Frontend:** Vercel, Netlify, Cloudflare Pages, or GitHub Pages (static `dist` only; set `VITE_API_URL` to your API).
- Never commit **`.env`**; only **`.env.example`** is tracked.

---

## Security

- Rotate **`JWT_SECRET`** and admin credentials for production.
- Serve API over **HTTPS**; restrict CORS `CLIENT_URL` to your real frontend origin.
- Scan or restrict **uploads** (assignments/videos) in production.

---

## Contributing & Git workflow

1. Fork or branch from `main`.
2. Commit with clear messages, e.g. `fix(attendance): correct monthly aggregation`.
3. Open a Pull Request; CI must pass.

### Connecting your machine to GitHub (step-by-step)

1. **Create a GitHub account** at [https://github.com/signup](https://github.com/signup) if you do not have one.
2. **Create the empty repository** on GitHub: **New repository** → name **`zyvex-classroom`** → public or private → **do not** add README/license (you already have them locally).
3. **Authenticate Git** (pick one):
   - **GitHub CLI:** install [GitHub CLI](https://cli.github.com/), run `gh auth login` and follow prompts.
   - **HTTPS + PAT:** [Create a Personal Access Token](https://github.com/settings/tokens) (scope `repo`). When `git push` asks for a password, paste the **token**.
   - **SSH:** [Add an SSH key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh) to your GitHub account, then use the SSH remote URL.

4. **From your project folder** (after `git clone` or initial push setup):

```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/zyvex-classroom.git
git branch -M main
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your GitHub username or organization.

5. **Verify on GitHub:** open the repo in the browser—check `client/`, `server/`, `README.md`, `.github/workflows/ci.yml`, and confirm **no** `.env` files appear.

---

## License

This project is licensed under the **MIT License** — see [LICENSE](./LICENSE).

---

## Repository URL (after you push)

**`https://github.com/YOUR_GITHUB_USERNAME/zyvex-classroom`**

After pushing, replace the badge links at the top of this README with your real username so the CI badge resolves.
