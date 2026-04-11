const express = require("express");
const cors = require("cors");
require("dotenv").config();
const Anthropic = require("@anthropic-ai/sdk");

const app = express();
app.use(cors());
app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post("/chat", async (req, res) => {
  const { messages } = req.body;
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: "You are WildAI, an expert hunting and fishing assistant. You have deep knowledge of hunting tactics, fishing techniques, gear recommendations, wildlife behavior, seasons, regulations across US states, trip planning, and public land navigation. Give practical, specific, confident advice like a seasoned outdoorsman would. Keep responses concise and useful.",
    messages,
  });
  res.json({ reply: response.content[0].text });
});

app.listen(3001, () => console.log("Server running on port 3001"));