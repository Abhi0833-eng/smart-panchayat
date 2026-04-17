const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// CORS — must be before routes
app.use(cors({
  origin: ['https://smart-panchayat-six.vercel.app', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch((err) => console.log('DB Error:', err.message));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/complaints', require('./routes/complaints'));

app.get('/', (req, res) => {
  res.json({ message: 'Smart Panchayat Server is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});