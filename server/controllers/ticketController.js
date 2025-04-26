import Ticket from '../models/Ticket.js';
import User from '../models/User.js';

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Private
const getTickets = async (req, res) => {
  // Get user using the id in the JWT
  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(401);
    throw new Error('User not found');
  }

  // If user is admin, get all tickets, otherwise get only the user's tickets
  const tickets = user.isAdmin 
    ? await Ticket.find().populate('user', 'name')
    : await Ticket.find({ user: req.user.id });

  res.status(200).json(tickets);
};

// @desc    Get ticket by ID
// @route   GET /api/tickets/:id
// @access  Private
const getTicket = async (req, res) => {
  // Get user using the id in the JWT
  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(401);
    throw new Error('User not found');
  }

  const ticket = await Ticket.findById(req.params.id).populate('user', 'name');

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  // Admins can access any ticket, users can only access their own tickets
  if (!user.isAdmin && ticket.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Not Authorized');
  }

  res.status(200).json(ticket);
};

// @desc    Create new ticket
// @route   POST /api/tickets
// @access  Private
const createTicket = async (req, res) => {
  const { title, description, priority } = req.body;

  if (!title || !description) {
    res.status(400);
    throw new Error('Please add a title and description');
  }

  // Get user using the id in the JWT
  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(401);
    throw new Error('User not found');
  }

  const ticket = await Ticket.create({
    title,
    description,
    priority,
    user: req.user.id,
    status: 'new',
  });

  res.status(201).json(ticket);
};

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private
const updateTicket = async (req, res) => {
  // Get user using the id in the JWT
  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(401);
    throw new Error('User not found');
  }

  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  // Admins can update any ticket, users can only update their own tickets
  if (!user.isAdmin && ticket.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Not Authorized');
  }

  const updatedTicket = await Ticket.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.status(200).json(updatedTicket);
};

// @desc    Delete ticket
// @route   DELETE /api/tickets/:id
// @access  Private
const deleteTicket = async (req, res) => {
  // Get user using the id in the JWT
  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(401);
    throw new Error('User not found');
  }

  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  // Admins can delete any ticket, users can only delete their own tickets
  if (!user.isAdmin && ticket.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Not Authorized');
  }

  await ticket.deleteOne();

  res.status(200).json({ success: true });
};

export {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
}; 