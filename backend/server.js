const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for now to prevent CORS issues on deployment. You can restrict this later.
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pireps', require('./routes/pireps'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/home', require('./routes/home'));

// Career Mode Routes
app.use('/api/career/auth', require('./routes/careerAuth'));
app.use('/api/career/type-ratings', require('./routes/careerTypeRatings'));
app.use('/api/career/flights', require('./routes/careerFlights'));
app.use('/api/career/pireps', require('./routes/careerPireps'));
app.use('/api/career/admin', require('./routes/careerAdmin'));
app.use('/api/career/stats', require('./routes/careerStats'));

// Health check route
app.get('/', (req, res) => {
  res.send('Oman Air Virtual API is running');
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/oman-air-virtual', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
