const express = require("express");
const cors = require("cors");
require("dotenv").config();
const Anthropic = require("@anthropic-ai/sdk");
const Stripe = require("stripe");
const { createClerkClient } = require("@clerk/backend");
const webpush = require("web-push");

webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

app.use(cors());

// Raw body needed for Stripe and Clerk webhooks
app.use("/webhook", express.raw({ type: "application/json" }));
app.use("/clerk-webhook", express.raw({ type: "application/json" }));
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
            success_url: "https://wildai.app?upgraded=true",
            cancel_url: "https://wildai.app",
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
            return_url: "https://wildai.app",
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

app.post("/scrape-regulations", async (req, res) => {
    const { state, huntingUrl, fishingUrl } = req.body;
    try {
        let rawText = "";
        try {
            const r = await fetch(huntingUrl, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) });
            const html = await r.text();
            rawText += html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").slice(0, 8000);
        } catch { rawText += `Could not fetch ${huntingUrl}. `; }
        const response = await callAnthropicWithRetry({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{
                role: "user",
                content: `Based on this official ${state} wildlife agency content, extract the key hunting and fishing regulations. Return ONLY a JSON object with three keys: "hunting" (key species, season dates, bag limits - max 300 chars), "fishing" (key species, seasons, size/bag limits - max 300 chars), "general" (license costs, hunter ed requirements, key notes - max 300 chars). If content is insufficient, use your best knowledge of ${state} regulations for ${new Date().getFullYear()}. No markdown, just JSON.\n\nContent: ${rawText}`
            }]
        });
        const text = response.content[0].text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(text);
        res.json({ success: true, data: parsed });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

async function sendPushToUser(userId, payload) {
    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { data } = await supabase.from("push_subscriptions").select("subscription").eq("user_id", userId).single();
    if (!data?.subscription) return;
    try {
        await webpush.sendNotification(data.subscription, JSON.stringify(payload));
        console.log("Push sent to", userId);
    } catch (err) {
        console.error("Push error:", err.statusCode, err.message);
        if (err.statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("user_id", userId);
        }
    }
}

app.post("/messages/send", async (req, res) => {
    const { sender_id, recipient_id, content, image_url, pin_lat, pin_lng, pin_name } = req.body;
    if (!sender_id || !recipient_id) return res.status(400).json({ error: "Missing fields" });
    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { data, error } = await supabase.from("messages").insert([{ sender_id, recipient_id, content, image_url, pin_lat, pin_lng, pin_name }]).select().single();
    if (error) return res.status(500).json({ error: error.message });

    sendPushToUser(recipient_id, {
        title: "New Message",
        body: content ? (content.length > 60 ? content.slice(0, 60) + "…" : content) : "📎 Attachment",
        url: "/",
    }).catch(() => { });

    res.json(data);
});

app.get("/messages/conversation/:otherId", async (req, res) => {
    const { userId } = req.query;
    const { otherId } = req.params;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { data, error } = await supabase.from("messages").select("*")
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${userId})`)
        .order("created_at", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.get("/messages/inbox", async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { data, error } = await supabase.from("messages").select("*")
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    const threads = {};
    (data || []).forEach(msg => {
        const otherId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
        if (!threads[otherId]) threads[otherId] = { otherId, lastMessage: msg, unread: 0 };
        if (!msg.read && msg.recipient_id === userId) threads[otherId].unread++;
    });
    res.json(Object.values(threads));
});

app.post("/messages/mark-read", async (req, res) => {
    const { userId, otherId } = req.body;
    if (!userId || !otherId) return res.status(400).json({ error: "Missing params" });
    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    await supabase.from("messages").update({ read: true }).eq("recipient_id", userId).eq("sender_id", otherId).eq("read", false);
    res.json({ ok: true });
});

app.post("/push/like", async (req, res) => {
    const { post_owner_id, liker_username } = req.body;
    if (!post_owner_id) return res.status(400).json({ error: "Missing post_owner_id" });
    await sendPushToUser(post_owner_id, {
        title: "New Like ❤️",
        body: `${liker_username || "Someone"} liked your post`,
        url: "/",
    }).catch(() => { });
    res.json({ ok: true });
});

app.post("/push/follow", async (req, res) => {
    const { followed_id, follower_username } = req.body;
    if (!followed_id) return res.status(400).json({ error: "Missing followed_id" });
    await sendPushToUser(followed_id, {
        title: "New Follower 🎯",
        body: `${follower_username || "Someone"} followed you`,
        url: "/",
    }).catch(() => { });
    res.json({ ok: true });
});

app.post("/clerk-webhook", async (req, res) => {
    const { Webhook } = require("svix");
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    const headers = { "svix-id": req.headers["svix-id"], "svix-timestamp": req.headers["svix-timestamp"], "svix-signature": req.headers["svix-signature"] };
    try {
        const wh = new Webhook(secret);
        const evt = wh.verify(req.body, headers);
        if (evt.type === "user.updated" || evt.type === "user.created") {
            const { createClient } = require("@supabase/supabase-js");
            const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
            const { id, username, first_name, image_url } = evt.data;
            const finalUsername = username || first_name || "Hunter";
            await supabase.from("profiles").upsert({ user_id: id, username: finalUsername, avatar_url: image_url, avatar_updated_at: new Date().toISOString() }, { onConflict: "user_id" });
        }
        res.json({ received: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.listen(3001, () => console.log("Server running on port 3001"));