const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const User = require('./models/User'); 

// .env file 
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

// Routes ko istemal karein
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

// Database 
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    
    const seedAdminAccount = async () => {
      try {
        const adminEmail = 'admin@library.com';
        const adminExists = await User.findOne({ email: adminEmail });

        if (!adminExists) {
          console.log('Admin account not found. Seeding admin account...');
          const adminUser = new User({
            username: 'admin',
            email: adminEmail,
            password: 'admin123', // Password hash 
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin'
          });
          await adminUser.save();
          console.log('✅ Admin account seeded successfully!');
        } else {
          console.log('Admin account already exists. Skipping seed.');
        }
      } catch (error) {
        console.error('❌ Error during admin account seeding:', error.message);
      }
    };
    
    
    seedAdminAccount();
    // ------------------------------------

   
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); 
  });

module.exports = server;