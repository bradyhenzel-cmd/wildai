const express = require("express");
const cors = require("cors");
require("dotenv").config();
const Anthropic = require("@anthropic-ai/sdk");

const app = express();
app.use(cors());
app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post("/chat", async (req, res) => {
  const { messages, system } = req.body;
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: system || "You are WildAI, an expert hunting and fishing assistant. Give practical, specific, confident advice like a seasoned outdoorsman. Use **bold** for key terms. Keep responses concise and useful.",
    messages,
  });
  res.json({ reply: response.content[0].text });
});

app.post("/regulations", async (req, res) => {
  const { state } = req.body;
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{
      role: "user",
      content: `Give me a detailed hunting and fishing regulations overview for ${state}. Cover: 1) Deer/Big Game seasons and bag limits, 2) Turkey seasons, 3) Waterfowl & Upland Bird seasons, 4) Fishing regulations and license fees, 5) Key rules every hunter/angler must know, 6) Where to get official regulations and buy licenses. Use **bold** for dates, limits, and key terms. Be specific. End with a reminder to verify with the state agency.`
    }]
  });
  res.json({ regulations: response.content[0].text });
});

app.listen(3001, () => console.log("Server running on port 3001"));