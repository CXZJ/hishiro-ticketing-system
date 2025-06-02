import Ticket from '../models/Ticket.js';
import User from '../models/User.js';

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Private
const getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get ticket by ID
// @route   GET /api/tickets/:id
// @access  Private
const getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.status(200).json(ticket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create new ticket
// @route   POST /api/tickets
// @access  Private
const createTicket = async (req, res) => {
  try {
    const { userId, subject, message, botResponse, category, priority } = req.body;
    const ticket = await Ticket.create({
      userId,
      subject,
      message,
      botResponse,
      category,
      priority,
    });

    // Emit notification to all admins about new ticket
    if (req.app.get('io')) {
      const io = req.app.get('io');
      
      // Broadcast to admin notification room
      io.to('admin_notifications').emit('newTicketCreated', {
        ticketId: ticket._id,
        ticketSubject: ticket.subject || 'New Support Request',
        userEmail: req.user.email || 'Unknown User',
        userName: req.user.displayName || req.user.email?.split('@')[0] || 'User',
        message: ticket.message,
        priority: ticket.priority || 'medium',
        time: new Date().toLocaleString()
      });

      // Send urgent alert for high priority tickets
      if (ticket.priority === 'high') {
        io.to('admin_notifications').emit('urgentTicketAlert', {
          ticketId: ticket._id,
          ticketSubject: ticket.subject || 'Urgent Support Request',
          userName: req.user.displayName || req.user.email?.split('@')[0] || 'User',
          message: ticket.message,
          time: new Date().toLocaleString()
        });
        console.log(`Urgent ticket alert sent for high priority ticket ${ticket._id}`);
      }

      console.log(`New ticket notification sent to admins for ticket ${ticket._id}`);
    }

    res.status(201).json(ticket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private
const updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedTicket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete ticket
// @route   DELETE /api/tickets/:id
// @access  Private
const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    await ticket.deleteOne();
    res.status(200).json({ message: 'Ticket deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
}; 