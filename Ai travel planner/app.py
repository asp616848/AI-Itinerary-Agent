import requests
from flask import Flask, request, jsonify, Response, session
from flask_cors import CORS
import json

app = Flask(__name__)
app.secret_key = "super_secret_key"  # Required for session handling
app.config["SESSION_PERMANENT"] = False  # Prevents issues with temporary sessions
CORS(app)  # Enable CORS for frontend integration

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
SYSTEM_PROMPT = "You are an AI travel assistant. Generate a detailed itinerary based on user input. in 60 words"

def stream_itinerary(budget, duration, destination, purpose, preferences):
    """Stream the response from Ollama and yield it as text chunks."""
    user_prompt = f"Plan a {duration}-day trip to {destination} with a {budget} budget. Purpose: {purpose}. Preferences: {preferences}."
    payload = {
        "model": "llama3.1",
        "prompt": SYSTEM_PROMPT + "\n" + user_prompt,
        "stream": True  # Enable streaming
    }

    try:
        with requests.post(OLLAMA_URL, json=payload, stream=True) as response:
            if response.status_code != 200:
                yield f"Error: Ollama returned status {response.status_code}\n"
                return

            # Process each line as a separate JSON object
            for line in response.iter_lines(decode_unicode=True):
                if not line:
                    continue
                
                try:
                    # Parse each line as a separate JSON object
                    parsed_line = json.loads(line)
                    # Extract the response piece
                    response_text = parsed_line.get("response", "")
                    if response_text:
                        yield response_text
                    
                    # Check if we're done
                    if parsed_line.get("done", False):
                        break
                except json.JSONDecodeError as e:
                    # Log the error and the problematic line
                    print(f"Error parsing JSON: {str(e)}")
                    print(f"Problematic line: {line}")
                    # Just pass through the raw line if we can't parse it
                    yield line + "\n"
    except Exception as e:
        yield f"Error fetching response: {str(e)}\n"

@app.route("/generate", methods=["POST"])
def generate():
    data = request.json
    required_fields = ["budget", "duration", "destination", "purpose", "preferences"]

    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return jsonify({
            "error": f"Missing details: {', '.join(missing_fields)}",
            "follow_up": f"Could you please provide more details on {', '.join(missing_fields)}?"
        }), 400

    # Collect the entire response before returning it
    try:
        full_response = ""
        for chunk in stream_itinerary(
            data["budget"], data["duration"], data["destination"],
            data["purpose"], data["preferences"]
        ):
            full_response += chunk
        
        return jsonify({"itinerary": full_response})
    except Exception as e:
        return jsonify({"itinerary": f"Error fetching response: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)