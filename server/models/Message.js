import mongoose from 'mongoose';

const messageSchema = mongoose.Schema(
  {
    user: {
      type: String,  // Socket ID or user ID if authenticated
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    time: {
      type: String,
      default: () => new Date().toLocaleTimeString(),
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Message', messageSchema); 