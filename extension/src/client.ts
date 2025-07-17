import * as vscode from 'vscode';

// Define the interface for the message payload to the backend
interface MessagePayload {
    message: string;
    context?: { [key: string]: any }; // Optional context object
    history?: Array<{ role: string, content: string }>; // Optional conversation history
}

/**
 * Sends a message to the AIcode backend.
 * @param payload The message payload including message, context, and history.
 * @returns A Promise that resolves with the backend's response or rejects on error.
 */
export async function sendMessageToBackend(payload: MessagePayload): Promise<string> {
    const backendHost = vscode.workspace.getConfiguration('aicode').get('backendHost', '127.0.0.1');
    const backendPort = vscode.workspace.getConfiguration('aicode').get('backendPort', 5000);
    const url = `http://${backendHost}:${backendPort}/chat`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            // Handle HTTP errors
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
        }

        const data = await response.json();
        return data.response; // Assuming the backend sends a JSON with a 'response' field

    } catch (error) {
        console.error('Error sending message to backend:', error);
        vscode.window.showErrorMessage(`AIcode backend error: ${error instanceof Error ? error.message : String(error)}. Is the backend running?`);
        return `Error: Could not connect to AIcode backend. Is it running at ${url}?`;
    }
}
