from transformers import pipeline

# Load your model
model = "/home/abhi/web dev/Ai travel planner/consolidated.safetensors"
generator = pipeline("text-generation", model=model)

# Run inference
text = "Your input text here"
result = generator(text)
print(result)
