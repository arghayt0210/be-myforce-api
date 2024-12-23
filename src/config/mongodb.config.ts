export const mongoConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/be-my-force-db',
  options: {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },
};