
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let clients = []; 

app.get('/events', (req, res) => {
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
  
  clients.push(res);
  req.on('close', () => { clients = clients.filter(c => c !== res); });
});

app.post('/api/sheet-webhook', (req, res) => {
  const incomingJson = req.body;
  console.log("⚡ Sheet Change Detected! Broadcasting new JSON layout.");

  clients.forEach(client => client.write(`data: ${JSON.stringify(incomingJson)}\n\n`));
  
  res.status(200).send("Broadcast complete.");
});

app.listen(3000, () => console.log('Stream server running on port 3000'));
