const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

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

// Track online developers
const onlineUsers = new Map(); // socketId -> { id, name }

// Auth middleware — only registered developers can connect
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

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
  console.log(`[Atlas Chat] Developer connected: ${name} (${id})`);

  // Register online user
  onlineUsers.set(socket.id, { id, name });

  // Broadcast updated online list
  io.emit("online_users", Array.from(onlineUsers.values()));

  // Notify others
  socket.broadcast.emit("developer_joined", { id, name });

  // Handle incoming messages
  socket.on("send_message", (data) => {
    const message = {
      id: Date.now().toString(),
      senderId: id,
      senderName: name,
      text: data.text,
      timestamp: new Date().toISOString(),
    };
    io.emit("receive_message", message);
    console.log(`[Atlas Chat] Message from ${name}: ${data.text}`);
  });

  // Handle typing indicator
  socket.on("typing", () => {
    socket.broadcast.emit("developer_typing", { id, name });
  });
  socket.on("stop_typing", () => {
    socket.broadcast.emit("developer_stop_typing", { id });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    onlineUsers.delete(socket.id);
    io.emit("online_users", Array.from(onlineUsers.values()));
    socket.broadcast.emit("developer_left", { id, name });
    console.log(`[Atlas Chat] Developer disconnected: ${name}`);
  });
});

const PORT = process.env.CHAT_PORT || 4001;
server.listen(PORT, () => {
  console.log(`[Atlas Chat] Socket.io server running on port ${PORT}`);
});
