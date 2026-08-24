const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*'
}));

app.use(express.json({ limit: '50mb' }));

const uri = process.env.MONGODB_URI; 
const client = new MongoClient(uri);

let clients = [];

async function startServer() {
  try {
    await client.connect();
    console.log("Successfully connected to MongoDB Atlas");

    const db = client.db('house_comp'); 
    const scoresCollection = db.collection('scores'); 

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
