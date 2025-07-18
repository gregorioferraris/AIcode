# AIcode/backend_ai/main.py

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Carica le variabili d'ambiente dal file .env (se presente)
load_dotenv()

# Inizializza l'applicazione FastAPI
app = FastAPI()

# --- Configurazione CORS ---
# ESSENZIALE per permettere all'estensione VS Code di comunicare
origins = [
    "http://localhost",             # Per sviluppo locale
    "http://127.0.0.1:8000",        # La porta su cui Uvicorn girerà
    "vscode-webview://*",           # Permette la comunicazione dalle webview di VS Code
    "https://*.vscode-cdn.net"      # Potrebbe essere utile per alcune risorse VS Code
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Permette tutti i metodi HTTP (GET, POST, etc.)
    allow_headers=["*"],  # Permette tutte le intestazioni
)

# --- Modello di Dati per la Richiesta Chat ---
# Definisce la struttura dei dati che il frontend invierà.
# Corrisponde all'interfaccia nel TypeScript del frontend.
class ChatRequest(BaseModel):
    message: str
    context: dict
    history: list

# --- Endpoint di Test per la Chat ---
# Questo endpoint riceverà i messaggi dal frontend.
@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    # Questo print apparirà nel terminale dove avvii Uvicorn.
    # È la nostra prima verifica che il backend riceve il messaggio.
    print(f"DEBUG: Backend received message: '{request.message}' from frontend.")

    # Questa è la risposta che verrà inviata al frontend.
    # È una risposta semplice, solo per confermare che la comunicazione base funziona.
    return {
        "response_type": "text",
        "content": {"text": f"DEBUG: Backend successfully processed: '{request.message}'"}
    }

# --- Endpoint di Base per Verificare l'Avvio del Server ---
@app.get("/")
async def root():
    return {"message": "AIcode Backend is running!"}