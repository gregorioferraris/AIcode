import * as vscode from 'vscode';
import { sendMessageToBackend } from '../client';

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
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        // Get HTML content from the file system
        const fs = require('fs');
        const path = require('path');
        const htmlFilePath = path.join(this._extensionUri.fsPath, 'src', 'webviews', 'chat_panel.html');
        const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
        webviewView.webview.html = htmlContent;

        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'sendMessage':
                    // For Phase 1, we don't pass real context or history yet
                    const payload = {
                        message: message.text,
                        context: {}, // Placeholder
                        history: []  // Placeholder
                    };

                    try {
                        const aiResponse = await sendMessageToBackend(payload);

                        if (aiResponse.response_type === 'text' && aiResponse.content.text) {
                            webviewView.webview.postMessage({
                                command: 'addMessage',
                                sender: 'ai',
                                text: aiResponse.content.text
                            });
                            webviewView.webview.postMessage({ command: 'hideCode' }); // Hide code area if a text response
                        } else if (aiResponse.response_type === 'code_suggestion' && aiResponse.content.code) {
                            webviewView.webview.postMessage({
                                command: 'showCode',
                                code: aiResponse.content.code,
                                language: aiResponse.content.language,
                                textMessage: aiResponse.content.text // Optional text message accompanying code
                            });
                        }
                    } catch (error) {
                        console.error('Error in chat panel:', error);
                        webviewView.webview.postMessage({
                            command: 'addMessage',
                            sender: 'ai',
                            text: `Error: Could not get response from AIcode. ${error instanceof Error ? error.message : String(error)}`
                        });
                        webviewView.webview.postMessage({ command: 'hideCode' });
                    }
                    return;

                case 'copyCode':
                    if (message.code) {
                        vscode.env.clipboard.writeText(message.code);
                        vscode.window.showInformationMessage('Code copied to clipboard!');
                    }
                    return;

                case 'saveCode':
                    if (message.code) {
                        const activeEditor = vscode.window.activeTextEditor;
                        if (activeEditor) {
                            const document = activeEditor.document;
                            const edit = new vscode.WorkspaceEdit();
                            // Insert code at the current cursor position or replace selection
                            const position = activeEditor.selection.active;
                            edit.insert(document.uri, position, message.code);
                            await vscode.workspace.applyEdit(edit);
                            vscode.window.showInformationMessage('Code saved to active file!');
                        } else {
                            vscode.window.showWarningMessage('No active text editor to save code.');
                        }
                    }
                    return;
            }
        });
    }
}