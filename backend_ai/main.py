import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Import the FastAPI app instance from api_server.py
# We need to ensure the path is correct for import
# Add backend_ai to sys.path if running from project root for easier imports
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from services.api_server import app

if __name__ == "__main__":
    # You can get the port from environment variables or use a default
    PORT = int(os.getenv("BACKEND_PORT", 5000))
    HOST = os.getenv("BACKEND_HOST", "127.0.0.1")

    print(f"Starting AIcode backend server at http://{HOST}:{PORT}")
    uvicorn.run(app, host=HOST, port=PORT, reload=True) # reload=True for development
