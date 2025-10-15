const app = require('./app');
const connectDB = require('./configs/database');


require('dotenv').config();

const PORT = process.env.PORT || 5000;


const startServer = async () => {
  try {
    await connectDB();
    console.log('Database connection established successfully!');

    const server = app.listen(PORT, () => {
      console.log(`Server is now running on port ${PORT}`);
      console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(``);
      console.log(`You can now access your app at:`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API documentation: http://localhost:${PORT}/api`);
      console.log(`Main app: http://localhost:${PORT}`);
      console.log(``);
      console.log(`Press Ctrl+C to stop the server`);
    });

    process.on('unhandledRejection', (err, promise) => {
      console.error('Unhandled Promise Rejection:', err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err.message);
      process.exit(1);
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
