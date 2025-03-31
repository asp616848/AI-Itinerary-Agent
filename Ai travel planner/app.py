from flask import Flask, request, jsonify
from huggingface_hub import InferenceClient
import os
from dotenv import load_dotenv
from flask_cors import CORS

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

HF_ACCESS_TOKEN = os.getenv("HF_ACCESS_TOKEN")
if not HF_ACCESS_TOKEN:
    raise ValueError("HF_ACCESS_TOKEN is missing. Please set it in your .env file.")

client = InferenceClient(token=HF_ACCESS_TOKEN)

SYSTEM_PROMPT = """
You are an AI travel assistant that creates personalized travel itineraries based on user preferences. 
Consider budget, duration, destination, purpose, address, and other preferences to generate a well-structured day-wise plan.
Include activities, food recommendations, and relaxation options.
If you need additional details from the user before finalizing, ask relevant follow-up questions.
Format the response in markdown.
"""

def generate_itinerary(budget, duration, address, destination, purpose, preferences):
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Plan a {duration}-day trip to {destination} with a {budget} budget. Purpose: {purpose}. Address: {address}. Preferences: {preferences}."}
    ]
    
    try:
        response = client.chat_completion(
            model="mistralai/Mixtral-8x7B-Instruct-v0.1",
            messages=messages,
            max_tokens=1024
        )
        output = response["choices"][0]["message"]["content"]
        
        # Check if the model is asking follow-up questions
        if "[Follow-up]" in output:
            return {"follow_up": output}
        
        return {"itinerary": output}
    except Exception as e:
        return {"error": f"Error generating itinerary: {str(e)}"}

@app.route("/generate", methods=["POST"])
def generate():
    data = request.json
    required_fields = ["budget", "duration", "address", "destination", "purpose", "preferences"]

    # Validate input
    if not all(field in data and data[field] for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    itinerary_response = generate_itinerary(
        data["budget"], data["duration"], data["address"],
        data["destination"], data["purpose"], data["preferences"]
    )

    return jsonify(itinerary_response)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)