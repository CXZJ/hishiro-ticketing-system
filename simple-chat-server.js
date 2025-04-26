import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import models
import Message from './server/models/Message.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Simple express server for static files
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Set up the port (use a different port to avoid conflicts)
const PORT = 3000;

// Socket.IO connection handling
io.on('connection', async (socket) => {
  console.log('A user connected:', socket.id);
  
  try {
    // Send chat history to newly connected client
    const chatHistory = await Message.find().sort({ createdAt: 1 }).limit(50);
    socket.emit('chatHistory', chatHistory);
  } catch (error) {
    console.error('Error fetching chat history:', error);
  }

  // Listen for chat message from client
  socket.on('clientMessage', async (message) => {
    console.log('Message from client:', message);
    
    try {
      // Save message to database
      const newMessage = await Message.create({
        user: socket.id,
        text: message,
        isAdmin: false,
        time: new Date().toLocaleTimeString()
      });
      
      // Broadcast to all clients
      io.emit('adminMessage', {
        from: socket.id,
        text: message,
        time: new Date().toLocaleTimeString(),
        _id: newMessage._id
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  // Listen for chat message from admin
  socket.on('adminMessage', async (data) => {
    console.log('Message from admin:', data);
    
    try {
      // Save message to database
      const newMessage = await Message.create({
        user: 'admin',
        text: data.text,
        isAdmin: true,
        time: new Date().toLocaleTimeString()
      });
      
      // Broadcast to all clients
      io.emit('adminMessage', {
        ...data,
        _id: newMessage._id
      });
    } catch (error) {
      console.error('Error saving admin message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start the server
httpServer.listen(PORT, () => {
  console.log(`Simple chat server running on http://localhost:${PORT}`);
}); 