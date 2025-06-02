import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('MONGO_URI length:', process.env.MONGO_URI?.length || 0);
    console.error('Server will continue running but database operations will fail');
    // Don't exit the process, just log the error
    // The server can still handle non-database routes
  }
};

export { connectDB }; 