const express = require("express");
const cors = require("cors");
require("dotenv").config();
const Anthropic = require("@anthropic-ai/sdk");
const Stripe = require("stripe");
const { createClerkClient } = require("@clerk/backend");

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

app.use(cors());

// Raw body needed for Stripe webhooks
app.use("/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Simple in-memory cache
const cache = {};

async function callAnthropicWithRetry(params, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await client.messages.create(params);
        } catch (err) {
            if (err.status === 529 && i < retries - 1) {
                await new Promise(r => setTimeout(r, delay * (i + 1)));
                continue;
            }
            throw err;
        }
    }
}

app.post("/chat", async (req, res) => {
    const { messages, system } = req.body;
    try {
        const response = await callAnthropicWithRetry({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            system: system || "You are WildAI, an expert hunting and fishing assistant. Give practical, specific, confident advice like a seasoned outdoorsman. Use **bold** for key terms. Keep responses concise and useful.",
            messages,
        });
        res.json({ reply: response.content[0].text });
    } catch (err) {
        res.status(529).json({ error: "AI is overloaded. Please try again." });
    }
});

app.post("/regulations", async (req, res) => {
    const { state } = req.body;
    const cacheKey = `regs-${state}`;
    if (cache[cacheKey]) return res.json({ regulations: cache[cacheKey] });
    try {
        const response = await callAnthropicWithRetry({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1500,
            messages: [{
                role: "user",
                content: `Give me a detailed hunting and fishing regulations overview for ${state}. Cover: 1) Deer/Big Game seasons and bag limits, 2) Turkey seasons, 3) Waterfowl & Upland Bird seasons, 4) Fishing regulations and license fees, 5) Key rules every hunter/angler must know, 6) Where to get official regulations and buy licenses. Use **bold** for dates, limits, and key terms. Be specific. End with a reminder to verify with the state agency.`
            }]
        });
        const text = response.content[0].text;
        cache[cacheKey] = text;
        setTimeout(() => delete cache[cacheKey], 1000 * 60 * 60 * 24);
        res.json({ regulations: text });
    } catch (err) {
        res.status(529).json({ error: "AI is overloaded. Please try again." });
    }
});

app.post("/create-checkout", async (req, res) => {
    const { userId } = req.body;
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [{
                price: process.env.STRIPE_PRICE_ID,
                quantity: 1,
            }],
            mode: "subscription",
            success_url: "https://wildai.netlify.app?upgraded=true",
            cancel_url: "https://wildai.netlify.app",
            metadata: { userId },
        });
        res.json({ url: session.url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post("/customer-portal", async (req, res) => {
    const { customerId } = req.body;
    try {
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: "https://wildai.netlify.app",
        });
        res.json({ url: session.url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post("/webhook", async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (userId) {
            await clerk.users.updateUserMetadata(userId, {
                publicMetadata: { isPro: true, stripeCustomerId: session.customer }
            });
        }
    }

    if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const users = await clerk.users.getUserList({ limit: 100 });
        const user = users.data.find(u => u.publicMetadata?.stripeCustomerId === customerId);
        if (user) {
            await clerk.users.updateUserMetadata(user.id, {
                publicMetadata: { isPro: false }
            });
        }
    }

    res.json({ received: true });
});

app.listen(3001, () => console.log("Server running on port 3001"));