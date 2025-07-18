// AIcode/extension/media/main.js

// Ottieni un riferimento all'API di VS Code per comunicare con l'estensione
const vscode = acquireVsCodeApi();

const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const chatContainer = document.getElementById('chat-container');

// Funzione per aggiungere un messaggio utente alla chat UI
function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.innerText = text;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Funzione per aggiungere un placeholder per la risposta AI (es. "...")
function addAIMessagePlaceholder(id) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';
    messageDiv.id = id;
    messageDiv.innerText = 'AIcode is thinking...';
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Funzione per aggiornare il placeholder con la risposta AI effettiva
function updateAIMessage(id, type, content) {
    const messageDiv = document.getElementById(id);
    if (!messageDiv) return;

    messageDiv.innerHTML = ''; // Pulisci il placeholder

    if (type === 'text') {
        messageDiv.innerText = content;
    } else if (type === 'code') {
        if (content.text) {
            const textSpan = document.createElement('span');
            textSpan.innerText = content.text + '\n';
            messageDiv.appendChild(textSpan);
        }

        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.className = `language-${content.language || 'plaintext'}`;
        code.innerText = content.code;
        pre.appendChild(code);
        messageDiv.appendChild(pre);

        // Aggiungi pulsanti per copiare/salvare il codice
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'code-buttons';

        const copyButton = document.createElement('button');
        copyButton.innerText = 'Copy Code';
        copyButton.onclick = () => {
            vscode.postMessage({
                command: 'copyCode',
                code: content.code
            });
        };
        buttonContainer.appendChild(copyButton);

        const saveButton = document.createElement('button');
        saveButton.innerText = 'Save to File';
        saveButton.onclick = () => {
            vscode.postMessage({
                command: 'saveCode',
                code: content.code,
                language: content.language
            });
        };
        buttonContainer.appendChild(saveButton);

        messageDiv.appendChild(buttonContainer);

    }
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Gestisce l'invio del messaggio
function sendMessage() {
    const text = chatInput.value.trim();
    if (text) {
        vscode.postMessage({
            command: 'sendMessage',
            text: text
        });
        chatInput.value = '';
    }
}

// Listener per il pulsante di invio
sendButton.addEventListener('click', sendMessage);

// Listener per il tasto Invio nell'input
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Gestisce i messaggi dall'estensione (backend TypeScript)
window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'addUserMessage':
            addUserMessage(message.text);
            break;
        case 'addAIMessagePlaceholder':
            addAIMessagePlaceholder(message.id);
            break;
        case 'updateAIMessage':
            updateAIMessage(message.id, message.type, message.content);
            break;
    }
});