import mongoose from 'mongoose';

const ticketSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    botResponse: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['new', 'in-progress', 'resolved', 'closed'],
      default: 'new',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    assignedTo: {
      type: String,
      default: null,
    },
    messages: [{
      text: String,
      sender: String, // 'admin' or 'user'
      time: { type: Date, default: Date.now }
    }],
    notes: [{
      text: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
      createdBy: String,
    }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Ticket', ticketSchema); 