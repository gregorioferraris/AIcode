// AIcode/extension/src/extension.ts

import * as vscode from 'vscode';
import { ChatPanel } from './client'; // Importa ChatPanel dal file client.ts

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "aicode" is now active!');

    // Registra il comando per avviare la chat come pannello editor
    context.subscriptions.push(
        vscode.commands.registerCommand('aicode.startChat', () => {
            ChatPanel.createOrShow(context.extensionUri);
        })
    );

    // Registra la WebviewViewProvider per il pannello nella sidebar
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'aicode.chatView', // Questo ID deve corrispondere a quello in package.json -> views
            new ChatPanel(context.extensionUri)
        )
    );
}

// Questo metodo viene chiamato quando la tua estensione viene disattivata
export function deactivate() {}