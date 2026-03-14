<div align="center">

<img src="https://ik.imagekit.io/dypkhqxip/logo_atlas.png" alt="Atlas Logo" height="72" />

<h1>Atlas</h1>

<p>Internal developer operations platform for the Redlix ecosystem. Manage clients, projects, developer access, real-time communication, and collaborative coding from a unified interface.</p>

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
| Code Editor | Monaco Editor | VS Code-like coding experience in the browser |
| Terminal | xterm.js & node-pty | Fully interactive terminal shell for remote command execution |
| Video Calling | WebRTC | Peer-to-peer video and audio communication |
| Authentication | JWT (jsonwebtoken) | Token-based authentication for the chat and video server |
| Session Auth | HTTP-only Cookies | Secure session management for Developer, Admin and Super Admin portals |
| Bundler | Turbopack | High-performance Next.js development bundler |

---

## Features

### Developer Playground (Collaborative IDE)
- **Real-time Code Sync**: Multiple developers can edit the same files simultaneously with Monaco Editor.
- **Interactive Terminal**: Execute commands, run scripts, and manage environments directly from the dashboard via `node-pty`.
- **File System Manager**: Full folder tree exploration, create/delete files, and manage your project structure.
- **Bulk Folder Import**: Upload entire project folders from your computer directly into the playground workspace.

### Real-time Monitoring & Status
- **Vercel-style Log Engine**: unified, monospace feed for all platform updates and git commits.
- **Deployment Tracking**: Live GitHub commit history integration.
- **System Health Monitor**: Real-time status of API, Database, and Chat infrastructure.

### Team Communication
- **Real-time Chat**: Group channels and direct messaging with file/attachment support.
- **Integrated Video Calls**: Peer-to-peer video calling with screen sharing and call history.
- **Unified Presence**: Live tracking of approval developers and their active status.

### Administration & Operations
- **Super Admin**: Client management and developer vetting.
- **Infrastructure Admin**: Audit feed monitoring and project analytics.
- **Task Management**: Kanban-style project boards for approved developers.

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

### Chat, Playground, and Terminal Server

```bash
npm run chat:dev
```

Runs on [http://localhost:4001](http://localhost:4001)

---

## Project Structure

```
atlas/
├── app/
│   ├── api/                    # API route handlers
│   │   ├── system/logs/        # Vercel-style logging system
│   │   └── playground/         # File system operations
│   ├── developer-portal/       # Developer workspace
│   │   ├── playground/         # Collaborative IDE and Terminal
│   │   ├── chat/               # Real-time team communication
│   │   └── board/              # Task Kanban
│   ├── status/                 # Public Platform Status page
│   ├── dashboard/              # Admin (Servers) portal
│   └── lib/
│       └── prisma.ts           # Prisma client singleton
├── chat-server/
│   └── server.js               # Socket.io, Terminal (PTY), and IDE orchestration
├── prisma/
│   └── schema.prisma           # Database schema with Audit and System Logs
└── workspace/                  # Default root for Playground projects
```

---

<div align="center">
  <p>Built by the Redlix team.</p>
</div>
