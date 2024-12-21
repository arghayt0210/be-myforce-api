import express from 'express';
import 'module-alias/register';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';

import { killProcessOnPort } from '@utils/portUtil';

import logger from '@config/logger';
import passportConfig from '@config/passport';
import connectDB from '@config/database';

import authRoutes from '@routes/authRoutes';
import verificationRoutes from '@routes/verificationRoutes';
import passwordRoutes from '@routes/passwordRoutes';

// Load environment variables
dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  }),
);

const PORT = process.env.PORT;

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true, // Prevents JavaScript access
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());
passportConfig(passport);

// Add error handling middleware
const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(err.status || 500).json({
    error: {
      message: err.message,
      status: err.status || 500,
    },
  });
};

// Add logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request', {
    path: req.path,
    method: req.method,
    query: req.query,
    ip: req.ip,
  });
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/password', passwordRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Express Server with Alias support!' });
});

// Add error handling middleware last
app.use(errorHandler);

// Modified server startup
let server;
const startServer = async () => {
  try {
    // Try to kill any existing process, but don't worry if none found
    await killProcessOnPort(PORT);

    // Ensure previous server instance is closed
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await connectDB();
    logger.info('Connected to MongoDB');
    server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.warn(`Port ${PORT} is busy, retrying in 1 second...`);
        setTimeout(() => {
          server.close();
          server.listen(PORT);
        }, 1000);
      } else {
        logger.error('Server error:', error);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    // Don't exit process during development
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Graceful shutdown
const shutdown = async () => {
  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      logger.info('Server closed gracefully');
    }
  } catch (error) {
    logger.error('Error during shutdown:', error);
  } finally {
    process.exit(0);
  }
};

// Handle termination signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors without crashing in development
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  if (process.env.NODE_ENV === 'production') {
    shutdown();
  }
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  if (process.env.NODE_ENV === 'production') {
    shutdown();
  }
});

startServer();
