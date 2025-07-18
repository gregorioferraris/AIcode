"use strict";
// AIcode/extension/src/client.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatPanel = void 0;
const vscode = __importStar(require("vscode"));
class ChatPanel {
    constructor(extensionUri) {
        this._disposables = [];
        this._responseCounter = 0;
        this.handleMessage = async (message) => {
            this._responseCounter++;
            const responseId = `response-${this._responseCounter}`;
            this.postMessageToWebview({ command: 'addUserMessage', text: message });
            this.postMessageToWebview({ command: 'addAIMessagePlaceholder', id: responseId });
            try {
                const activeEditor = vscode.window.activeTextEditor;
                const fileContent = activeEditor ? activeEditor.document.getText() : '';
                const filePath = activeEditor ? activeEditor.document.uri.fsPath : '';
                const response = await fetch('http://127.0.0.1:8000/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: message,
                        context: {
                            fileContent: fileContent,
                            filePath: filePath
                        },
                        history: []
                    }),
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }
                const data = (await response.json());
                if (data.response_type === 'text') {
                    this.postMessageToWebview({
                        command: 'updateAIMessage',
                        id: responseId,
                        type: 'text',
                        content: data.content.text
                    });
                }
                else if (data.response_type === 'code_suggestion') {
                    this.postMessageToWebview({
                        command: 'updateAIMessage',
                        id: responseId,
                        type: 'code',
                        content: {
                            text: data.content.text,
                            code: data.content.code,
                            language: data.content.language
                        }
                    });
                }
                else {
                    this.postMessageToWebview({
                        command: 'updateAIMessage',
                        id: responseId,
                        type: 'text',
                        content: 'Received an unknown response type from AIcode backend.'
                    });
                }
            }
            catch (error) {
                console.error('Error communicating with AIcode backend:', error);
                let errorMessage = `Error: Could not connect to AIcode backend. Is the server running? (${error.message || error})`;
                if (error.message.includes('ECONNREFUSED')) {
                    errorMessage = `Error: Connection to AIcode backend refused. Please ensure the backend server is running at http://127.0.0.1:8000.`;
                }
                this.postMessageToWebview({
                    command: 'updateAIMessage',
                    id: responseId,
                    type: 'text',
                    content: errorMessage
                });
                vscode.window.showErrorMessage(errorMessage);
            }
        };
        this.saveCodeToFile = async (code, language) => {
            const fileExtension = language ? `.${language}` : '.txt';
            const uri = await vscode.window.showSaveDialog({
                filters: language ? { [language]: [language] } : undefined,
                defaultUri: vscode.Uri.file(`untitled${fileExtension}`)
            });
            if (uri) {
                await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(code));
                vscode.window.showInformationMessage(`Code saved to ${uri.fsPath}`);
            }
        };
        this.dispose = () => {
            if (this._panel) {
                ChatPanel.currentPanel = undefined;
                this._panel.dispose();
            }
            while (this._disposables.length) {
                const x = this._disposables.pop();
                if (x) {
                    x.dispose();
                }
            }
        };
        this._extensionUri = extensionUri;
    }
    resolveWebviewView(webviewView, context, token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            // OLD: localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'media')]
            localResourceRoots: [vscode.Uri.file(this._extensionUri.fsPath + '/media')] // CORREZIONE QUI
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        this._view.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'sendMessage':
                    this.handleMessage(message.text);
                    return;
                case 'copyCode':
                    if (message.code) {
                        vscode.env.clipboard.writeText(message.code);
                        vscode.window.showInformationMessage('Code copied to clipboard!');
                    }
                    return;
                case 'saveCode':
                    if (message.code) {
                        this.saveCodeToFile(message.code, message.language);
                    }
                    return;
            }
        }, null, this._disposables);
        webviewView.onDidDispose(() => this.dispose(), null, this._disposables);
    }
    static createOrShow(extensionUri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (ChatPanel.currentPanel) {
            ChatPanel.currentPanel._panel?.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel('aicodeChatPanel', 'AIcode Chat Editor', column || vscode.ViewColumn.One, {
            enableScripts: true,
            // OLD: localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
            localResourceRoots: [vscode.Uri.file(extensionUri.fsPath + '/media')] // CORREZIONE QUI
        });
        ChatPanel.currentPanel = new ChatPanel(extensionUri);
        ChatPanel.currentPanel._panel = panel;
        ChatPanel.currentPanel._updatePanel();
        panel.onDidDispose(() => ChatPanel.currentPanel?.dispose(), null, ChatPanel.currentPanel._disposables);
    }
    _updatePanel() {
        if (this._panel) {
            this._panel.title = 'AIcode Chat Editor';
            this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
        }
    }
    _getHtmlForWebview(webview) {
        // OLD: const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.file(this._extensionUri.fsPath + '/media/main.js')); // CORREZIONE QUI
        // OLD: const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css'));
        const styleUri = webview.asWebviewUri(vscode.Uri.file(this._extensionUri.fsPath + '/media/style.css')); // CORREZIONE QUI
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src ${webview.cspSource}; font-src ${webview.cspSource}; img-src ${webview.cspSource} https: data:;">
                <link href="${styleUri}" rel="stylesheet">
                <title>AIcode Chat</title>
            </head>
            <body>
                <h1>AIcode Chat</h1>
                <div id="chat-container"></div>
                <div class="input-container">
                    <input type="text" id="chat-input" placeholder="Type your message...">
                    <button id="send-button">Send</button>
                </div>
                <script src="${scriptUri}"></script>
            </body>
            </html>`;
    }
    postMessageToWebview(message) {
        if (this._view) {
            this._view.webview.postMessage(message);
        }
        else if (this._panel) {
            this._panel.webview.postMessage(message);
        }
    }
}
exports.ChatPanel = ChatPanel;
//# sourceMappingURL=client.js.map