import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { v4 as uuidv4 } from "uuid"; // You'll need to install this package
import "./index.css";

const App = () => {
  const [formData, setFormData] = useState({
    budget: "Affordable",
    customBudget: "",
    currency: "USD",
    duration: "",
    address: "",
    destination: "",
    purpose: "Leisure",
    customPurpose: "",
    preferences: "",
  });
  const [itinerary, setItinerary] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [abortController, setAbortController] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const chatBoxRef = useRef(null);
  const [itineraryData, setItineraryData] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const itineraryMarkdown = document.getElementById("itinerary-markdown-output")?.innerText || "";

  useEffect(() => {
    setItineraryData(itineraryMarkdown);
  }, [itineraryMarkdown]);


  // Initialize session ID on component mount
  useEffect(() => {
    setSessionId(uuidv4());
  }, []);

  useEffect(() => {
    if (itinerary) {
      // Timeout to ensure the DOM has updated before scrolling
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }, 100);
    }
  }, [itinerary]);
  
  // Auto-scroll chat when new messages are added
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setItinerary("");
    const controller = new AbortController();
    setAbortController(controller);
  
    try {
      const budgetValue =
        formData.budget === "Custom"
          ? `${formData.customBudget} ${formData.currency}`
          : formData.budget;
      const purposeValue =
        formData.purpose === "Other" ? formData.customPurpose : formData.purpose;
  
      const requestBody = {
        budget: budgetValue,
        duration: formData.duration,
        destination: formData.destination,
        purpose: purposeValue,
        preferences: formData.preferences,
        ...(formData.address && { address: formData.address }),
      };
  
      const response = await fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal, 
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      if (!response.body) {
        throw new Error("ReadableStream not supported in this browser.");
      }
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = "";
  
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
        setItinerary(result); // Update itinerary text as it streams in.
      }
      
      // Clear chat messages when a new itinerary is generated
      setChatMessages([]);
    } catch (error) {
      console.error("Fetch error:", error);
      if (error.name !== 'AbortError' && !itinerary) {
        setItinerary("Failed to connect to server. Please try again later.");
      }
    }
  
    setLoading(false);
    setAbortController(null);
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort(); // Stop the fetch request
      setAbortController(null);
      setLoading(false);
    }
  };
  
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    setChatLoading(true);
  
    const userMessage = { sender: "You", text: userInput };
    setChatMessages((prev) => [...prev, userMessage]); // Add user's message
    
    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: userInput,
          itineraryData, // Make sure this is defined
          chatHistory,   // Make sure this is defined
        }),
      });
  
      if (!response.body) return;
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let incomingMessage = "";
  
      setChatMessages((prev) => [...prev, { sender: "AI", text: "" }]); // Initialize AI message
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        incomingMessage += decoder.decode(value, { stream: true });
        
        setChatMessages((prev) =>
          prev.map((msg, index) =>
            index === prev.length - 1 ? { ...msg, text: incomingMessage } : msg
          )
        );
      }
    } catch (error) {
      console.error("Error:", error);
      setChatMessages((prev) => [
        ...prev,
        { sender: "AI", text: "An error occurred while processing your request." },
      ]);
    }
  
    setChatLoading(false);
    setUserInput(""); // Clear input field after sending
  };
  
  
  
  
  // Helper function to format flight data
  const formatFlightData = (flightData) => {
    if (!flightData || flightData.length === 0) {
      return "No flight data available.";
    }
    
    return `**Flight Options:**\n\n${flightData.map((flight, index) => `
**Option ${index + 1}**
- Price: ${flight.price || 'N/A'}
- Duration: ${flight.total_duration || 'N/A'}
- Type: ${flight.type || 'N/A'}
${flight.flights ? `- Flights: ${flight.flights.length}` : ''}
`).join('\n')}`;
  };

  return (
    <div className="container">
      
      <h1>Travel Itinerary Generator</h1>
      <form onSubmit={handleSubmit}>
        <label>Budget:</label>
        <select name="budget" value={formData.budget} onChange={handleChange}>
          <option value="Luxury">Luxury</option>
          <option value="Premium">Premium</option>
          <option value="Affordable">Affordable</option>
          <option value="Backpacker">Backpacker</option>
          <option value="Custom">Custom</option>
        </select>
        {formData.budget === "Custom" && (
          <div className="inline-fields">
            <input
              type="number"
              name="customBudget"
              value={formData.customBudget}
              onChange={handleChange}
              required
              placeholder="e.g., 500"
            />
            <select name="currency" value={formData.currency} onChange={handleChange}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="INR">INR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        )}

        <label>Duration (in days):</label>
        <input
          type="number"
          name="duration"
          value={formData.duration}
          onChange={handleChange}
          required
          placeholder="e.g., 7"
        />

        <label>Destination:</label>
        <input
          type="text"
          name="destination"
          value={formData.destination}
          onChange={handleChange}
          required
          placeholder="e.g., Paris, France"
        />

        <label>Address (optional):</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="e.g., 221B Baker Street, London"
        />

        <label>Purpose:</label>
        <select name="purpose" value={formData.purpose} onChange={handleChange}>
          <option value="Leisure">Leisure</option>
          <option value="Business">Business</option>
          <option value="Adventure">Adventure</option>
          <option value="Cultural">Cultural</option>
          <option value="Other">Other</option>
        </select>
        {formData.purpose === "Other" && (
          <input
            type="text"
            name="customPurpose"
            value={formData.customPurpose}
            onChange={handleChange}
            required
            placeholder="e.g., Family Reunion"
          />
        )}

        <label>Preferences (optional):</label>
        <input
          type="text"
          name="preferences"
          value={formData.preferences}
          onChange={handleChange}
          placeholder="e.g., Vegetarian food, Hiking trails"
        />
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Generating..." : "Generate Itinerary"}
        </button>
        {loading && (
          <div className="button-container">
            <button type="button" className="stop-btn" onClick={handleStop}>
              Stop
            </button>
          </div>
        )}
      </form>
      
      {itinerary && (
        <div className="itinerary markdown-output">
          <h2>Your Itinerary</h2>
          <ReactMarkdown>{itinerary}</ReactMarkdown>
        </div>
      )}
      
      {itinerary && (
        <div className="chat-container">
          <h2>Chat with AI</h2>
          <div className="chat-box" ref={chatBoxRef}>
            {chatMessages.map((msg, index) => (
              <div key={index} className={msg.sender === "You" ? "user-msg" : "ai-msg"}>
                <strong>{msg.sender}:</strong> <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            ))}
                        {chatLoading && (
              <div className="ai-msg typing">
                <strong>AI:</strong> Typing...
              </div>
            )}
          </div>
          <form onSubmit={handleChatSubmit} className="chat-form">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask follow-up questions..."
              disabled={chatLoading}
            />
            <button type="submit" disabled={chatLoading}>
              {chatLoading ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default App;
