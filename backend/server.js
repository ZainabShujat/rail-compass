import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import trainRoutes from './routes/trainRoutes.js';
import stationRoutes from './routes/stationRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { initData } from './utils/dataLoader.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize data loader for Kaggle dataset
initData();

app.use(cors());
app.use(express.json());

app.use('/api/trains', trainRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/auth', authRoutes);

// Database connection
const rawUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/railwise';
const MONGODB_URI = rawUri.replace(/\s+/g, ''); // Strip all whitespace and line breaks

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('⚠️ Failed to connect to MongoDB. Running in memory fallback mode:', err.message);
  });

// Only listen on port if running locally (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the app for Vercel Serverless
export default app;
