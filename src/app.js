import express from 'express';
import 'module-alias/register';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from '@routes/authRoutes';
import logger from '@config/logger';
import session from 'express-session';
import passport from 'passport';
import passportConfig from '@config/passport';
import connectDB from '@config/database';

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

// Routes
app.use('/api/auth', authRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Express Server with Alias support!' });
});

// Add error handling middleware last
app.use(errorHandler);

// Modified server startup
const startServer = async () => {
  try {
    await connectDB();
    logger.info('Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
