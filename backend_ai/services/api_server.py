from fastapi import FastAPI
from pydantic import BaseModel

# Define a Pydantic model for incoming messages
class MessageRequest(BaseModel):
    message: str
    context: dict = {} # Will hold editor context, e.g., active file content
    history: list = []  # Will hold conversation history

# Initialize the FastAPI app
app = FastAPI()

@app.post("/chat")
async def chat_endpoint(request: MessageRequest):
    """
    Handles incoming chat messages from the VS Code extension.
    For now, it just echoes back a simple response.
    """
    print(f"Received message: {request.message}")
    print(f"Context: {request.context}")
    print(f"History: {request.history}")

    # Basic response for Phase 1
    response_content = f"AIcode backend received: '{request.message}'. (Phase 1)"
    return {"response": response_content}

if __name__ == "__main__":
    import uvicorn
    # This block is mostly for testing this file directly.
    # main.py will be responsible for running the app in a real scenario.
    uvicorn.run(app, host="127.0.0.1", port=5000)
