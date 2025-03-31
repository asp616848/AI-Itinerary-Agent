const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); // npm install node-fetch@2
const bodyParser = require("body-parser");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

app.post("/generate", async (req, res) => {
  const requestBody = req.body;

  try {
    // Forward request to Ollama
    const upstreamResponse = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.1",
        prompt: `Generate itinerary: ${JSON.stringify(requestBody)}`,
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
      // This regex finds a JSON object that starts with '{' and ends with '}'.
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
      // If the last character is '}', we can clear the buffer.
      // Otherwise, keep the remainder (which may be an incomplete JSON object).
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
