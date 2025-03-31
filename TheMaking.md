## **Final Set of Prompts**  



## **0. Process Documentation**

#### **System Prompt Development**  
Designed a structured system prompt to generate well-balanced and engaging travel itineraries. The prompt ensures personalization by considering user preferences and suggesting relevant follow-up questions for itinerary refinement.

#### **Handling Flight Searches**  
Implemented flight search functionality within the chat by extracting relevant details (origin, destination, date) using regex and integrating SerpApi to fetch real-time flight options.

#### **Interactive Chat for Refinement**  
Enabled an interactive chat system that remembers user preferences and previous interactions, allowing real-time itinerary adjustments based on dietary restrictions, family-friendly activities, or specific interests.

#### **Streaming of Data**  
Implemented a streaming response mechanism to provide real-time updates as the AI processes user queries, improving user experience by reducing wait time.

#### **Tried Flask and Next.js for Backend**  
Explored different backend options, initially using Flask and Next.js before settling on Express.js for better performance and compatibility with the chosen API setup.

#### **Moved from Hugging Face Mistral Transformers to Local Server Hosted API of LLaMA 3.1**  
Initially used Hugging Face’s Mistral Transformers for processing but transitioned to a locally hosted LLaMA 3.1 API for better control, efficiency, and privacy.

#### **Ensuring Context Storage and Synchronization Across Prompts**  
Implemented session-based memory to maintain context across prompts, ensuring continuity in conversations and refining responses based on previous interactions.

#### **Handling Gibberish and Providing Meaningful Responses for Clarification**  
Added logic to detect gibberish or ambiguous inputs and generate meaningful responses, either by requesting clarification or offering relevant information.

---


### **1. System Prompt**  
**Role:** AI Travel Assistant  
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

### **2. User Prompts**
#### **Example 1: Simple Itinerary Request**  
```plaintext
I am planning a 5-day trip to Paris with my family. We love historical places, art, and good food. Please suggest a detailed itinerary.
```

#### **Example 2: Flight Inquiry**  
```plaintext
Can you find flights from New York to Paris on April 20th?
```

#### **Example 3: Follow-up Customization**  
```plaintext
That itinerary looks great! Can you add some kid-friendly activities and restaurants since I’ll be traveling with children?
```

---

### **3. Model Responses**
#### **Response 1: 5-Day Itinerary for Paris**  
```plaintext
Certainly! Here’s your detailed 5-day itinerary for Paris:

**Day 1: Arrival & Iconic Landmarks**
- Morning: Arrive in Paris, check in at your hotel.
- Afternoon: Visit the Eiffel Tower (pre-book tickets to avoid long queues).
- Evening: Seine River Cruise followed by dinner at a traditional Parisian bistro.

**Day 2: History & Art**
- Morning: Explore the Louvre Museum.
- Afternoon: Walk through the Tuileries Garden and visit the Orsay Museum.
- Evening: Dinner at Le Procope, one of Paris's oldest restaurants.

...

Would you like recommendations for family-friendly accommodations or transportation options?
```

#### **Response 2: Flight Search**  
```plaintext
Here are some available flights from New York (JFK) to Paris (CDG) on April 20th:

1. **Air France** - Non-stop, 7h 25m, Departs at 7:30 PM
2. **Delta Airlines** - Non-stop, 7h 40m, Departs at 6:50 PM
3. **British Airways** - 1 Stop via London, 10h 15m

Would you like help booking or more details on baggage policies?
```

#### **Response 3: Kid-Friendly Additions**  
```plaintext
Great! Here are some family-friendly activities added to your itinerary:

- **Day 2 Afternoon:** Visit the Cité des Sciences et de l'Industrie (a fun, interactive science museum for kids).
- **Day 3 Morning:** Disneyland Paris Day Trip.
- **Day 4 Evening:** Visit Parc des Buttes-Chaumont for a picnic and playground time.

Would you like kid-friendly restaurant suggestions as well?
```

---

## **Sample Inputs and Outputs**
### **Curated Suggestions for Provided Inputs**
| **User Input** | **AI Response (Summary)** |
|---------------|---------------------------|
| "I want a 3-day adventure trip to Bali." | Surfing at Kuta Beach, Mount Batur sunrise hike, and waterfall exploration. |
| "Find me a budget hotel in Rome near the Colosseum." | Suggested 3 affordable hotels near the Colosseum with price ranges. |
| "Best nightlife spots in Tokyo?" | Recommendations for Shinjuku Golden Gai, Roppongi, and Shibuya. |

---

### **Detailed Day-by-Day Itinerary**
**Scenario: A Solo Traveler Exploring Kyoto for 4 Days**  
| **Day** | **Activities** |
|--------|-------------|
| **Day 1** | Arrival, check-in, Fushimi Inari Shrine, Gion district night walk. |
| **Day 2** | Arashiyama Bamboo Forest, Kinkaku-ji (Golden Pavilion), Nishiki Market. |
| **Day 3** | Philosopher’s Path, Nijo Castle, evening tea ceremony. |
| **Day 4** | Morning at Kyoto Imperial Palace, shopping in Teramachi Street. |

---