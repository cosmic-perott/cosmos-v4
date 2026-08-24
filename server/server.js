// Load environment variables locally if a .env file exists
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');       // Added for login authentication
const bcrypt = require('bcryptjs');        // Added for secure password hashing

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*'
}));

app.use(express.json({ limit: '50mb' }));

// Safety check to prevent the .startsWith() crash
const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!uri) {
  console.error("FATAL ERROR: MONGO_URI is missing in your environment variables or .env file!");
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_change_me';
const client = new MongoClient(uri);

let clients = [];

// Authentication Middleware to protect routes
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token." });
    req.user = user;
    next();
  });
}

async function startServer() {
  try {
    await client.connect();
    console.log("Successfully connected to MongoDB Atlas");

    const db = client.db('house_comp'); 
    const scoresCollection = db.collection('scores'); 
    const usersCollection = db.collection('users'); // Collection for admin users

    // Auto-create a default admin user for testing purposes
    const adminExists = await usersCollection.findOne({ username: "admin" });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("password123", 10);
      await usersCollection.insertOne({ username: "admin", password: hashedPassword });
      console.log("Default test user created: admin / password123");
    }

    // --- AUTHENTICATION ENDPOINTS ---

    // Register a new admin user
    app.post('/api/register', async (req, res) => {
      try {
        const { username, password } = req.body;
        if (!username || !password) {
          return res.status(400).json({ error: "Username and password are required." });
        }

        const existingUser = await usersCollection.findOne({ username });
        if (existingUser) {
          return res.status(400).json({ error: "User already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await usersCollection.insertOne({ username, password: hashedPassword });
        
        res.status(201).json({ message: "User registered successfully." });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Login endpoint
    app.post('/api/login', async (req, res) => {
      try {
        const { username, password } = req.body;
        const user = await usersCollection.findOne({ username });
        if (!user) {
          return res.status(400).json({ error: "Invalid username or password." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ error: "Invalid username or password." });
        }

        // Create a JWT token valid for 2 hours
        const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '2h' });
        res.json({ message: "Login successful", token });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // --- EXISTING APP ENDPOINTS ---

    // Server-Sent Events endpoint for real-time frontend updates
    app.get('/events', (req, res) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      clients.push(res);
      req.on('close', () => { clients = clients.filter(c => c !== res); });
    });

    // Webhook receiving raw rows directly from Google Apps Script
    app.post('/api/sheet-webhook', async (req, res) => {
      const { games } = req.body;
      console.log("⚡ Webhook received direct score update from sheet.");

      if (!games || !Array.isArray(games)) {
        return res.status(400).send("Invalid or empty games payload.");
      }

      try {
        // Save structured data directly into MongoDB Atlas
        await scoresCollection.deleteMany({});
        if (games.length > 0) {
          await scoresCollection.insertMany(games);
        }
        console.log(`Synced ${games.length} games to database.`);

        // Broadcast update to client SSE connections
        clients.forEach(c => c.write(`data: ${JSON.stringify({ updated: true })}\n\n`));
        res.status(200).send("Sync complete.");
      } catch (err) {
        console.error("Database save failed:", err.message);
        res.status(500).send("Database error.");
      }
    });

    app.get('/api/scores', async (req, res) => {
      try {
        const data = await scoresCollection.find({}).toArray();
        res.json(data);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

  } catch (e) {
    console.error("Critical server boot crash:", e);
  }
}

startServer();
