const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();

// Enable CORS for your deployed frontend origin
app.use(cors({
  origin: process.env.FRONTEND_URL || '*' // Allows local testing or sets to Vercel URL
}));

app.use(express.json({ limit: '50mb' }));

// Use Environment Variables for secrets
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const uri = process.env.MONGODB_URI; 
const client = new MongoClient(uri);

let clients = [];
let isCooldown = false;
let bufferedData = null;
const COOLDOWN_TIME = 15000; // 15 seconds

async function startServer() {
  try {
    await client.connect();
    console.log("Successfully connected to MongoDB Atlas");

    const db = client.db('house_comp'); 
    const scoresCollection = db.collection('scores'); 

    app.get('/events', (req, res) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      clients.push(res);
      req.on('close', () => { clients = clients.filter(c => c !== res); });
    });

    async function processWithGeminiAndSave(rowsData) {
      try {
        isCooldown = true;
        console.log("matrix into Gemini");

        const cleanSpreadsheetText = rowsData.map(row => row.map(c => c.value).join(" | ")).join("\n");

        const response = await ai.models.generateContent({
          model: 'models/gemini-2.5-flash',
          config: {
            responseMimeType: 'application/json'
          },
          contents: `You are an internal school database compiler. Analyze this raw text data extracted from a spreadsheet.
          Find rows containing sports matches or house competitions. There are multiple players per team, meaning there will be multiple individual scores contributed to a single team.
          
          Your job is to find the scores that each individual player got (NOT the overall rank or place numbers). Group those players under their respective house team arrays, and calculate the cumulative overall house rank positions.
          There may be multiple games present in the text, in which case you must output multiple object dictionaries in the root JSON array.
          
          Data Parsing Rules:
          - score: The individual raw physical score or metric value each player got.
          - rank for a player: The specific place ranking that the player placed in within their match. If not explicitly stated, calculate it using the title/nature of the game (e.g. if it is a track running race, the person with the lowest time is 1st place. If it is shotput, the person with the highest throw distance score is 1st place).
          - rank for a team: The overall house rank position (1, 2, 3, 4, or 5). If not explicitly stated in the sheet, calculate each team's aggregate overall rank positioning based on their player's combined individual ranks and placements.
          - unit: The measuring metric unit of the game (e.g. 'seconds', 'm', 'points'). If not explicitly stated, find or logically infer the unit using the title of the game.

          You MUST output a strict, valid JSON array matching this exact nested schema structure, without markdown wraps, blocks, or prose:
          if you cannot find player name just use player_1, player_2 and so on
          [
            {
              "game_name": "Name of Game (e.g. Boys 100m Sprint)",
              "teams": {
                "sarah": [{"player_name": "String", "score": number, "rank": number, "unit": "String"}],
                "jeoji": [{"player_name": "String", "score": number, "rank": number, "unit": "String"}],
                "mulchat": [{"player_name": "String", "score": number, "rank": number, "unit": "String"}],
                "geomun": [{"player_name": "String", "score": number, "rank": number, "unit": "String"}],
                "noro": [{"player_name": "String", "score": number, "rank": number, "unit": "String"}]
              },
              "total_house_rank": {
                "sarah": number,
                "jeoji": number,
                "mulchat": number,
                "geomun": number,
                "noro": number
              },
              "unit": "The unit being used to measure the score. If it is running/swimming track events, use 'seconds'. If it is a field throwing/jumping event, use 'm'. Look for the unit in the sheet text, or use common sense based on the game name to assign it.",
              "ranking": "Short text stating who is leading based on the calculation rules of the unit (e.g. 'Mulchat is leading' or 'Geomun is leading')"
            }
          ]

          Here is the raw data:\n${cleanSpreadsheetText}`,
        });

        const cleanJsonString = response.text.trim();
        const extractedGames = JSON.parse(cleanJsonString);
        console.log(`✨ Gemini finished parsing. Found ${extractedGames.length} multi-player games.`);

        if (extractedGames.length > 0) {
          await scoresCollection.deleteMany({});
          await scoresCollection.insertMany(extractedGames);
          console.log(`synced`);
        }

        clients.forEach(client => client.write(`data: ${JSON.stringify({ rows: rowsData })}\n\n`));

      } catch (err) {
        console.error("Processing Engine Failure:", err.message);
      } finally {
        setTimeout(() => {
          console.log("cool-down expired.");
          
          if (bufferedData) {
            console.log("Processing latest sheet state");
            const nextBatch = bufferedData;
            bufferedData = null; 
            processWithGeminiAndSave(nextBatch);
          } else {
            console.log("System Idle");
            isCooldown = false;
          }
        }, COOLDOWN_TIME);
      }
    }

    app.post('/api/sheet-webhook', (req, res) => {
      const { rows } = req.body;
      console.log("⚡ Webhook detected spreadsheet update.");

      if (!rows || rows.length === 0) return res.status(400).send("No data.");

      if (isCooldown) {
        console.log("System cooling down.");
        bufferedData = rows; 
      } else {
        processWithGeminiAndSave(rows);
      }

      res.status(200).send("Handled by buffer queue.");
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
