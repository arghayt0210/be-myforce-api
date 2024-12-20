import express from 'express';
import 'module-alias/register';
import userRoutes from '@routes/userRoutes';
import logger from '@config/logger';
const app = express();
const PORT = process.env.PORT || 8000;
app.use(express.json());

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
app.use('/api/users', userRoutes);
// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Express Server with Alias support!' });
});
// Add error handling middleware last
app.use(errorHandler);
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
