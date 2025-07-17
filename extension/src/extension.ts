import * as vscode from 'vscode';
import { ChatPanelProvider } from './webviews/chat_panel'; // Import your chat panel provider

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "aicode" is now active!');

    // --- Register the Chat Panel Webview ---
    const chatPanelProvider = new ChatPanelProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ChatPanelProvider.viewType, chatPanelProvider)
    );

    // --- Register a simple command to show the chat panel ---
    context.subscriptions.push(
        vscode.commands.registerCommand('aicode.showChatPanel', () => {
            // This command doesn't directly open the view,
            // but ensures it's registered. Users would typically
            // open it from the VS Code sidebar directly.
            vscode.commands.executeCommand('workbench.view.extension.aicode-sidebar-view'); // Replace with your actual view ID if different
        })
    );
}

// This method is called when your extension is deactivated
export function deactivate() {}
