<div align="center">

<img src="https://ik.imagekit.io/dypkhqxip/logo_atlas.png" alt="Atlas Logo" height="72" />

<h1>Atlas</h1>

<p>Internal developer operations platform for the Redlix ecosystem. Manage clients, projects, developer access, real-time communication, and audit logging from a unified interface.</p>

<br />

<p>
  <a href="#getting-started">Getting Started</a> &nbsp;|&nbsp;
  <a href="#tech-stack">Tech Stack</a> &nbsp;|&nbsp;
  <a href="#features">Features</a> &nbsp;|&nbsp;
  <a href="#environment-variables">Environment Variables</a> &nbsp;|&nbsp;
  <a href="#running-the-servers">Running the Servers</a>
</p>

</div>

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 16 (App Router) | Full-stack React framework with server components and server actions |
| Language | TypeScript | Type-safe development across frontend and backend |
| Styling | Tailwind CSS v4 | Utility-first CSS for rapid UI development |
| Database | PostgreSQL (Supabase) | Relational database hosted on Supabase |
| ORM | Prisma v6 | Type-safe database access, schema management and migrations |
| Runtime | Node.js | JavaScript runtime for server-side execution |
| Real-time Chat | Socket.io | WebSocket-based real-time messaging between developers |
| Video Calling | WebRTC | Peer-to-peer video and audio communication |
| Authentication | JWT (jsonwebtoken) | Token-based authentication for the chat and video server |
| Session Auth | HTTP-only Cookies | Secure session management for Developer, Admin and Super Admin portals |
| Bundler | Turbopack | High-performance Next.js development bundler |

---

## Features

### Super Admin Portal
- Client management with full company profile (name, email, company type, authorized representative, phone, address)
- Developer account approval and rejection
- Platform-wide audit log viewer

### Admin (Servers) Dashboard
- Real-time audit feed from developer activity
- Project analytics and monitoring
- Active developer session tracking with online/offline presence
- Developer request management

### Developer Portal
- Personal task board (Kanban-style)
- Client directory with assigned client records
- Quote generator
- Real-time team chat channel with message history
- Video calling with accept/reject popup, mute/camera controls, call duration tracking
- Invite link system for joining video calls
- Call history with status, direction, and duration

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory. See the [Environment Variables](#environment-variables) section below.

### 3. Sync the Database

```bash
npx prisma db push
npx prisma generate
```

---

## Running the Servers

Atlas requires two servers running concurrently.

### Next.js Application

```bash
npm run dev
```

Runs on [http://localhost:3000](http://localhost:3000)

### Chat and Video Call Server

```bash
npm run chat:dev
```

Runs on [http://localhost:4001](http://localhost:4001)

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string (pooled, pgBouncer) |
| `DIRECT_URL` | Supabase PostgreSQL direct connection string |
| `ADMIN_USERNAME` | Username for the Infrastructure Admin login |
| `ADMIN_PASSWORD` | Password for the Infrastructure Admin login |
| `SUPERADMIN_USERNAME` | Username for the Super Admin login |
| `SUPERADMIN_PASSWORD` | Password for the Super Admin login |
| `CHAT_JWT_SECRET` | Secret key used to sign and verify developer chat tokens |
| `NEXT_PUBLIC_CHAT_SERVER_URL` | Public URL of the Socket.io chat server (default: `http://localhost:4001`) |
| `INTERNAL_API_SECRET` | Shared secret for internal server-to-server API calls |
| `NEXT_PUBLIC_APP_URL` | Public URL of the Next.js application (default: `http://localhost:3000`) |

---

## Project Structure

```
atlas/
├── app/
│   ├── api/                    # API route handlers
│   │   ├── chat/messages/      # Chat history read/write
│   │   └── calls/log/          # Call log read/write
│   ├── dashboard/              # Admin (Servers) portal
│   │   ├── active-developers/  # Real-time developer session monitor
│   │   ├── developers/         # Developer approval management
│   │   ├── logs/               # Audit log viewer
│   │   └── projects/           # Project analytics
│   ├── developer-portal/       # Developer workspace
│   │   ├── board/              # Task Kanban
│   │   ├── calls/              # Call history
│   │   ├── chat/               # Real-time team chat and video calls
│   │   ├── clients/            # Assigned client directory
│   │   ├── quotes/             # Quote generator
│   │   └── video/[roomId]/     # Video call invite join page
│   ├── super-admin/            # Super Admin portal
│   │   └── clients/            # Client management
│   └── lib/
│       └── prisma.ts           # Prisma client singleton
├── chat-server/
│   └── server.js               # Socket.io server for chat and video signaling
├── prisma/
│   └── schema.prisma           # Database schema
└── components/                 # Shared UI components
```

---

## Portals and Access

| Portal | Route | Access Method |
|---|---|---|
| Infrastructure Admin | `/login` | Username and password |
| Super Admin | `/super-admin-login` | Username and password |
| Developer | `/dev-login` | Registered email (approved accounts only) |

---

<div align="center">
  <p>Built by the Redlix team.</p>
</div>
