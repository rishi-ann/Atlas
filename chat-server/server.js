const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);

const JWT_SECRET = process.env.CHAT_JWT_SECRET || "atlas-dev-chat-secret-2025";

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Track online developers: socketId -> user
const onlineUsers = new Map();
// Track socket per userId for direct routing
const userSockets = new Map();
// Track video rooms: roomId -> [{ id, name, socketId }]
const videoRooms = new Map();

// Auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error: No token provided"));
  try {
    const user = jwt.verify(token, JWT_SECRET);
    socket.user = user;
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  const { id, name } = socket.user;
  console.log(`[Atlas] Connected: ${name} (${id})`);

  onlineUsers.set(socket.id, { id, name });
  userSockets.set(id, socket.id);

  io.emit("online_users", Array.from(onlineUsers.values()));
  socket.broadcast.emit("developer_joined", { id, name });

  // ── Chat Events ──────────────────────────────────────────────
  socket.on("send_message", (data) => {
    const message = {
      id: Date.now().toString(),
      senderId: id,
      senderName: name,
      text: data.text,
      timestamp: new Date().toISOString(),
    };
    io.emit("receive_message", message);
  });

  socket.on("typing", () => socket.broadcast.emit("developer_typing", { id, name }));
  socket.on("stop_typing", () => socket.broadcast.emit("developer_stop_typing", { id }));

  // ── Video Call Signaling ─────────────────────────────────────

  // Initiate a 1-to-1 call
  socket.on("call_request", ({ targetId, roomId }) => {
    const targetSocketId = userSockets.get(targetId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("incoming_call", {
        callerId: id,
        callerName: name,
        roomId,
      });
      console.log(`[Atlas Call] ${name} → ${targetId} | room: ${roomId}`);
    } else {
      socket.emit("call_failed", { reason: "Developer is not online in chat." });
    }
  });

  // Call accepted: both join the room
  socket.on("call_accepted", ({ roomId, callerId }) => {
    socket.join(roomId);
    const callerSocketId = userSockets.get(callerId);
    if (callerSocketId) {
      io.sockets.sockets.get(callerSocketId)?.join(roomId);
      io.to(callerSocketId).emit("call_accepted_ack", { roomId, acceptorId: id, acceptorName: name });
    }
    // Track room participants
    if (!videoRooms.has(roomId)) videoRooms.set(roomId, []);
    videoRooms.get(roomId).push({ id, name, socketId: socket.id });
    socket.emit("room_ready", { roomId });
    console.log(`[Atlas Call] Room ${roomId} ready`);
  });

  // Call rejected
  socket.on("call_rejected", ({ callerId }) => {
    const callerSocketId = userSockets.get(callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call_rejected_ack", { rejectorName: name });
    }
  });

  // Join via invite link
  socket.on("join_room", ({ roomId }) => {
    socket.join(roomId);
    if (!videoRooms.has(roomId)) videoRooms.set(roomId, []);
    const room = videoRooms.get(roomId);
    room.push({ id, name, socketId: socket.id });
    // Notify existing peers
    socket.to(roomId).emit("peer_joined", { peerId: id, peerName: name, peerSocketId: socket.id });
    // Send existing peers to joiner
    socket.emit("existing_peers", room.filter(p => p.id !== id));
    console.log(`[Atlas Call] ${name} joined room ${roomId}`);
  });

  // WebRTC signaling (offer / answer / ICE)
  socket.on("webrtc_offer", ({ targetSocketId, offer, roomId }) => {
    io.to(targetSocketId).emit("webrtc_offer", { offer, fromSocketId: socket.id, fromId: id, fromName: name, roomId });
  });

  socket.on("webrtc_answer", ({ targetSocketId, answer }) => {
    io.to(targetSocketId).emit("webrtc_answer", { answer, fromSocketId: socket.id });
  });

  socket.on("webrtc_ice", ({ targetSocketId, candidate }) => {
    io.to(targetSocketId).emit("webrtc_ice", { candidate, fromSocketId: socket.id });
  });

  // End call
  socket.on("end_call", ({ roomId }) => {
    socket.to(roomId).emit("call_ended", { endedBy: name });
    socket.leave(roomId);
    const room = videoRooms.get(roomId);
    if (room) {
      const updated = room.filter(p => p.id !== id);
      if (updated.length === 0) videoRooms.delete(roomId);
      else videoRooms.set(roomId, updated);
    }
  });

  // ── Disconnect ───────────────────────────────────────────────
  socket.on("disconnect", () => {
    onlineUsers.delete(socket.id);
    userSockets.delete(id);
    io.emit("online_users", Array.from(onlineUsers.values()));
    socket.broadcast.emit("developer_left", { id, name });
    console.log(`[Atlas] Disconnected: ${name}`);
  });
});

const PORT = process.env.CHAT_PORT || 4001;
server.listen(PORT, () => {
  console.log(`[Atlas Chat+Call] Socket server running on port ${PORT}`);
});
