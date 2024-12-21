import express from 'express';
import 'module-alias/register';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import { killProcessOnPort } from '@utils/portUtil';
import { seedInterests } from '@utils/seedInterests';
import logger from '@config/logger';
import passportConfig from '@config/passport';
import connectDB from '@config/database';
import authRoutes from '@routes/authRoutes';
import verificationRoutes from '@routes/verificationRoutes';
import passwordRoutes from '@routes/passwordRoutes';
import userRoutes from '@routes/userRoutes';
import masterRoutes from '@routes/masterRoutes';
import { Redis } from '@upstash/redis';
import { RedisStore } from 'connect-redis';
// Load environment variables
dotenv.config();
const app = express();
// Initialize Redis client with Upstash
const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
// Verify Redis connection
const verifyRedisConnection = async () => {
  try {
    await redisClient.ping();
    logger.info('Redis connection successful');
    return true;
  } catch (error) {
    logger.error('Redis connection failed:', error);
    return false;
  }
};
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  }),
);
const PORT = process.env.PORT;
app.use(express.json());
// Modified session middleware to include error handling
app.use(
  session({
    store:
      process.env.NODE_ENV === 'production'
        ? new RedisStore({
            client: redisClient,
            prefix: 'session:',
            ttl: 86400,
            // Add error handling for Redis store
            retry_strategy: function (options) {
              if (options.error && options.error.code === 'ECONNREFUSED') {
                logger.error('Redis connection refused');
                return new Error('Redis connection refused');
              }
              if (options.total_retry_time > 1000 * 60 * 60) {
                logger.error('Redis retry time exhausted');
                return new Error('Redis retry time exhausted');
              }
              if (options.attempt > 10) {
                logger.error('Redis max retries reached');
                return new Error('Redis max retries reached');
              }
              return Math.min(options.attempt * 100, 3000);
            },
          })
        : undefined,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
    rolling: true,
    unset: 'destroy',
  }),
);
app.use(passport.initialize());
app.use(passport.session());
passportConfig(passport);
// Modified logging middleware with error handling
app.use((req, res, next) => {
  try {
    logger.info('Incoming request', {
      path: req.path,
      method: req.method,
      query: req.query,
      ip: req.ip,
    });
    next();
  } catch (error) {
    next(error);
  }
});
// Add response helper middleware
app.use((req, res, next) => {
  res.sendResponse = (statusCode, data) => {
    if (!res.headersSent) {
      res.status(statusCode).json(data);
    }
  };
  next();
});
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/users', userRoutes);
// Test route
app.get('/', (req, res) => {
  if (!res.headersSent) {
    res.json({ message: 'Welcome to Express Server with Alias support!' });
  }
});
// Modified error handler with additional checks
const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  if (res.headersSent) {
    return next(err);
  }
  // Handle session errors specifically
  if (err.name === 'SessionError') {
    return res.sendResponse(440, {
      error: {
        message: 'Session expired or invalid',
        status: 440,
      },
    });
  }
  // Handle Redis connection errors
  if (err.name === 'RedisError') {
    return res.sendResponse(500, {
      error: {
        message: 'Session store error',
        status: 500,
      },
    });
  }
  // Default error response
  res.sendResponse(err.status || 500, {
    error: {
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
      status: err.status || 500,
    },
  });
};
// Add catch-all middleware for unhandled routes
app.use('*', (req, res) => {
  if (!res.headersSent) {
    res.status(404).json({
      error: {
        message: 'Route not found',
        status: 404,
      },
    });
  }
});
// Add error handling middleware last
app.use(errorHandler);
// Modified server startup
let server;
const startServer = async () => {
  try {
    // Verify Redis connection in production
    if (process.env.NODE_ENV === 'production') {
      const redisConnected = await verifyRedisConnection();
      if (!redisConnected) {
        throw new Error('Redis connection failed');
      }
    }

    // Try to kill any existing process, but don't worry if none found
    await killProcessOnPort(PORT);
    // Ensure previous server instance is closed
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    await connectDB();
    logger.info('Connected to MongoDB');

    // Seed interests after database connection
    try {
      await seedInterests();
      logger.info('Interests seeded successfully');
    } catch (seedError) {
      logger.error('Error seeding interests:', seedError);
      // Continue server startup even if seeding fails
    }

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
