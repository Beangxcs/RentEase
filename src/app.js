const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path'); // ✅ added

dotenv.config();

const { errorHandler, notFound } = require('./middleware/errorHandler');
const authRoutes = require('./routers/authRoutes');
const userManagementRoutes = require('./routers/userManagementRoutes');
const adminRoutes = require('./routers/adminRoutes');
const itemsRoutes = require('./routers/itemsRoutes');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.get('/health', (req, res) =>
  res.json({ success: true, environment: process.env.NODE_ENV || 'development' })
);

// ✅ Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userManagementRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/admin', adminRoutes);

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
    itemsEndpoints: [
      'POST /api/items',
      'GET /api/items',
      'GET /api/items/:id',
      'PUT /api/items/:id',
      'DELETE /api/items/:id',
      'GET /api/items/my-items',
      'GET /api/items/stats'
    ],
    adminEndpoints: [
      'GET /api/admin/users',
      'GET /api/admin/users/:id',
      'PATCH /api/admin/users/:id/verify-id'
    ]
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
