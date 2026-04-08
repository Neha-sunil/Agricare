const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
const preCareRoutes = require('./routes/preCareRoutes');
app.use('/api/precare', preCareRoutes);

// Test Route
app.get('/', (req, res) => {
  res.send('AgriCare Pre-Care API is running...');
});

// Error handling for unknown routes
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Pre-Care Backend running on http://localhost:${PORT}`);
});
