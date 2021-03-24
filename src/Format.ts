import {Token, TokenType} from "./Lex";

// export class Line {
//     tokens: (Token | Expression)[];
//     indent: string;
//
//     constructor(options: { tokens: (Token | Expression)[], indent: string }) {
//         this.tokens = options.tokens;
//         this.indent = options.indent;
//     }
// }
//
// export class Expression {
//     tokens: Token[];
//     charIndex: number;
//
//     constructor(tokens: Token[]) {
//         this.tokens = tokens.filter(i => i.type !== TokenType.Space && i.type !== TokenType.Newline);
//     }
//
//     get source(): string {
//         return this.tokens.filter(i => i.type !== TokenType.Space).map(i => i.source).join(' ');
//     }
//
//     get resource(): string {
//         return this.tokens[0].resource;
//     }
// }
//
// export class Block { // These just have a list of tokens as their body, thus they'll need to be reformatted separately
//     tokens: Token[];
//     charIndex: number;
//     indent: string;
//
//     constructor(options: Partial<{
//         tokens: Token[],
//         indent: string
//     }>) {
//         this.tokens = options.tokens ? options.tokens : [];
//         this.indent = options.indent ? options.indent : '';
//     }
//
//     get source(): string {
//         return `{ ... }`;
//     }
//
//     get resource(): string {
//         return this.tokens[0].resource;
//     }
//
//     add(...token: Token[]) {
//         this.tokens.push(...token);
//     }
// }
//
// export function collapseBlock(input: Token[]): (Token | Block)[] {
//     const tokens: (Token | Block)[] = [];
//
//     const getIndent = (indent: string, matcher: string): number => indent.length / matcher.length;
//
//     const lines: Token[][] = (function (): Token[][] {
//         const lines: Token[][] = [];
//         const line: Token[] = [];
//
//         for (const i of input)
//             if (i.type === TokenType.Newline)
//                 lines.push(line.splice(0, line.length))
//             else
//                 line.push(i);
//         return lines.filter(i => i.length > 0);
//     })();
//
//     const indent: string = (function (): string {
//         const indents = lines.filter(i => i.length > 0 && i[0].type === TokenType.Space).map(i => i[0].source);
//
//         if (indents.length > 0)
//             return indents.reduce((a, i) => a.length > i.length ? a : i);
//         return '';
//     })();
//
//     const firstLineIndent: number = getIndent(lines[0][0].type === TokenType.Space ? lines[0][0].source : '', indent);
//
//     let block: Block | null = null;
//     for (const i of lines) {
//         if (getIndent(i[0].type === TokenType.Space ? i[0].source : '', indent) > firstLineIndent) {
//             if (!block)
//                 block = new Block({indent: i[0].source});
//
//             block.add(...i);
//             block.add({
//                 type: TokenType.Newline,
//                 source: ''
//             })
//         } else {
//             if (block) {
//                 tokens.push(block);
//                 block = null;
//             }
//             tokens.push(...i);
//         }
//         tokens.push({
//             type: TokenType.Newline,
//             source: ''
//         });
//     }
//
//     if (block)
//         tokens.push(block);
//
//     return tokens;
// }
//
// export function collapseExpression(input: Token[]): (Token | Expression)[] {
//     const noSpace: Token[] = input.filter(i => i.type !== TokenType.Space);
//
//     const expressionToken: TokenType[] = [
//         TokenType.Identifier,
//         TokenType.LeftParenthesis,
//         TokenType.RightParenthesis,
//         TokenType.Operator,
//         TokenType.Dot,
//         TokenType.Boolean,
//         TokenType.Integer,
//         TokenType.String,
//     ];
//
//     const tokens: (Token | Expression)[] = [];
//     const expr: Token[] = [];
//     for (const i of noSpace)
//         if (expressionToken.includes(i.type))
//             expr.push(i);
//         else {
//             if (expr.length > 0)
//                 tokens.push(new Expression(expr.splice(0, expr.length)));
//             tokens.push(i);
//         }
//
//     if (expr.length > 0)
//         tokens.push(new Expression(expr.splice(0, expr.length)));
//
//     return tokens;
// }
//
// export function collapseLines(input: (Token | Block)[]): (Line | Block)[] {
//     const lines: (Line | Block)[] = [];
//     const line: Token[] = [];
//
//     for (const i of input) {
//         if (i instanceof Block || (i as Token).type === TokenType.Semicolon) {
//             const tokens = line.splice(0, line.length);
//             lines.push(new Line({
//                 tokens: collapseExpression(tokens),
//                 indent: tokens[0].type === TokenType.Space ? i[0].source : ''
//             }));
//             if (i instanceof Block)
//                 lines.push(i);
//         } else if (i.type !== TokenType.Newline)
//             line.push(i);
//     }
//
//     return lines;
// }
//
// export default function Format(input: Token[]): (Line | Block)[] {
//     return collapseLines(collapseBlock(input));
// }

// export type Block = { body: (Token|Block)[], indent: number };

export enum ConstructType {
    List,
    Dict,
    Call,
    Fn,
    Block,
    Expression,
    ExpressionList
}

export type Repeat<Expr extends (TokenType|ConstructType)[], Separator extends TokenType = TokenType.Comma> = [...Expr, Separator]; // needs to repeat arbitrarily

export interface ConstructBody extends Record<ConstructType, (TokenType|ConstructType)[]> {
    [ConstructType.List]: [TokenType.LeftBracket, ConstructType.ExpressionList, TokenType.RightBracket],
    [ConstructType.Dict]: [TokenType.LeftBrace, Repeat<[TokenType.Identifier, TokenType.Colon, ConstructType.Expression]>, TokenType.RightBrace],
    [ConstructType.Call]: [ConstructType.Expression, TokenType.LeftParenthesis, ConstructType.ExpressionList, TokenType.RightParenthesis],
    [ConstructType.Fn]: [TokenType.Identifier, Repeat<[TokenType.Identifier]>],
    [ConstructType.Block]: [Repeat<[TokenType.Space, ConstructType.Expression], TokenType.Newline>],
    [ConstructType.Expression]: [Repeat<[TokenType.Identifier | TokenType.Integer | TokenType.Boolean | TokenType.Dot | ConstructType.Call | TokenType.LeftParenthesis | TokenType.RightParenthesis], TokenType.Operator>],
    [ConstructType.ExpressionList]: [Repeat<[ConstructType.Expression]>]
}
export type Construct<T extends ConstructType> = ConstructBody[T];

export default function Format(tokens: Token[]): Construct<ConstructType.Block> {

    const lines: Token[][] = [];
    const line: Token[] = [];
    for (const i of tokens)
        if (i.type === TokenType.Newline)
            lines.push(line.splice(0, line.length))
        else
            line.push(i);
    lines.push(line);

    // for (const i of lines.filter(i => i.length > 0))

    return [];
}
