export enum TokenType {
    Space,
    Newline,
    Integer,
    Boolean,
    String,
    ReservedWord,
    Identifier,
    Operator,
    Comment,
    Comma,
    Dot,
    LeftParenthesis,
    RightParenthesis,
    LeftBracket,
    RightBracket,
    LeftBrace,
    RightBrace,
    Colon,
    Semicolon
}

export enum Operator {
    Add,
    Subtract,
    Multiply,
    Divide,

    Equals,
    LessThan,
    GreaterThan,

    And,
    Or,
    Not
}

export const operators: Record<Operator, (tok: string) => boolean> = {
    [Operator.Add]: tok => tok === "+",
    [Operator.Subtract]: tok => tok === "-",
    [Operator.Multiply]: tok => tok === "*",
    [Operator.Divide]: tok => tok === "/",
    [Operator.Equals]: tok => tok === "==",
    [Operator.LessThan]: tok => tok === "<",
    [Operator.GreaterThan]: tok => tok === ">",
    [Operator.And]: tok => tok === "and",
    [Operator.Or]: tok => tok === "or",
    [Operator.Not]: tok => tok === "!"
};

export const matchers: Record<TokenType, (tok: string) => boolean> = {
    [TokenType.Operator]: tok => Object.values(operators).some(i => i(tok)),
    [TokenType.Integer]: tok => /^-?\d+$/.test(tok),
    [TokenType.Boolean]: tok => tok === "true" || tok === "false",
    [TokenType.String]: tok => /^((?<![\\])['"])((?:.(?!(?<![\\])\1))*.?)\1$/.test(tok), // Thanks internet (https://www.metaltoad.com/blog/regex-quoted-string-escapable-quotes)
    [TokenType.Identifier]: tok => !reservedWords.includes(tok) && /^[a-zA-Z$_@][a-zA-Z0-9$_@]*$/.test(tok),
    [TokenType.ReservedWord]: tok => reservedWords.includes(tok),
    [TokenType.Space]: tok => /^[ \t]+$/.test(tok),
    [TokenType.Newline]: tok => /^\n+$/.test(tok),
    [TokenType.Comment]: tok => /^#.*\n$/.test(tok),

    [TokenType.Comma]: tok => tok === ',',
    [TokenType.Dot]: tok => tok === '.',
    [TokenType.LeftParenthesis]: tok => tok === '(',
    [TokenType.RightParenthesis]: tok => tok === ')',
    [TokenType.LeftBracket]: tok => tok === '[',
    [TokenType.RightBracket]: tok => tok === ']',
    [TokenType.LeftBrace]: tok => tok === '{',
    [TokenType.RightBrace]: tok => tok === '}',

    [TokenType.Colon]: tok => tok === ':',
    [TokenType.Semicolon]: tok => tok === ';'
};

export type Token = {
    source: string,
    type: TokenType,
    charIndex?: number,
    resource?: string
}

export const reservedWords: string[] = [
    'import',
]

export default function Lex(input: string, resource: string = "<unknown>"): Token[] {
    const tokens: Token[] = [];

    let source = Array.from(input);
    let charIndex: number = 0;

    while (source.length > 0) {
        const accumulator: string[] = [];
        let token: Token | null = null;

        for (const i of source) {
            accumulator.push(i);

            for (const [a, j] of Object.entries(matchers))
                if (j(accumulator.join('')))
                    token = {
                        source: accumulator.join(''),
                        type: Number(a) as TokenType,
                        charIndex: charIndex,
                        resource: resource
                    };
        }

        if (token) {
            tokens.push(token)
            source = source.slice(token.source.length);
            charIndex += token.source.length;
        } else
            throw {
                file: resource,
                charIndex: charIndex,
                msg: `SyntaxError: Token ${accumulator.join('')} wasn't recognised`
            }
    }

    return tokens;
}
