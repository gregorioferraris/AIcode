from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import uvicorn

# Define a Pydantic model for incoming messages
class MessageRequest(BaseModel):
    message: str
    context: dict = {} # Will hold editor context, e.g., active file content
    history: list = []  # Will hold conversation history

# Define a Pydantic model for the AI's response content
class AIResponseContent(BaseModel):
    text: Optional[str] = None
    code: Optional[str] = None
    language: Optional[str] = None # e.g., 'python', 'typescript', 'json'

# Define the full response model from the backend
class AIResponse(BaseModel):
    response_type: str # 'text' or 'code_suggestion'
    content: AIResponseContent

# Initialize the FastAPI app
app = FastAPI()

@app.post("/chat")
async def chat_endpoint(request: MessageRequest):
    """
    Handles incoming chat messages from the VS Code extension.
    For now, it echoes back a simple response.
    If the message contains "code", it will send back a code snippet.
    """
    print(f"Received message: {request.message}")
    print(f"Context: {request.context}")
    print(f"History: {request.history}")

    message_lower = request.message.lower()

    if "code" in message_lower or "hello world" in message_lower:
        # Simulate a code response for demonstration
        sample_code = """
def greet(name):
    \"\"\"
    This function greets the given name.
    \"\"\"
    return f"Hello, {name}! Welcome to AIcode."

if __name__ == "__main__":
    print(greet("AIcode User"))
"""
        return AIResponse(
            response_type="code_suggestion",
            content=AIResponseContent(
                code=sample_code,
                language="python",
                text="Here's a 'Hello World' Python function for you:"
            )
        )
    else:
        # Simulate a text response
        response_text = f"AIcode backend received: '{request.message}'. (Phase 1)"
        return AIResponse(
            response_type="text",
            content=AIResponseContent(text=response_text)
        )

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5000)