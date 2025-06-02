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
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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

// Store active ticket rooms and user notification rooms
const activeTicketRooms = new Map();
const userNotificationRooms = new Map(); // Map userId to socketId for notifications

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

  // Handle user joining notification room (for dashboard notifications)
  socket.on('userJoinNotificationRoom', (userId) => {
    console.log(`User ${userId} joined notification room with socket ${socket.id}`);
    userNotificationRooms.set(userId, socket.id);
    socket.join(`user_notifications_${userId}`);
  });

  // Handle admin joining notification room (for admin notifications)
  socket.on('adminJoinNotificationRoom', (adminId) => {
    console.log(`Admin ${adminId} joined admin notification room with socket ${socket.id}`);
    socket.join('admin_notifications');
    console.log(`Admin ${adminId} successfully joined admin_notifications room`);
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
    console.log(`Admin ${socket.id} attempting to join ticket room ${ticketRoom}`);
    
    // Always allow admins to join ticket rooms
    socket.join(ticketRoom);
    console.log(`Admin ${socket.id} joined ticket room ${ticketRoom}`);
    
    // Update or create ticket info
    let ticketInfo = activeTicketRooms.get(ticketId);
    if (ticketInfo) {
      ticketInfo.adminId = socket.id;
      activeTicketRooms.set(ticketId, ticketInfo);
    } else {
      // Create new ticket info entry for admin joining first
      const newTicketInfo = {
        ticketId: ticketId,
        userId: null,
        adminId: socket.id
      };
      activeTicketRooms.set(ticketId, newTicketInfo);
      console.log(`Created new ticket room entry for admin in ${ticketRoom}`);
    }
    
    console.log('Emitting adminJoined for ticketRoom', ticketRoom, 'ticketId', ticketId, 'adminId', socket.id);
    // Notify user that admin has joined
    io.to(ticketRoom).emit('adminJoined', {
      ticketId,
      adminId: socket.id,
      time: new Date().toLocaleString()
    });
  });

  // Handle user joining ticket room
  socket.on('userJoinTicketRoom', (ticketId) => {
    const ticketRoom = `ticket_${ticketId}`;
    console.log(`User ${socket.id} attempting to join ticket room ${ticketRoom}`);
    
    // Always allow users to join ticket rooms
    socket.join(ticketRoom);
    console.log(`User ${socket.id} joined ticket room ${ticketRoom}`);
    
    // Update or create ticket info
    let ticketInfo = activeTicketRooms.get(ticketId);
    if (ticketInfo) {
      // Update existing ticket info if user ID is different
      if (ticketInfo.userId !== socket.id) {
        ticketInfo.userId = socket.id;
        activeTicketRooms.set(ticketId, ticketInfo);
      }
    } else {
      // Create new ticket info entry
      const newTicketInfo = {
        ticketId: ticketId,
        userId: socket.id,
        adminId: null
      };
      activeTicketRooms.set(ticketId, newTicketInfo);
      console.log(`Created new ticket room entry for ${ticketRoom}`);
    }
    
    // Notify room that user has joined
    socket.to(ticketRoom).emit('userJoined', {
      ticketId,
      userId: socket.id,
      time: new Date().toLocaleString()
    });
  });

  // Handle ticket messages
  socket.on('ticketMessage', async (data) => {
    const { ticketId, message, isAdmin, sender, tempId } = data;
    const ticketRoom = `ticket_${ticketId}`;
    
    console.log(`Processing message for ticket ${ticketId} from ${sender || (isAdmin ? 'admin' : 'user')}`);
    
    try {
      // Find the ticket in database
      const ticket = await Ticket.findById(ticketId);
      if (!ticket) {
        console.error(`Ticket ${ticketId} not found`);
        return;
      }

      // Add message to ticket messages array
      if (!ticket.messages) ticket.messages = [];
      const messageObj = {
        text: message,
        sender: sender || (isAdmin ? 'admin' : 'user'),
        time: new Date(),
        tempId: tempId || null
      };
      ticket.messages.push(messageObj);
      await ticket.save();

      // Update or ensure room info exists
      let ticketInfo = activeTicketRooms.get(ticketId);
      if (!ticketInfo) {
        ticketInfo = {
          ticketId: ticketId,
          userId: isAdmin ? null : socket.id,
          adminId: isAdmin ? socket.id : null
        };
        activeTicketRooms.set(ticketId, ticketInfo);
        console.log(`Created ticket room info for ${ticketRoom}`);
      }

      // Ensure sender is in the room
      socket.join(ticketRoom);

      // Broadcast message to room
      io.to(ticketRoom).emit('ticketMessage', {
        ticketId,
        message,
        sender: sender || (isAdmin ? 'admin' : 'user'),
        time: messageObj.time.toLocaleString(),
        tempId: tempId || null
      });

      // If admin is replying, send notification to user's notification room
      if (isAdmin && ticket.userId) {
        const userNotificationRoom = `user_notifications_${ticket.userId}`;
        io.to(userNotificationRoom).emit('adminReplyToUserTicket', {
          ticketId: ticketId,
          ticketSubject: ticket.subject || 'Your Ticket',
          message: message,
          time: new Date().toLocaleString()
        });
        console.log(`Sent admin reply notification to ${userNotificationRoom}`);
      }

      console.log(`Message broadcasted to room ${ticketRoom}`);
    } catch (error) {
      console.error('Error processing ticket message:', error);
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
        // Emit to ticket room
        io.to(ticketRoom).emit('ticketStatusUpdated', {
          ticketId,
          status,
          time: new Date().toLocaleTimeString()
        });

        // Send notification to user's notification room
        if (updatedTicket.userId) {
          const userNotificationRoom = `user_notifications_${updatedTicket.userId}`;
          io.to(userNotificationRoom).emit('userTicketStatusUpdated', {
            ticketId: ticketId,
            ticketSubject: updatedTicket.subject || 'Your Ticket',
            status: status,
            time: new Date().toLocaleString()
          });
          console.log(`Sent status update notification to ${userNotificationRoom}`);
        }
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  });

  // Handle ticket priority updates
  socket.on('updateTicketPriority', async (data) => {
    const { ticketId, priority } = data;
    const ticketRoom = `ticket_${ticketId}`;
    
    try {
      const updatedTicket = await Ticket.findByIdAndUpdate(
        ticketId,
        { priority },
        { new: true }
      );

      if (updatedTicket) {
        // Emit to ticket room
        io.to(ticketRoom).emit('ticketPriorityUpdated', {
          ticketId,
          priority,
          time: new Date().toLocaleTimeString()
        });

        // Send notification to user's notification room
        if (updatedTicket.userId) {
          const userNotificationRoom = `user_notifications_${updatedTicket.userId}`;
          io.to(userNotificationRoom).emit('userTicketPriorityUpdated', {
            ticketId: ticketId,
            ticketSubject: updatedTicket.subject || 'Your Ticket',
            priority: priority,
            time: new Date().toLocaleString()
          });
          console.log(`Sent priority update notification to ${userNotificationRoom}`);
        }
      }
    } catch (error) {
      console.error('Error updating ticket priority:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Clean up user notification rooms
    for (const [userId, socketId] of userNotificationRooms.entries()) {
      if (socketId === socket.id) {
        userNotificationRooms.delete(userId);
        console.log(`Removed user ${userId} from notification room`);
        break;
      }
    }
    
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

// Expose io instance on app for use in routes
app.set('io', io);

const PORT = process.env.PORT || 5000;

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
