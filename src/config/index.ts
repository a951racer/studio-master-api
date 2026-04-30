import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  port: number;
  mongodbUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
  s3BucketName: string;
  s3PresignExpiresIn: number;
  allowedOrigins: string[];
}

const config: AppConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/studio-master',
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  s3BucketName: process.env.S3_BUCKET_NAME || '',
  s3PresignExpiresIn: parseInt(process.env.S3_PRESIGN_EXPIRES_IN || '900', 10),
  allowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim()),
};

export default config;
