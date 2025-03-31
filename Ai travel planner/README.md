# AI Travel Assistant

## Overview
This project is a full-stack AI-powered travel assistant that generates personalized travel itineraries, handles flight searches, and interacts dynamically with users to refine recommendations. The backend is powered by LLaMA 3.1 running locally with Ollama, and the frontend is built using React.

---

## Features

### **1. System Prompt Development**  
Designed a structured system prompt to generate well-balanced and engaging travel itineraries. The prompt ensures personalization by considering user preferences and suggesting relevant follow-up questions for itinerary refinement.

### **2. Handling Flight Searches**  
Implemented flight search functionality within the chat by extracting relevant details (origin, destination, date) using regex and integrating SerpApi to fetch real-time flight options.

### **3. Interactive Chat for Refinement**  
Enabled an interactive chat system that remembers user preferences and previous interactions, allowing real-time itinerary adjustments based on dietary restrictions, family-friendly activities, or specific interests.

### **4. Streaming of Data**  
Implemented a streaming response mechanism to provide real-time updates as the AI processes user queries, improving user experience by reducing wait time.

### **5. Backend Development**  
- Initially explored Flask and Next.js before settling on Express.js for better performance and compatibility with the chosen API setup.
- Transitioned from Hugging Face’s Mistral Transformers to a locally hosted LLaMA 3.1 API for better control, efficiency, and privacy.
- Implemented session-based memory to maintain context across prompts.
- Added logic to detect gibberish or ambiguous inputs and generate meaningful responses.

---

## Running LLaMA 3.1 Locally with Ollama
To run the AI model locally, we use [Ollama](https://ollama.ai/), which simplifies deploying and running LLaMA models.

### **Installation**
```sh
curl -fsSL https://ollama.ai/install.sh | sh
```

### **Running LLaMA 3.1**
```sh
ollama pull llama3.1
ollama run llama3.1
```

### **Testing the Model with API Calls**
```sh
curl -X POST http://127.0.0.1:11434/api/generate \  
     -H "Content-Type: application/json" \  
     -d '{"model": "llama3.1", "prompt": "Hello, AI! How are you?", "stream": true}'
```

---

## API Endpoints
### **1. Generate Itinerary**
```sh
curl -X POST http://127.0.0.1:5000/generate \  
     -H "Content-Type: application/json" \  
     -d '{
          "budget": "1000 USD",
          "duration": "5",
          "destination": "Paris",
          "purpose": "Vacation",
          "preferences": "History, Museums, Fine Dining"
     }'
```
_Response:_
```plaintext
Based on your preferences and requirements, I've created a 5-day itinerary for your Parisian vacation...
```

### **2. Interactive Chat**
```sh
curl -X POST http://localhost:5000/chat \  
     -H "Content-Type: application/json" \  
     -d '{
          "sessionId": "test-session-123",
          "message": "Tell me more about my itinerary",
          "itineraryData": {
            "budget": "Affordable",
            "duration": "7",
            "destination": "Paris, France",
            "purpose": "Leisure",
            "preferences": "Museums, Fine dining"
          },
          "chatHistory": [
            {
              "role": "user",
              "content": "Tell me more about my itinerary"
            }
          ]
     }'
```
_Response:_
```plaintext
I'd be happy to help you review your itinerary...
```

---

## Frontend: React App
The frontend is built using **React** to provide an interactive UI for users to communicate with the AI assistant.

### **Setup**
```sh
cd frontend
npm install
npm start
```

### **Key Features:**
- **Chat Interface:** A sleek, real-time chat UI for users to interact with the AI.
- **Dynamic Updates:** Itinerary adjustments based on user feedback.
- **Flight Search Integration:** Displays real-time flight options.
- **Streaming Responses:** Enhances user experience by reducing wait times.

---

## System Prompt Example
```plaintext
You are an AI travel assistant. If the provided data is sufficient, generate a detailed itinerary based on the following input: {USER_INPUT}.

Ensure your suggestions are accurate and up-to-date, highlighting the top attractions and activities at the specified destination.

- Align and contextualize these recommendations with the user's stated preferences (e.g., if they prefer 'Hidden Gems,' focus on lesser-known but worthwhile experiences).
- If the provided details are insufficient, ask relevant follow-up questions to personalize the itinerary further.

At the end, include a follow-up question to refine the itinerary based on one of the following aspects:
a. Dietary preferences.
b. Specific interests within the given preferences.
c. Walking tolerance or mobility concerns.
d. Accommodation preferences (luxury, budget, central location, etc.).
```

---

## Contributing
Feel free to contribute by submitting a PR or opening an issue for bug reports or feature requests!

---

## License
This project is licensed under the MIT License.


Demo Links: 
1. Video demonstration normal:
https://plakshauniversity1-my.sharepoint.com/:v:/g/personal/abhijeet_s_ug23_plaksha_edu_in/EWCjKEt_EStPl9z4UhWZhAwBmL-UFDTFGY_xMuAmiP9EJQ?e=b8ZePV

2. Video Demonstration edge cases:
https://plakshauniversity1-my.sharepoint.com/:v:/g/personal/abhijeet_s_ug23_plaksha_edu_in/EdA1ZoKvwA5IgZFONDxJkL0BdoA1sQxu0p3QS85Kvrhpkw?e=LDcBJJ