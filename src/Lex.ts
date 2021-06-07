export enum TokenType {
    Space,
    Newline,
    Integer,
    Boolean,
    String,
    ControlFlow,
    Import,
    Export,
    Module,
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
    Semicolon,
    Lambda,
    // TODO: Add some sort of assignment operator that can be used for temporary assignment.
    // `getStyle(a = getCurrentPointer(), styleSheet[a + 1])`
    // This would allow for the reuse of certain variables, and allow for much simpler expressions.
}

export enum Operator {
    Add,
    Subtract,
    Multiply,
    Divide,
    Modulo,
    Exponent,

    Factorial,

    Equals,
    LessThan,
    GreaterThan,

    And,
    Or,
    Not
}

export type operator = {
    matcher: (tok: string) => boolean,
    operands: 1 | 2,
    precedence: number,
    associativity: 'left' | 'right',
    type: 'binary' | 'numeric'
}

export const operators: Record<Operator, operator> = {
    [Operator.Add]: {
        matcher: tok => tok === "+",
        operands: 2,
        precedence: 3,
        associativity: 'left',
        type: 'numeric'
    },
    [Operator.Subtract]: {
        matcher: tok => tok === "-",
        operands: 2,
        precedence: 3,
        associativity: 'left',
        type: 'numeric'
    },
    [Operator.Multiply]: {
        matcher: tok => tok === "*",
        operands: 2,
        precedence: 4,
        associativity: 'left',
        type: 'numeric'
    },
    [Operator.Divide]: {
        matcher: tok => tok === "/",
        operands: 2,
        precedence: 4,
        associativity: 'left',
        type: 'numeric'
    },
    [Operator.Modulo]: {
        matcher: tok => tok === "mod",
        operands: 2,
        precedence: 4,
        associativity: 'left',
        type: 'numeric'
    },
    [Operator.Exponent]: {
        matcher: tok => tok === "^" || tok === "**",
        operands: 2,
        precedence: 5,
        type: 'numeric',
        associativity: 'right'
    },
    [Operator.Factorial]: {
        matcher: tok => tok === "!",
        operands: 1,
        precedence: 5,
        associativity: 'left',
        type: 'numeric'
    },

    [Operator.Equals]: {
        matcher: tok => tok === "==",
        operands: 2,
        precedence: 2,
        associativity: 'left',
        type: 'binary'
    },
    [Operator.LessThan]: {
        matcher: tok => tok === "<",
        operands: 2,
        precedence: 2,
        associativity: 'left',
        type: 'binary'
    },
    [Operator.GreaterThan]: {
        matcher: tok => tok === ">",
        operands: 2,
        precedence: 2,
        associativity: 'left',
        type: 'binary'
    },
    [Operator.And]: {
        matcher: tok => tok === "and",
        operands: 2,
        precedence: 1,
        associativity: 'left',
        type: 'binary'
    },
    [Operator.Or]: {
        matcher: tok => tok === "or",
        operands: 2,
        precedence: 1,
        associativity: 'left',
        type: 'binary'
    },
    [Operator.Not]: {
        matcher: tok => tok === "not",
        operands: 1,
        precedence: 1,
        associativity: 'right',
        type: 'binary'
    }
};

export enum ControlFlow {
    If,
    Each,
    Loop
}


export const controlFlowStruct: Record<ControlFlow, (tok: string) => boolean> = {
    [ControlFlow.If]: tok => tok === 'if',
    [ControlFlow.Each]: tok => tok === 'each',
    [ControlFlow.Loop]: tok => tok === 'loop',
};

export const matchers: Record<TokenType, (tok: string) => boolean> = {
    [TokenType.Operator]: tok => Object.values(operators).some(i => i.matcher(tok)),
    [TokenType.Integer]: tok => /^-?\d+$/.test(tok),
    [TokenType.Boolean]: tok => tok === "true" || tok === "false",
    [TokenType.String]: tok => /^((?<![\\])['"])((?:.(?!(?<![\\])\1))*.?)\1$/.test(tok), // Thanks internet (https://www.metaltoad.com/blog/regex-quoted-string-escapable-quotes)
    [TokenType.Identifier]: tok => !reservedWords.includes(tok) && /^[a-zA-Z$_@][a-zA-Z0-9$_@]*$/.test(tok),
    [TokenType.ControlFlow]: tok => Object.values(controlFlowStruct).some(i => i(tok)),
    [TokenType.Space]: tok => /^[ \t]+$/.test(tok),
    [TokenType.Newline]: tok => /^\n+$/.test(tok),
    [TokenType.Comment]: tok => /^#.*\n$/.test(tok),

    [TokenType.Lambda]: tok => tok === "=>",
    [TokenType.Import]: tok => tok === "import",
    [TokenType.Export]: tok => tok === "export",
    [TokenType.Module]: tok => tok === "module",
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

export type Token<T extends TokenType = any> = {
    source: string,
    type: T,
    charIndex?: number,
    resource?: string
}

export const reservedWords: string[] = [
    'import',
    'export',
    'return',
    'if',
    'each',
    'loop'
];

export default function Lex(input: string, resource: string = "<unknown>"): Token[] { // I love how simple this gets
    const tokens: Token[] = [];

    let source = Array.from(input.trim());
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

    for (const [a, i] of tokens.entries())
        if (i.type === TokenType.Newline && tokens[a - 1]?.type !== TokenType.Space)
            tokens.splice(a + 1, 0, {
                source: "",
                type: TokenType.Space,
                charIndex: i.charIndex,
                resource: i.resource
            })

    tokens.splice(0, 0, {
        source: "",
        type: TokenType.Space,
        charIndex: tokens[0].charIndex,
        resource: tokens[0].resource
    });

    return tokens;
}
