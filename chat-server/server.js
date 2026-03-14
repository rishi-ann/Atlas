const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
let pty = null;
try { pty = require("node-pty"); } catch (e) { console.warn("[Atlas] node-pty not available — terminal features disabled"); }
const fs = require("fs");
const path = require("path");
const os = require("os");

const app = express();
const server = http.createServer(app);

const JWT_SECRET = process.env.CHAT_JWT_SECRET || "atlas-dev-chat-secret-2025";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "atlas-internal-secret-2025";

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    ].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Track
const onlineUsers = new Map(); // socketId -> { id, name }
const userSockets = new Map(); // userId -> socketId
const videoRooms = new Map();  // roomId -> [{ id, name, socketId }]
const callTimers = new Map();  // roomId -> startTime

// Playground tracking
const activeFiles = new Map(); // path -> content (for collaborative editing)
const shells = new Map();      // socketId -> pty process
const WORKSPACE_ROOT = path.resolve(__dirname, '..', 'workspace');

if (!fs.existsSync(WORKSPACE_ROOT)) {
  fs.mkdirSync(WORKSPACE_ROOT, { recursive: true });
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function saveMessage(senderId, senderName, content, receiverId = null, channel = 'all', fileUrl = null, fileType = null, fileName = null) {
  try {
    await fetch(`${APP_URL}/api/chat/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-secret": INTERNAL_SECRET },
      body: JSON.stringify({ senderId, senderName, content, receiverId, channel, fileUrl, fileType, fileName }),
    });
  } catch (e) {
    console.error("[Atlas] Failed to save message:", e.message);
  }
}

async function logCall(action, data) {
  try {
    await fetch(`${APP_URL}/api/calls/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-secret": INTERNAL_SECRET },
      body: JSON.stringify({ action, ...data }),
    });
  } catch (e) {
    console.error("[Atlas] Failed to log call:", e.message);
  }
}

async function broadcastSystemLog(level, category, message, metadata = {}) {
  const logData = { level, category, message, metadata, createdAt: new Date().toISOString() };
  io.emit("system_update", logData);
  try {
    await fetch(`${APP_URL}/api/system/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-secret": INTERNAL_SECRET },
      body: JSON.stringify(logData),
    });
  } catch (e) {
    console.error("[Atlas] Failed to push system log:", e.message);
  }
}

// ── Auth ───────────────────────────────────────────────────────────────────

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error: No token provided"));
  try {
    const user = jwt.verify(token, JWT_SECRET);
    socket.user = user;
    next();
  } catch {
    next(new Error("Authentication error: Invalid token"));
  }
});

// ── Connection ─────────────────────────────────────────────────────────────

io.on("connection", (socket) => {
  const { id, name } = socket.user;
  console.log(`[Atlas] Connected: ${name} (${id})`);

  onlineUsers.set(socket.id, { id, name });
  userSockets.set(id, socket.id);

  io.emit("online_users", Array.from(onlineUsers.values()));
  socket.broadcast.emit("developer_joined", { id, name });
  broadcastSystemLog("success", "user", `${name} joined the Atlas platform`);

  // ── Chat ─────────────────────────────────────────────────────────────────

  socket.on("send_message", async (data) => {
    const message = {
      id: Date.now().toString(),
      senderId: id,
      senderName: name,
      text: data.text,
      channel: data.channel || 'all',
      receiverId: data.receiverId || null,
      fileUrl: data.fileUrl || null,
      fileType: data.fileType || null,
      fileName: data.fileName || null,
      timestamp: new Date().toISOString(),
    };

    if (data.channel === 'direct' && data.receiverId) {
      // Direct message to a specific user
      const targetSocketId = userSockets.get(data.receiverId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("receive_message", message);
      }
      // Send it back to the sender
      socket.emit("receive_message", message);
      await saveMessage(id, name, data.text, data.receiverId, "direct", data.fileUrl, data.fileType, data.fileName);
      console.log(`[Chat] DM ${name} -> ${data.receiverId}: ${data.text || '[File]'}`);
    } else {
      // Broadcast to channel (e.g. 'all' or 'admin')
      io.emit("receive_message", message);
      await saveMessage(id, name, data.text, null, message.channel, data.fileUrl, data.fileType, data.fileName);
      console.log(`[Chat] ${name} [${message.channel}]: ${data.text || '[File]'}`);
    }
  });

  // Admin broadcast route
  socket.on("admin_broadcast", async (data) => {
    const message = {
      id: Date.now().toString(),
      senderId: 'admin',
      senderName: 'System Admin',
      text: data.text,
      channel: data.channel || 'admin',
      receiverId: data.receiverId || null,
      fileUrl: data.fileUrl || null,
      fileType: data.fileType || null,
      fileName: data.fileName || null,
      timestamp: new Date().toISOString(),
    };

    if (data.channel === 'direct' && data.receiverId) {
      const targetSocketId = userSockets.get(data.receiverId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("receive_message", message);
      }
      await saveMessage('admin', 'System Admin', data.text, data.receiverId, "direct", data.fileUrl, data.fileType, data.fileName);
    } else {
      io.emit("receive_message", message);
      await saveMessage('admin', 'System Admin', data.text, null, message.channel, data.fileUrl, data.fileType, data.fileName);
    }
    console.log(`[Chat] Admin -> ${data.receiverId || message.channel}: ${data.text || '[File]'}`);
  });

  socket.on("typing", () => socket.broadcast.emit("developer_typing", { id, name }));
  socket.on("stop_typing", () => socket.broadcast.emit("developer_stop_typing", { id }));

  // Task events
  socket.on("task_update", (data) => {
    socket.broadcast.emit("task_notification", { ...data, senderName: name });
  });

  // ── Video Call Signaling ──────────────────────────────────────────────────

  socket.on("call_request", async ({ targetId, roomId }) => {
    const targetSocketId = userSockets.get(targetId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("incoming_call", { callerId: id, callerName: name, roomId });

      // Log call as initiated
      await logCall("start", {
        roomId, callerId: id, callerName: name,
        receiverId: targetId, status: "initiated"
      });
      console.log(`[Call] ${name} → ${targetId} | room: ${roomId}`);
    } else {
      socket.emit("call_failed", { reason: "Developer is not online in chat." });
      await logCall("start", {
        roomId, callerId: id, callerName: name,
        receiverId: targetId, status: "missed"
      });
    }
  });

  socket.on("call_accepted", async ({ roomId, callerId }) => {
    socket.join(roomId);
    const callerSocketId = userSockets.get(callerId);
    if (callerSocketId) {
      io.sockets.sockets.get(callerSocketId)?.join(roomId);
      io.to(callerSocketId).emit("call_accepted_ack", { roomId, acceptorId: id, acceptorName: name });
    }
    if (!videoRooms.has(roomId)) videoRooms.set(roomId, []);
    videoRooms.get(roomId).push({ id, name, socketId: socket.id });
    callTimers.set(roomId, Date.now());
    socket.emit("room_ready", { roomId });

    await logCall("update_status", { roomId, status: "accepted" });
    console.log(`[Call] Room ${roomId} accepted by ${name}`);
  });

  socket.on("call_rejected", async ({ callerId }) => {
    const callerSocketId = userSockets.get(callerId);
    if (callerSocketId) io.to(callerSocketId).emit("call_rejected_ack", { rejectorName: name });

    // Find the roomId from the call_request context — caller passes it
    // We handle it on the caller side by passing roomId with rejection
    await logCall("update_status", { roomId: `REJECTED_BY_${id}`, status: "rejected" });
  });

  socket.on("call_rejected_with_room", async ({ callerId, roomId }) => {
    const callerSocketId = userSockets.get(callerId);
    if (callerSocketId) io.to(callerSocketId).emit("call_rejected_ack", { rejectorName: name });
    await logCall("update_status", { roomId, status: "rejected" });
  });

  socket.on("join_room", ({ roomId }) => {
    socket.join(roomId);
    if (!videoRooms.has(roomId)) videoRooms.set(roomId, []);
    const room = videoRooms.get(roomId);
    
    // Fix: Ensure we don't add the same socket multiple times
    if (!room.find(p => p.socketId === socket.id)) {
      room.push({ id, name, socketId: socket.id });
    }
    
    if (!callTimers.has(roomId)) callTimers.set(roomId, Date.now());
    socket.to(roomId).emit("peer_joined", { peerId: id, peerName: name, peerSocketId: socket.id });
    socket.emit("existing_peers", room.filter(p => p.socketId !== socket.id));
  });

  socket.on("webrtc_offer", ({ targetSocketId, offer, roomId }) => {
    io.to(targetSocketId).emit("webrtc_offer", { offer, fromSocketId: socket.id, fromId: id, fromName: name, roomId });
  });
  socket.on("webrtc_answer", ({ targetSocketId, answer }) => {
    io.to(targetSocketId).emit("webrtc_answer", { answer, fromSocketId: socket.id });
  });
  socket.on("webrtc_ice", ({ targetSocketId, candidate }) => {
    io.to(targetSocketId).emit("webrtc_ice", { candidate, fromSocketId: socket.id });
  });

  socket.on("end_call", async ({ roomId }) => {
    socket.to(roomId).emit("call_ended", { endedBy: name });
    socket.leave(roomId);

    const room = videoRooms.get(roomId);
    if (room) {
      const updated = room.filter(p => p.id !== id);
      if (updated.length === 0) videoRooms.delete(roomId);
      else videoRooms.set(roomId, updated);
    }

    const start = callTimers.get(roomId);
    const durationSecs = start ? Math.floor((Date.now() - start) / 1000) : null;
    if (durationSecs !== null && room && room.length <= 1) callTimers.delete(roomId);

    console.log(`[Call] Room ${roomId} ended by ${name} | ${durationSecs}s`);
  });

  // ── Playground (Coding) ──────────────────────────────────────────────────

  socket.on("playground_get_tree", () => {
    function getTree(dir) {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      return items.map(item => {
        const fullPath = path.join(dir, item.name);
        const relativePath = path.relative(WORKSPACE_ROOT, fullPath);
        if (item.isDirectory()) {
          // Skip node_modules
          if (item.name === 'node_modules') return null;
          return { name: item.name, type: 'directory', path: relativePath, children: getTree(fullPath) };
        }
        return { name: item.name, type: 'file', path: relativePath };
      }).filter(Boolean);
    }
    try {
      const tree = getTree(WORKSPACE_ROOT);
      socket.emit("playground_tree", tree);
    } catch (err) {
      socket.emit("playground_error", "Failed to read workspace tree");
    }
  });

  socket.on("playground_read_file", (filePath) => {
    try {
      const fullPath = path.join(WORKSPACE_ROOT, filePath);
      if (!fullPath.startsWith(WORKSPACE_ROOT)) throw new Error("Access denied");
      const content = fs.readFileSync(fullPath, 'utf8');
      socket.emit("playground_file_content", { path: filePath, content });
    } catch (err) {
      socket.emit("playground_error", "Failed to read file");
    }
  });

  socket.on("playground_save_file", ({ path: filePath, content }) => {
    try {
      const fullPath = path.join(WORKSPACE_ROOT, filePath);
      if (!fullPath.startsWith(WORKSPACE_ROOT)) throw new Error("Access denied");
      fs.writeFileSync(fullPath, content);
      socket.broadcast.emit("playground_file_saved", { path: filePath, content });
      console.log(`[Playground] File saved: ${filePath} by ${name}`);
    } catch (err) {
      socket.emit("playground_error", "Failed to save file");
    }
  });

  socket.on("playground_create_item", ({ path: itemPath, type }) => {
    try {
      const fullPath = path.join(WORKSPACE_ROOT, itemPath);
      if (!fullPath.startsWith(WORKSPACE_ROOT)) throw new Error("Access denied");
      
      if (type === 'directory') {
        fs.mkdirSync(fullPath, { recursive: true });
      } else {
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(fullPath, '');
      }
      
      const tree = getTree(WORKSPACE_ROOT);
      io.emit("playground_tree", tree); // Broadcast to all
      console.log(`[Playground] ${type} created: ${itemPath} by ${name}`);
    } catch (err) {
      socket.emit("playground_error", "Failed to create item");
    }
  });

  socket.on("playground_delete_item", (itemPath) => {
    try {
      const fullPath = path.join(WORKSPACE_ROOT, itemPath);
      if (!fullPath.startsWith(WORKSPACE_ROOT)) throw new Error("Access denied");
      
      if (fs.lstatSync(fullPath).isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }
      
      const tree = getTree(WORKSPACE_ROOT);
      io.emit("playground_tree", tree);
      console.log(`[Playground] Item deleted: ${itemPath} by ${name}`);
    } catch (err) {
      socket.emit("playground_error", "Failed to delete item");
    }
  });

  socket.on("playground_upload_batch", (files) => {
    try {
      files.forEach(({ path: filePath, content }) => {
        const fullPath = path.join(WORKSPACE_ROOT, filePath);
        if (!fullPath.startsWith(WORKSPACE_ROOT)) return;
        
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        fs.writeFileSync(fullPath, content);
      });
      
      const tree = getTree(WORKSPACE_ROOT);
      io.emit("playground_tree", tree);
      console.log(`[Playground] Batch upload completed: ${files.length} files by ${name}`);
    } catch (err) {
      socket.emit("playground_error", "Failed to upload batch");
    }
  });

  socket.on("playground_code_change", ({ path: filePath, content }) => {
    socket.broadcast.emit("playground_code_update", { path: filePath, content });
  });

  // ── Terminal ──────────────────────────────────────────────────────────────

  socket.on("terminal_init", () => {
    if (!pty) {
      socket.emit("terminal_output", "\r\n[Atlas] Terminal not available in this environment.\r\n");
      return;
    }
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: WORKSPACE_ROOT,
      env: process.env
    });

    shells.set(socket.id, ptyProcess);

    ptyProcess.on('data', (data) => {
      socket.emit("terminal_output", data);
    });

    ptyProcess.on('exit', () => {
      shells.delete(socket.id);
      socket.emit("terminal_exit");
    });
  });

  socket.on("terminal_input", (data) => {
    const shell = shells.get(socket.id);
    if (shell) shell.write(data);
  });

  socket.on("terminal_resize", ({ cols, rows }) => {
    const shell = shells.get(socket.id);
    if (shell) shell.resize(cols, rows);
  });

  // ── Disconnect ────────────────────────────────────────────────────────────

  socket.on("disconnect", () => {
    onlineUsers.delete(socket.id);
    userSockets.delete(id);
    io.emit("online_users", Array.from(onlineUsers.values()));
    socket.broadcast.emit("developer_left", { id, name });
    
    const shell = shells.get(socket.id);
    if (shell) {
      shell.kill();
      shells.delete(socket.id);
    }

    console.log(`[Atlas] Disconnected: ${name}`);
  });
});

const PORT = process.env.PORT || process.env.CHAT_PORT || 4001;
server.listen(PORT, () => {
  console.log(`[Atlas Chat+Call] Server running on port ${PORT}`);
});
