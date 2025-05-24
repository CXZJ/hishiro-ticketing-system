import mongoose from 'mongoose';

const userSchema = mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true }, // Firebase UID
    email: { type: String, required: true, unique: true },
    username: { type: String },
    gender: { type: String },
    phone: { type: String },
    address: { type: String },
    authProvider: { type: String, default: 'local' },
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);