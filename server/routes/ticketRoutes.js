import express from 'express';
import {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
} from '../controllers/ticketController.js';
import { protect } from '../middleware/authMiddleware.js';
import Ticket from '../models/Ticket.js';
import { Server } from 'socket.io';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Ticket:
 *       type: object
 *       required:
 *         - subject
 *         - message
 *         - userId
 *         - botResponse
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           description: The MongoDB ObjectId of the ticket
 *         userId:
 *           type: string
 *           description: The Firebase user ID of the ticket creator
 *         subject:
 *           type: string
 *           description: The ticket subject
 *         message:
 *           type: string
 *           description: The ticket message
 *         botResponse:
 *           type: string
 *           description: The initial bot response to the ticket
 *         status:
 *           type: string
 *           enum: [new, in-progress, resolved]
 *           description: The ticket status
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           description: The ticket priority
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the ticket was created
 */

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket management API
 */

/**
 * @swagger
 * /api/tickets:
 *   get:
 *     summary: Returns all tickets
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ticket'
 *       401:
 *         description: Not authorized
 *   post:
 *     summary: Create a new ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - message
 *               - userId
 *               - botResponse
 *             properties:
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *               userId:
 *                 type: string
 *               botResponse:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *     responses:
 *       201:
 *         description: The ticket was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       401:
 *         description: Not authorized
 */
router.route('/').get(protect, getTickets).post(protect, createTicket);

// Add route for user-specific tickets
router.get('/user', protect, async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.user.uid }).sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/tickets/{id}:
 *   get:
 *     summary: Get a ticket by id
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: ObjectId
 *         required: true
 *         description: The MongoDB ObjectId of the ticket
 *     responses:
 *       200:
 *         description: The ticket description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       404:
 *         description: The ticket was not found
 *   put:
 *     summary: Update a ticket by id
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: ObjectId
 *         required: true
 *         description: The MongoDB ObjectId of the ticket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *                 description: The updated ticket subject
 *               message:
 *                 type: string
 *                 description: The updated ticket message
 *               status:
 *                 type: string
 *                 enum: [new, in-progress, resolved]
 *                 description: The updated ticket status
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: The updated ticket priority
 *               botResponse:
 *                 type: string
 *                 description: The updated bot response
 *     responses:
 *       200:
 *         description: The ticket was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       404:
 *         description: The ticket was not found
 *   delete:
 *     summary: Delete a ticket by id
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: ObjectId
 *         required: true
 *         description: The MongoDB ObjectId of the ticket
 *     responses:
 *       200:
 *         description: The ticket was deleted
 *       404:
 *         description: The ticket was not found
 */
router
  .route('/:id')
  .get(protect, getTicket)
  .put(protect, updateTicket)
  .delete(protect, deleteTicket);

// Add a message to a ticket (admin reply)
router.post('/:id/messages', protect, async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { text, status, tempId } = req.body;
    if (!text) return res.status(400).json({ message: 'Message text is required' });
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // Add message to ticket (assuming a messages or notes array exists)
    if (!ticket.messages) ticket.messages = [];
    const messageObj = {
      text,
      sender: 'admin',
      time: new Date(),
      tempId: tempId || null
    };
    ticket.messages.push(messageObj);
    if (status) ticket.status = status;
    await ticket.save();

    // Emit real-time update to ticket room
    if (req.app.get('io')) {
      const io = req.app.get('io');
      const ticketRoom = `ticket_${ticketId}`;
      io.to(ticketRoom).emit('ticketMessage', {
        ticketId,
        message: text,
        sender: 'admin',
        time: messageObj.time,
        tempId: messageObj.tempId
      });
    }

    res.json({ ticket, messages: ticket.messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all messages for a ticket
router.get('/:id/messages', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket.messages || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a message to a ticket (user message)
router.post('/:id/user-message', protect, async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { text, tempId } = req.body;
    if (!text) return res.status(400).json({ message: 'Message text is required' });
    
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    
    // Allow ticket owner or admin to send user messages
    if (ticket.userId !== req.user.uid) {
      // Check if user is admin
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Not authorized to message this ticket' });
      }
    }

    // Add message to ticket
    if (!ticket.messages) ticket.messages = [];
    const messageObj = {
      text,
      sender: 'user',
      time: new Date(),
      tempId: tempId || null
    };
    ticket.messages.push(messageObj);
    await ticket.save();

    // Emit real-time update to ticket room
    if (req.app.get('io')) {
      const io = req.app.get('io');
      const ticketRoom = `ticket_${ticketId}`;
      io.to(ticketRoom).emit('ticketMessage', {
        ticketId,
        message: text,
        sender: 'user',
        time: messageObj.time,
        tempId: messageObj.tempId
      });
    }

    res.json({ ticket, messages: ticket.messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router; 