import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import ticketRoutes from './routes/ticketRoutes.js';
import userRoutes from './routes/userRoutes.js';
import Ticket from './models/Ticket.js';
import mongoose from 'mongoose';
import User from './models/User.js';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger.js';
import adminRoutes from './routes/adminRoutes.js';
import './config/firebase-admin.js'; // Import Firebase Admin configuration

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

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Error handler
app.use(errorHandler);

// Store active ticket rooms
const activeTicketRooms = new Map();

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

  // Handle ticket creation
  socket.on('createTicket', async (ticketData) => {
    try {
      console.log('Creating ticket:', ticketData);
      
      // Create ticket in MongoDB
      const ticket = await Ticket.create({
        userId: socket.id,
        message: ticketData.message,
        botResponse: ticketData.botResponse,
        status: 'new',
        priority: 'medium'
      });

      // Create a room for this ticket
      const ticketRoom = `ticket_${ticket._id}`;
      activeTicketRooms.set(ticket._id.toString(), {
        ticketId: ticket._id,
        userId: socket.id,
        adminId: null
      });

      // Join the ticket room
      socket.join(ticketRoom);
      
      // Notify the user that their ticket was created
      socket.emit('ticketCreated', {
        _id: ticket._id,
        status: ticket.status,
        message: ticketData.message,
        botResponse: ticketData.botResponse
      });
      
      // Broadcast new ticket to admin
      io.emit('newTicket', {
        ...ticket.toObject(),
        id: socket.id,
        roomId: ticketRoom,
        createdAt: new Date().toISOString()
      });
      
      console.log('Ticket created successfully:', ticket);
    } catch (error) {
      console.error('Error creating ticket:', error);
      socket.emit('ticketError', { message: 'Failed to create ticket' });
    }
  });

  // Handle joining ticket room (for admin)
  socket.on('joinTicketRoom', (ticketId) => {
    const ticketRoom = `ticket_${ticketId}`;
    const ticketInfo = activeTicketRooms.get(ticketId);
    
    if (ticketInfo) {
      socket.join(ticketRoom);
      ticketInfo.adminId = socket.id;
      activeTicketRooms.set(ticketId, ticketInfo);
      
      // Notify user that admin has joined
      io.to(ticketRoom).emit('adminJoined', {
        ticketId,
        adminId: socket.id,
        time: new Date().toLocaleTimeString()
      });
    }
  });

  // Handle user joining ticket room
  socket.on('userJoinTicketRoom', (ticketId) => {
    const ticketRoom = `ticket_${ticketId}`;
    const ticketInfo = activeTicketRooms.get(ticketId);

    if (ticketInfo && ticketInfo.userId === socket.id) {
      socket.join(ticketRoom);
      console.log(`User ${socket.id} joined ticket room ${ticketRoom}`);
       // Optionally, notify admin that user rejoined or is present
       // io.to(ticketRoom).emit('userJoined', { ticketId, userId: socket.id, time: new Date().toLocaleTimeString() });
    } else if (!ticketInfo) {
        // If ticketInfo doesn't exist, try to find the ticket in the DB and create a room entry
        Ticket.findById(ticketId).then(ticket => {
            if (ticket) {
                const newTicketInfo = {
                    ticketId: ticket._id.toString(),
                    userId: socket.id,
                    adminId: null
                };
                activeTicketRooms.set(ticket._id.toString(), newTicketInfo);
                socket.join(ticketRoom);
                console.log(`User ${socket.id} joined newly created ticket room entry ${ticketRoom}`);
            } else {
                console.log(`Ticket ${ticketId} not found for user to join.`);
            }
        }).catch(error => {
            console.error('Error finding ticket for user join:', error);
        });
    }
  });

  // Handle ticket messages
  socket.on('ticketMessage', async (data) => {
    const { ticketId, message, isAdmin } = data;
    const ticketRoom = `ticket_${ticketId}`;
    const ticketInfo = activeTicketRooms.get(ticketId);

    if (ticketInfo) {
      // Add message to ticket notes
      await Ticket.findByIdAndUpdate(ticketId, {
        $push: {
          notes: {
            text: message,
            createdBy: isAdmin ? 'admin' : 'user'
          }
        }
      });

      // Broadcast message to room
      io.to(ticketRoom).emit('ticketMessage', {
        ticketId,
        message,
        sender: isAdmin ? 'admin' : 'user',
        time: new Date().toLocaleTimeString()
      });
    }
  });

  // Handle ticket status updates
  socket.on('updateTicketStatus', async (data) => {
    const { ticketId, status } = data;
    const ticketRoom = `ticket_${ticketId}`;
    
    try {
      const updatedTicket = await Ticket.findByIdAndUpdate(
        ticketId,
        { status },
        { new: true }
      );

      if (updatedTicket) {
        io.to(ticketRoom).emit('ticketStatusUpdated', {
          ticketId,
          status,
          time: new Date().toLocaleTimeString()
        });
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Clean up ticket rooms
    for (const [ticketId, info] of activeTicketRooms.entries()) {
      if (info.userId === socket.id || info.adminId === socket.id) {
        const ticketRoom = `ticket_${ticketId}`;
        io.to(ticketRoom).emit('userLeft', {
          ticketId,
          userId: socket.id,
          time: new Date().toLocaleTimeString()
        });
        
        if (info.userId === socket.id) {
          activeTicketRooms.delete(ticketId);
        } else {
          info.adminId = null;
          activeTicketRooms.set(ticketId, info);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Available routes:');
  console.log('- GET /api/admin/check');
  console.log('- POST /api/admin/set-admin/:uid');
  console.log('- POST /api/admin/remove-admin/:uid');
});

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hishiro-ticketing-system';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
