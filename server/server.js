import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import ticketRoutes from './routes/ticketRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins in development
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Routes
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);

// Error handler
app.use(errorHandler);

// Socket.IO
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Listen for chat message from client
  socket.on('clientMessage', (message) => {
    console.log('Message from client:', message);
    
    // Broadcast to admin (all connected clients)
    io.emit('adminMessage', {
      from: socket.id,
      text: message,
      time: new Date().toLocaleTimeString()
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
