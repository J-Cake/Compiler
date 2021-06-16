import {Token} from "./Lex";

export const sourceMap: Map<string, string> = new Map();

export type CompileError = {
    msg: string,
    origin?: Token,
    getSnippet?(): string
}

export function getSnippet(token: Token): string {
    if (sourceMap.has(token.resource)) {
        const source = sourceMap.get(token.resource);
        const preCursor = [source.slice(0, token.charIndex + token.source.length), source.slice(token.charIndex + token.source.length)];

        const line = preCursor[0].slice(Math.max(0, preCursor[0].lastIndexOf('\n'))) + preCursor[1].slice(0, Math.max(0, preCursor[1].indexOf('\n')));
        const lineNumber = preCursor[0].split('\n').length;

        return `${lineNumber.toString().padStart(3, ' ')} | ${line}`;
    } else return token.source;
}