const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const schedulesRoutes = require('./routes/schedules');
const analyticsRoutes = require('./routes/analytics');
const barangayRoutes = require('./routes/barangay');

// Core middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://wastewise-brgy-admin.onrender.com',
    'https://wastewise-cenro-admin.onrender.com'
  ],
  credentials: true
}));
app.use(express.json());

// Static files
app.use('/barangay-admin', express.static(path.join(__dirname, '..', 'frontend/barangay-admin')));
app.use('/cenro-admin', express.static(path.join(__dirname, '..', 'frontend/cenro-admin')));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Import and use your routes...
const { requireAuth } = require('./middleware/auth');

app.use('/api', authRoutes);
app.use(requireAuth);
app.use('/api', postsRoutes);
app.use('/api', schedulesRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', barangayRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});