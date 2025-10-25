const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path'); 

dotenv.config();

const { errorHandler, notFound } = require('./middleware/errorHandler');
const authRoutes = require('./routers/authRoutes');
const userManagementRoutes = require('./routers/userManagementRoutes');
const adminRoutes = require('./routers/adminRoutes');
const propertiesRoutes = require('./routers/propertiesRoutes');
const bookingsRoutes = require('./routers/bookingsRoutes');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:5500', 'http://localhost:5500'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.get('/health', (req, res) =>
  res.json({ success: true, environment: process.env.NODE_ENV || 'development' })
);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userManagementRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookings', bookingsRoutes);

app.get('/api', (req, res) => {
  res.json({
    success: true,
    version: '1.0.0',
    authEndpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/logout',
      'GET /api/auth/profile',
      'PUT /api/auth/profile',
      'GET /api/auth/verify-email',
      'POST /api/auth/resend-verification'
    ],
    userManagementEndpoints: [
      'GET /api/users',
      'GET /api/users/stats'
    ],
    propertiesEndpoints: [
      'POST /api/properties',
      'GET /api/properties',
      'GET /api/properties/:id',
      'PUT /api/properties/:id',
      'DELETE /api/properties/:id',
      'GET /api/properties/my-properties',
      'GET /api/properties/stats'
    ],
    adminEndpoints: [
      'GET /api/admin/users',
      'GET /api/admin/users/:id',
      'PATCH /api/admin/users/:id/verify-id',
      'GET /api/admin/my-revenue'
    ],
    bookingsEndpoints: [
      'POST /api/bookings',
      'GET /api/bookings',
      'GET /api/bookings/:id',
      'PUT /api/bookings/:id',
      'DELETE /api/bookings/:id',
      'GET /api/bookings/guest/:guest_id',
      'GET /api/bookings/property/:property_id',
      'GET /api/bookings/stats'
    ]
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
