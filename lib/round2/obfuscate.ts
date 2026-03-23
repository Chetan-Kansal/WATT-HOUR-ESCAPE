
/**
 * Strips comments from code snippets for Round 2 obfuscation.
 * Handles both Python (#) and JavaScript (//, /* * /) comments.
 */
export function obfuscateCode(code: string, language: 'python' | 'javascript'): string {
    if (language === 'python') {
        // Remove Python comments: # ... (including those with BUG tags)
        return code.replace(/#.*$/gm, '').trim();
    } else {
        // Remove Single line JavaScript comments: // ...
        const noSingle = code.replace(/\/\/.*$/gm, '');
        // Remove Multi-line JavaScript comments: /* ... */
        return noSingle.replace(/\/\*[\s\S]*?\*\//gm, '').trim();
    }
}
