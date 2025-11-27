import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

app.use(cors({
  origin: "*", // Temporarily allow all — easier debugging
  credentials: true
}));

const server = http.createServer(app);

// IMPORTANT: Render needs WebSocket-only transport to avoid disconnects
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://secret-talk-app.vercel.app/"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket"]
});

io.on("connection",(socket) => {
    console.log("Client connected", socket.id);

    socket.on("join_room",({roomId, username}) => {
        socket.join(roomId);
        socket.data.username = username;
        console.log(`${username} joined room:${roomId}`);
        
        socket.to(roomId).emit("user_joined", username);
    })

    socket.on("send_message",({roomId, message}) => {
        io.to(roomId).emit("receive_message",{
            message,
            username:socket.data.username,
            time:new Date().toISOString()
        });
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected :" , socket.id);
        
    })
    
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
