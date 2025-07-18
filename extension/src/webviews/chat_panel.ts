import * as vscode from 'vscode';
import { sendMessageToBackend } from '../client'; // Importa il client per il backend

/**
 * Gestisce il pannello webview di AIcode Chat.
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
            // Permetti gli script nella webview
            enableScripts: true,
            // Permetti alla webview di accedere a risorse locali all'interno della directory dell'estensione
            localResourceRoots: [this._extensionUri],
        };

        // Carica il contenuto HTML dal file system
        // Usiamo 'require' qui perché è un contesto Node.js nell'host dell'estensione
        // e non nel webview stesso.
        const fs = require('fs');
        const path = require('path');
        const htmlFilePath = path.join(this._extensionUri.fsPath, 'src', 'webviews', 'chat_panel.html');
        const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
        webviewView.webview.html = htmlContent;

        // Gestisce i messaggi ricevuti dalla webview (dal JavaScript nel chat_panel.html)
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'sendMessage':
                    // Per la Fase 1, non passiamo ancora il contesto reale o la cronologia completa
                    const payload = {
                        message: message.text,
                        context: {}, // Segnaposto per il contesto dell'editor
                        history: []  // Segnaposto per la cronologia della conversazione
                    };

                    try {
                        const aiResponse = await sendMessageToBackend(payload);

                        if (aiResponse.response_type === 'text' && aiResponse.content.text) {
                            // Se la risposta è solo testo, visualizzala nella chat
                            webviewView.webview.postMessage({
                                command: 'addMessage',
                                sender: 'ai',
                                text: aiResponse.content.text
                            });
                            // Nascondi l'area del codice se viene inviata una risposta testuale
                            webviewView.webview.postMessage({ command: 'hideCode' });
                        } else if (aiResponse.response_type === 'code_suggestion' && aiResponse.content.code) {
                            // Se la risposta contiene codice, mostrala nell'area codice dedicata
                            webviewView.webview.postMessage({
                                command: 'showCode',
                                code: aiResponse.content.code,
                                language: aiResponse.content.language,
                                textMessage: aiResponse.content.text // Messaggio di testo opzionale che accompagna il codice
                            });
                        }
                    } catch (error) {
                        console.error('Errore nel pannello chat:', error);
                        // In caso di errore, mostra un messaggio di errore nella chat
                        webviewView.webview.postMessage({
                            command: 'addMessage',
                            sender: 'ai',
                            text: `Errore: Impossibile ottenere risposta da AIcode. ${error instanceof Error ? error.message : String(error)}`
                        });
                        webviewView.webview.postMessage({ command: 'hideCode' }); // Nascondi l'area del codice anche in caso di errore
                    }
                    return;

                case 'copyCode':
                    // Copia il codice negli appunti di sistema
                    if (message.code) {
                        vscode.env.clipboard.writeText(message.code);
                        vscode.window.showInformationMessage('Codice copiato negli appunti!');
                    }
                    return;

                case 'saveCode':
                    // Salva il codice nel file attivo dell'editor
                    if (message.code) {
                        const activeEditor = vscode.window.activeTextEditor;
                        if (activeEditor) {
                            const document = activeEditor.document;
                            const edit = new vscode.WorkspaceEdit();
                            // Inserisci il codice nella posizione corrente del cursore o sostituisci la selezione
                            const position = activeEditor.selection.active;
                            edit.insert(document.uri, position, message.code);
                            await vscode.workspace.applyEdit(edit);
                            vscode.window.showInformationMessage('Codice salvato nel file attivo!');
                        } else {
                            vscode.window.showWarningMessage('Nessun editor di testo attivo per salvare il codice.');
                        }
                    }
                    return;
            }
        });
    }
}