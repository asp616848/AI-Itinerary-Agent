const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const bodyParser = require("body-parser");
const SerpApi = require('google-search-results-nodejs');

const app = express();
const PORT = 5000;
require('dotenv').config();  // This loads your .env file into process.env

// Initialize SerpApi client

const serpApi = new SerpApi.GoogleSearch(process.env.SERP);

app.use(cors({
  origin: "*", // Allow all origins (or set this to your React app URL)
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(bodyParser.json());

// Store chat histories by session ID
const chatSessions = {};

app.post("/generate", async (req, res) => {
  const requestBody = req.body;

  try {
    // Forward request to Ollama
    const upstreamResponse = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
          model: "llama3.1",
          prompt: `You are an AI travel assistant. If the provided data is sufficient, generate a detailed itinerary based on the following input: ${JSON.stringify(requestBody)}. 

Ensure your suggestions are accurate and up-to-date, highlighting the top attractions and activities at the specified destination.

- Align and contextualize these recommendations with the user's stated preferences (e.g., if they prefer 'Hidden Gems,' focus on lesser-known but worthwhile experiences).
- If the provided details are insufficient, ask relevant follow-up questions to personalize the itinerary further.

At the end, include a follow-up question to refine the itinerary based on one of the following aspects:
a. Dietary preferences.
b. Specific interests within the given preferences.
c. Walking tolerance or mobility concerns.
d. Accommodation preferences (luxury, budget, central location, etc.).`
      }),
  });

    if (!upstreamResponse.ok) {
      res
        .status(upstreamResponse.status)
        .json({ error: "Error from upstream server" });
      return;
    }

    // Set header to send plain text to the client.
    res.setHeader("Content-Type", "text/plain");

    let buffer = "";

    upstreamResponse.body.on("data", (chunk) => {
      buffer += chunk.toString();

      // Use a regex to capture complete JSON objects.
      const regex = /(\{.*?\})(?=\{|\s*$)/gs;
      let match;
      while ((match = regex.exec(buffer)) !== null) {
        try {
          const jsonLine = JSON.parse(match[1]);
          // Write only the "response" text to the client.
          res.write(jsonLine.response);
        } catch (e) {
          console.error("Error parsing JSON chunk:", e);
        }
      }

      // Remove processed parts of the buffer.
      const lastBraceIndex = buffer.lastIndexOf("}");
      if (lastBraceIndex !== -1) {
        buffer = buffer.substring(lastBraceIndex + 1);
      }
    });

    upstreamResponse.body.on("end", () => {
      // Attempt to process any remaining buffered data.
      if (buffer.trim().length > 0) {
        try {
          const jsonLine = JSON.parse(buffer);
          res.write(jsonLine.response);
        } catch (e) {
          console.error("Error parsing final JSON chunk:", e);
        }
      }
      res.end();
    });

    upstreamResponse.body.on("error", (error) => {
      console.error("Stream error:", error);
      res.end();
    });
  } catch (error) {
    console.error("Generate endpoint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// New endpoint for chat messages with context
app.post("/chat", async (req, res) => {
  const { sessionId, message, itineraryData } = req.body;

  try {
    // Initialize or retrieve session
    if (!chatSessions[sessionId]) {
      chatSessions[sessionId] = { history: [], itineraryData: itineraryData || {} };
    }

    chatSessions[sessionId].history.push({ role: "user", content: message });

    // Check for flight search intent
    let flightData = null;
    if (detectFlightSearchIntent(message)) {
      const { origin, destination, date } = extractFlightParams(message, chatSessions[sessionId].itineraryData);
      if (origin && destination) {
        flightData = await searchFlights(origin, destination, date);
      }
    }

    // Create chat context
    const context = chatSessions[sessionId].history.map(msg => `${msg.role}: ${msg.content}`).join("\n");
    let prompt = `You are a travel assistant. Here's the chat history:\n${context}\n${flightData ? `Flight options found: ${JSON.stringify(flightData)}\n` : ''}Respond appropriately.`;

    // Forward request to Ollama
    const upstreamResponse = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama3.1", prompt })
    });

    if (!upstreamResponse.ok) {
      res.status(upstreamResponse.status).json({ error: "Error from upstream server" });
      return;
    }

    res.setHeader("Content-Type", "text/plain");
    let buffer = "";

    upstreamResponse.body.on("data", (chunk) => {
      buffer += chunk.toString();
      const regex = /({.*?})(?={|\s*$)/gs;
      let match;
      while ((match = regex.exec(buffer)) !== null) {
        try {
          const jsonLine = JSON.parse(match[1]);
          res.write(jsonLine.response);
        } catch (e) {
          console.error("Error parsing JSON chunk:", e);
        }
      }
      buffer = buffer.substring(buffer.lastIndexOf("}") + 1);
    });

    upstreamResponse.body.on("end", () => {
      if (buffer.trim().length > 0) {
        try {
          const jsonLine = JSON.parse(buffer);
          res.write(jsonLine.response);
        } catch (e) {
          console.error("Error parsing final JSON chunk:", e);
        }
      }
      res.end();
    });

    upstreamResponse.body.on("error", (error) => {
      console.error("Stream error:", error);
      res.end();
    });
  } catch (error) {
    console.error("Chat endpoint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Helper function to detect if message is asking about flights
function detectFlightSearchIntent(message) {
  const flightKeywords = ['flight', 'fly', 'plane', 'airport', 'airline', 'ticket'];
  return flightKeywords.some(keyword => message.toLowerCase().includes(keyword));
}

// Helper function to extract flight parameters from message
function extractFlightParams(message, itineraryData) {
  // Default to itinerary destination if available
  const destination = itineraryData.destination || null;
  
  // Simple regex to extract potential city names and dates
  // In a production app, you would use a more sophisticated NLP approach
  const originMatch = message.match(/from\s+([A-Za-z\s]+?)(?:\s+to|\s+on|\s+at|$)/i);
  const destMatch = message.match(/to\s+([A-Za-z\s]+?)(?:\s+from|\s+on|\s+at|$)/i);
  const dateMatch = message.match(/on\s+([A-Za-z0-9\s,]+?)(?:\s+from|\s+to|$)/i);
  
  return {
    origin: originMatch ? originMatch[1].trim() : null,
    destination: destMatch ? destMatch[1].trim() : destination,
    date: dateMatch ? dateMatch[1].trim() : null
  };
}

// Function to search flights using SerpApi
async function searchFlights(origin, destination, date) {
  return new Promise((resolve, reject) => {
    const params = {
      engine: "google_flights",
      departure_id: origin,
      arrival_id: destination
    };
    
    if (date) {
      params.outbound_date = date;
    }
    
    serpApi.json(params, (data) => {
      if (data.error) {
        reject(data.error);
      } else {
        resolve(data.best_flights || []);
      }
    });
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
