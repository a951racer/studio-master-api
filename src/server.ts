import mongoose from 'mongoose';
import app from './app';
import config from './config';
import { seedDatabase } from './services/seedService';

const start = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    await seedDatabase();
    console.log('Database seeding complete');

    app.listen(config.port, () => {
      console.log(`Server listening on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
