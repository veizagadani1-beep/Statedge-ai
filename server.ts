import express from "express";
import path from "path";

import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();




async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: "2mb" }));

  // Initialize Gemini AI Client
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing from environment.");
    }
    return new GoogleGenAI({
      apiKey: apiKey || "dummy-key-for-init",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      name: "StatEdge AI Backend",
      timestamp: new Date().toISOString(),
      apiFootballConfigured: Boolean(process.env.API_FOOTBALL_KEY),
    });
  });

  // Temporary API-Football Health Check Endpoint
  app.get("/api/football/health", async (_req, res) => {
    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) {
      return res.status(200).json({
        connected: false,
        status: 401,
        fixturesCount: 0,
        error: "API_FOOTBALL_KEY environment variable is missing",
      });
    }

    try {
      // Date formatted in Europe/Madrid timezone
      const todayMadrid = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date());
      const targetUrl = `https://v3.football.api-sports.io/fixtures?date=${todayMadrid}`;

      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "x-apisports-key": apiKey,
          "User-Agent": "StatEdge-AI-Health/1.0",
        },
      });

      const httpStatus = response.status;
      if (!response.ok) {
        return res.status(200).json({
          connected: false,
          status: httpStatus,
          fixturesCount: 0,
          error: `HTTP ${response.status}: ${response.statusText}`,
        });
      }

      const data = await response.json();

      if (data.errors && Object.keys(data.errors).length > 0 && (!data.response || data.response.length === 0)) {
        const errorMsg = typeof data.errors === 'string'
          ? data.errors
          : Object.entries(data.errors).map(([k, v]) => `${k}: ${v}`).join('; ');
        return res.status(200).json({
          connected: false,
          status: httpStatus,
          fixturesCount: 0,
          error: errorMsg,
        });
      }

      const fixtures = Array.isArray(data.response) ? data.response : [];
      return res.status(200).json({
        connected: true,
        status: httpStatus,
        fixturesCount: fixtures.length,
        todayDate: todayMadrid,
        error: null,
      });
    } catch (err: any) {
      return res.status(200).json({
        connected: false,
        status: 500,
        fixturesCount: 0,
        error: err.message || "Failed to query API-Football",
      });
    }
  });

  // API-Football Proxy & In-Memory Cache Helper
  const cacheMap = new Map<string, { timestamp: number; data: any }>();

  const fetchApiFootball = async (endpoint: string, queryParams: Record<string, string>, ttlSeconds: number = 300) => {
    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) {
      return { apiConnected: false, error: "API_FOOTBALL_KEY environment variable is missing." };
    }

    const queryString = new URLSearchParams(queryParams).toString();
    const targetUrl = `https://v3.football.api-sports.io/${endpoint}?${queryString}`;
    const cacheKey = targetUrl;

    const now = Date.now();
    const cached = cacheMap.get(cacheKey);
    if (cached && now - cached.timestamp < ttlSeconds * 1000) {
      return { apiConnected: true, cached: true, ...cached.data };
    }

    try {
      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "x-apisports-key": apiKey,
          "x-rapidapi-key": apiKey,
          "User-Agent": "StatEdge-AI-Proxy/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`API-Football error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.errors && Object.keys(data.errors).length > 0 && !data.response?.length) {
        console.warn("API-Football response errors:", data.errors);
      }

      cacheMap.set(cacheKey, { timestamp: now, data });
      return { apiConnected: true, cached: false, ...data };
    } catch (err: any) {
      console.error(`API-Football Proxy error for ${endpoint}:`, err.message);
      return { apiConnected: false, error: err.message };
    }
  };

  // API-Football Status Endpoint
  app.get("/api/football/status", async (_req, res) => {
    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) {
      return res.json({
        connected: false,
        message: "API_FOOTBALL_KEY environment variable is missing. Set API_FOOTBALL_KEY in settings or .env.",
      });
    }

    const statusData = await fetchApiFootball("status", {}, 60);
    if (statusData.apiConnected && statusData.response) {
      return res.json({
        connected: true,
        message: "Successfully connected to API-Football v3",
        account: statusData.response.account || {},
        subscription: statusData.response.subscription || {},
      });
    }

    res.json({
      connected: false,
      message: statusData.error || "Failed to authenticate with API-Football key",
    });
  });

  // API-Football Fixtures / Live Matches
  app.get("/api/football/fixtures", async (req, res) => {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") params[key] = value;
    }
    const ttl = params.live ? 30 : 300; // 30 sec for live, 5 min for fixtures
    const data = await fetchApiFootball("fixtures", params, ttl);
    res.json(data);
  });

  // API-Football Standings
  app.get("/api/football/standings", async (req, res) => {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") params[key] = value;
    }
    const data = await fetchApiFootball("standings", params, 1800); // 30 mins
    res.json(data);
  });

  // API-Football Teams
  app.get("/api/football/teams", async (req, res) => {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") params[key] = value;
    }
    const data = await fetchApiFootball("teams", params, 3600); // 1 hour
    res.json(data);
  });

  // API-Football Players / Top Scorers
  app.get("/api/football/players", async (req, res) => {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") params[key] = value;
    }
    const endpoint = req.query.topscorers === "true" ? "players/topscorers" : "players";
    delete params.topscorers;
    const data = await fetchApiFootball(endpoint, params, 3600);
    res.json(data);
  });

  // API-Football Match Statistics
  app.get("/api/football/statistics", async (req, res) => {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") params[key] = value;
    }
    const data = await fetchApiFootball("fixtures/statistics", params, 300);
    res.json(data);
  });

  // API-Football Match Events
  app.get("/api/football/events", async (req, res) => {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") params[key] = value;
    }
    const data = await fetchApiFootball("fixtures/events", params, 120);
    res.json(data);
  });

  // API-Football Match Lineups
  app.get("/api/football/lineups", async (req, res) => {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") params[key] = value;
    }
    const data = await fetchApiFootball("fixtures/lineups", params, 600);
    res.json(data);
  });

  // API-Football Injuries
  app.get("/api/football/injuries", async (req, res) => {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") params[key] = value;
    }
    const data = await fetchApiFootball("injuries", params, 1800);
    res.json(data);
  });

  // API-Football Transfers
  app.get("/api/football/transfers", async (req, res) => {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") params[key] = value;
    }
    const data = await fetchApiFootball("transfers", params, 3600);
    res.json(data);
  });

  // API-Football Trophies
  app.get("/api/football/trophies", async (req, res) => {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") params[key] = value;
    }
    const data = await fetchApiFootball("trophies", params, 3600);
    res.json(data);
  });

  // API-Football Coaches / Managers
  app.get("/api/football/coaches", async (req, res) => {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") params[key] = value;
    }
    const data = await fetchApiFootball("coachs", params, 3600);
    res.json(data);
  });

  // API-Football Venues / Stadiums
  app.get("/api/football/venues", async (req, res) => {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") params[key] = value;
    }
    const data = await fetchApiFootball("venues", params, 3600);
    res.json(data);
  });

  // API-Football Leagues
  app.get("/api/football/leagues", async (req, res) => {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") params[key] = value;
    }
    const data = await fetchApiFootball("leagues", params, 3600);
    res.json(data);
  });

  // API-Football Odds
  app.get("/api/football/odds", async (req, res) => {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") params[key] = value;
    }
    const data = await fetchApiFootball("odds", params, 1800);
    res.json(data);
  });

  // AI Chat & Football Query Endpoint
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, history, context } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "GEMINI_API_KEY environment variable is missing.",
          solution: "Please ensure GEMINI_API_KEY is configured in Secrets settings.",
        });
      }

      const ai = getAiClient();
      const systemInstruction = `You are StatEdge AI, an elite sports analytics assistant and expert football strategist. 
Your goal is to provide deeply analytical, statistical, and tactical football insights.
Maintain a sharp, data-driven, professional yet engaging tone.
When analyzing teams or players, refer to key metrics like xG (Expected Goals), xA (Expected Assists), PPDA (Passes Per Defensive Action), field tilt, possession percentage, clean sheet ratios, and tactical pressing triggers.
Format your responses using clean Markdown with bullet points, bold key stats, and actionable tactical takeaways.
Selected App Context: ${context ? JSON.stringify(context) : "General Football Analytics"}`;

      // Build chat contents
      const promptText = `User Question: ${message}

Provide a comprehensive, data-backed analysis and tactical breakdown.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: promptText,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ reply: response.text || "No response generated." });
    } catch (err: any) {
      console.error("Gemini Chat Error:", err);
      res.status(500).json({ error: err.message || "Failed to process AI request" });
    }
  });

  // AI Match Prediction Endpoint
  app.post("/api/gemini/predict", async (req, res) => {
    try {
      const { homeTeam, awayTeam, venue, league, homeForm, awayForm } = req.body;
      if (!homeTeam || !awayTeam) {
        return res.status(400).json({ error: "Home and Away teams are required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not configured in environment.",
        });
      }

      const ai = getAiClient();
      const prompt = `Perform an in-depth match prediction and tactical intelligence report for:
Home Team: ${homeTeam} (Form: ${homeForm || "W-W-D-L-W"})
Away Team: ${awayTeam} (Form: ${awayForm || "D-W-W-W-L"})
Competition: ${league || "Top European League"}
Venue: ${venue || "Home Stadium"}

Provide a detailed response in JSON format with the following keys:
{
  "predictedScore": "e.g. 2 - 1",
  "winProbabilities": {
    "homeWin": 48,
    "draw": 26,
    "awayWin": 26
  },
  "expectedGoals": {
    "homeXG": "1.85",
    "awayXG": "1.20"
  },
  "keyMatchup": "Description of key tactical battle on the pitch",
  "tacticalInsight": "3-4 sentences breaking down how the match will be won or lost (e.g. counter-attack vs high press)",
  "recommendedBet": "Insightful analytical market perspective (e.g., Over 2.5 Goals / Both Teams To Score)",
  "keyPlayersToWatch": ["Player 1", "Player 2"],
  "riskFactor": "Low / Medium / High factor affecting outcome (e.g., key injuries or fatigue)"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.6,
        },
      });

      const responseText = response.text || "{}";
      const parsedData = JSON.parse(responseText);
      res.json({ prediction: parsedData });
    } catch (err: any) {
      console.error("Gemini Predict Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate prediction" });
    }
  });

  // Vite development middleware vs production static files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[StatEdge AI Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
