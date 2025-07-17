import * as vscode from 'vscode';
import { sendMessageToBackend } from '../client'; // Import our backend client

/**
 * Manages the AIcode Chat webview panel.
 */
export class ChatPanelProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'aicode.chatPanel';

    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'sendMessage':
                    // Display user message in the chat output immediately
                    webviewView.webview.postMessage({
                        command: 'addMessage',
                        sender: 'user',
                        text: message.text
                    });

                    // For Phase 1, we don't pass real context or history yet
                    const payload = {
                        message: message.text,
                        context: {}, // Placeholder for context
                        history: []  // Placeholder for history
                    };

                    try {
                        const aiResponse = await sendMessageToBackend(payload);
                        webviewView.webview.postMessage({
                            command: 'addMessage',
                            sender: 'ai',
                            text: aiResponse
                        });
                    } catch (error) {
                        console.error('Error in chat panel:', error);
                        webviewView.webview.postMessage({
                            command: 'addMessage',
                            sender: 'ai',
                            text: `Error: Could not get response from AIcode. ${error instanceof Error ? error.message : String(error)}`
                        });
                    }
                    return;
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')); // Placeholder for external JS

        // Get the URI for the chat_panel.html file
        const htmlUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'extension', 'src', 'webviews', 'chat_panel.html'));

        // Load the HTML content directly
        // In a real scenario, you might read the file content using fs and replace placeholders
        // For now, we'll just reference the file's URI (requires it to be accessible via localResourceRoots)
        // A more robust way is to read the content and inject it directly.
        // Let's read the content from the file system for robustness.
        const fs = require('fs');
        const path = require('path');
        const htmlFilePath = path.join(this._extensionUri.fsPath, 'src', 'webviews', 'chat_panel.html');
        let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

        // Replace acquireVsCodeApi() only in the final HTML
        // This is just to ensure the script tag includes the webview API properly
        // For now, it's directly in the HTML, so no specific replacement is needed if copied correctly.

        // Ensure media folder exists if you want to use external css/js
        // For this phase, we embed CSS and JS directly in HTML, so no `media` folder is strictly needed yet.
        return htmlContent;
    }
}
