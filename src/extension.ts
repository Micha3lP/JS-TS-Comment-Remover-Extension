import * as vscode from 'vscode';
import * as path from 'path';
import * as ts from 'typescript';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "remove-comments" is now active');

    const disposable1 = vscode.commands.registerCommand('remove-comments.removeFromCurrentFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const document = editor.document;
        if (!isSupportedLanguage(document.languageId)) {
            vscode.window.showWarningMessage('This command only works with TypeScript/JavaScript files');
            return;
        }

        try {
            await removeCommentsFromDocument(document, editor);
            vscode.window.showInformationMessage('✓ Comments removed successfully!');
        } catch (error: any) {
            vscode.window.showErrorMessage(`Error removing comments: ${String(error)}`);
        }
    });

    const disposable2 = vscode.commands.registerCommand('remove-comments.removeFromSelectedFiles', async (uri: vscode.Uri, uris: vscode.Uri[]) => {
        const files = uris && uris.length > 0 ? uris : (uri ? [uri] : []);
        if (!files || files.length === 0) {
            vscode.window.showErrorMessage('No files selected');
            return;
        }

        const supportedFiles = files.filter(fileUri => {
            const ext = path.extname(fileUri.fsPath).toLowerCase();
            return ['.ts', '.tsx', '.js', '.jsx'].includes(ext);
        });

        if (supportedFiles.length === 0) {
            vscode.window.showWarningMessage('No TypeScript or JavaScript files selected');
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Removing comments",
            cancellable: false
        }, async (progress) => {
            let processed = 0;
            const total = supportedFiles.length;

            for (const fileUri of supportedFiles) {
                progress.report({
                    increment: (100 / total),
                    message: `Processing ${path.basename(fileUri.fsPath)} (${processed + 1}/${total})`
                });

                try {
                    await removeCommentsFromFile(fileUri);
                    processed++;
                } catch (error: any) {
                    vscode.window.showErrorMessage(`Error processing ${path.basename(fileUri.fsPath)}: ${String(error)}`);
                }
            }

            return processed;
        }).then(processed => {
            if (processed && processed > 0) {
                vscode.window.showInformationMessage(`✓ Comments removed from ${processed} file(s)`);
            }
        });
    });

    context.subscriptions.push(disposable1, disposable2);
}

function isSupportedLanguage(languageId: string): boolean {
    return ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'].includes(languageId);
}

async function removeCommentsFromDocument(document: vscode.TextDocument, editor: vscode.TextEditor) {
    const content = document.getText();
    const variant = languageIdToVariant(document.languageId);
    const cleanedContent = removeCommentsWithTSScanner(content, variant);

    const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(content.length)
    );

    await editor.edit(editBuilder => {
        editBuilder.replace(fullRange, cleanedContent);
    });
}

async function removeCommentsFromFile(uri: vscode.Uri) {
    const document = await vscode.workspace.openTextDocument(uri);
    const content = document.getText();
    const variant = extToVariant(uri.fsPath);
    const cleanedContent = removeCommentsWithTSScanner(content, variant);

    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(content.length)
    );
    edit.replace(uri, fullRange, cleanedContent);
    await vscode.workspace.applyEdit(edit);
    await document.save();
}

/**
 * Elimina comentarios usando el escáner de TypeScript (robusto para TS/JS/JSX/TSX).
 * Mantiene espacios y saltos de línea, pero descarta:
 * - SingleLineCommentTrivia (// ...)
 * - MultiLineCommentTrivia (/* ... * /)
 */
function removeCommentsWithTSScanner(code: string, variant: ts.LanguageVariant): string {
    const scanner = ts.createScanner(ts.ScriptTarget.Latest, /*skipTrivia*/ false, variant, code);
    const out: string[] = [];
    let kind = scanner.scan();

    while (kind !== ts.SyntaxKind.EndOfFileToken) {
        if (kind !== ts.SyntaxKind.SingleLineCommentTrivia && kind !== ts.SyntaxKind.MultiLineCommentTrivia) {
            out.push(scanner.getTokenText());
        }
        kind = scanner.scan();
    }
    return out.join(''); // Join without additional spaces to preserve original formatting
}
// Determine language variant based on language ID
function languageIdToVariant(languageId: string): ts.LanguageVariant {
    return (languageId === 'typescriptreact' || languageId === 'javascriptreact')
        ? ts.LanguageVariant.JSX // JSX variant for React files
        : ts.LanguageVariant.Standard;
}

function extToVariant(filePath: string): ts.LanguageVariant {
    const ext = path.extname(filePath).toLowerCase();
    return (ext === '.tsx' || ext === '.jsx') ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard;
}

export function deactivate() {}
