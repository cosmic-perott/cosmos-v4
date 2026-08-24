// server.js
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); 

const client = new MongoClient(process.env.MONGO_URI); // or process.env.MONGODB_URI

async function startServer() {
  try {
    await client.connect();

    const db = client.db('house_comp'); 
    const scoresCollection = db.collection('scores'); 

    const count = await scoresCollection.countDocuments();
    if (count === 0) {
      
      const defaultData = [
        {
          game_name: "Track and Field",
          sarah_score: 12,
          jeoji_score: 15,
          mulchat_score: 8,
          geomun_score: 20,
          noro_score: 14,
          ranking: "Geomun"
        },
        {
          game_name: "Swimming",
          sarah_score: 18,
          jeoji_score: 10,
          mulchat_score: 14,
          geomun_score: 9,
          noro_score: 22,
          ranking: "Noro"
        }
      ];

      await scoresCollection.insertMany(defaultData);
    } else {
    }

    app.get('/api/scores', async (req, res) => {
      try {
        const data = await scoresCollection.find({}).toArray();
        res.json(data);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.post('/api/scores', async (req, res) => {
      try {
        const newGame = {
          game_name: req.body.game_name,
          sarah_score: Number(req.body.sarah_score) || 0,
          jeoji_score: Number(req.body.jeoji_score) || 0,
          mulchat_score: Number(req.body.mulchat_score) || 0,
          geomun_score: Number(req.body.geomun_score) || 0,
          noro_score: Number(req.body.noro_score) || 0,
          ranking: req.body.ranking || "No comments"
        };

        const result = await scoresCollection.insertOne(newGame);
        res.status(201).json({ message: "Game successfully saved to MongoDB!", id: result.insertedId });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Start listening
    app.listen(3000, () => console.log('running on port 3000'));

  } catch (e) {
    console.error("connection failed", e);
  }
}

startServer();
