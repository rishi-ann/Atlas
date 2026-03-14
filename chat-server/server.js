const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

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

// ── Helpers ────────────────────────────────────────────────────────────────

async function saveMessage(senderId, senderName, content) {
  try {
    await fetch(`${APP_URL}/api/chat/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-secret": INTERNAL_SECRET },
      body: JSON.stringify({ senderId, senderName, content }),
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

  // ── Chat ─────────────────────────────────────────────────────────────────

  socket.on("send_message", async (data) => {
    const message = {
      id: Date.now().toString(),
      senderId: id,
      senderName: name,
      text: data.text,
      timestamp: new Date().toISOString(),
    };
    io.emit("receive_message", message);

    // Persist to DB
    await saveMessage(id, name, data.text);
    console.log(`[Chat] ${name}: ${data.text}`);
  });

  socket.on("typing", () => socket.broadcast.emit("developer_typing", { id, name }));
  socket.on("stop_typing", () => socket.broadcast.emit("developer_stop_typing", { id }));

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
    room.push({ id, name, socketId: socket.id });
    if (!callTimers.has(roomId)) callTimers.set(roomId, Date.now());
    socket.to(roomId).emit("peer_joined", { peerId: id, peerName: name, peerSocketId: socket.id });
    socket.emit("existing_peers", room.filter(p => p.id !== id));
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

    await logCall("end", { roomId, status: "ended", durationSecs });
    console.log(`[Call] Room ${roomId} ended by ${name} | ${durationSecs}s`);
  });

  // ── Disconnect ────────────────────────────────────────────────────────────

  socket.on("disconnect", () => {
    onlineUsers.delete(socket.id);
    userSockets.delete(id);
    io.emit("online_users", Array.from(onlineUsers.values()));
    socket.broadcast.emit("developer_left", { id, name });
    console.log(`[Atlas] Disconnected: ${name}`);
  });
});

const PORT = process.env.PORT || process.env.CHAT_PORT || 4001;
server.listen(PORT, () => {
  console.log(`[Atlas Chat+Call] Server running on port ${PORT}`);
});
