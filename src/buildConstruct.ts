import {Construct, ConstructType, Optional, Repeat, Select} from "./Parse";
import {operator, operators, Token, TokenType} from "./Lex";

export type ConstructMap = {
    [P in ConstructType]: (tokens: Token[]) => Construct<P>
};

export function removeSpace(tokens: Token[]): Token<Exclude<TokenType, TokenType.Space>>[] {
    return tokens.filter(i => i.type !== TokenType.Space);
}

export default function buildConstructors(): ConstructMap {
    const matchExpressionList = function (tokens: Token[], onClose: 'bracket' | 'brace' | 'paren' = 'paren'): Token[][] {
        const exprList: Token[][] = [];
        const expr: Token[] = [];
        const brackets: [number, number, number] = [0, 0, 0] // paren, brace, bracket
        for (const i of tokens) {
            const reached0 = function () {
                if (brackets[0] === 0 && brackets[1] === 0 && brackets[2] === 0)
                    exprList.push(expr.splice(0, expr.length));
            };

            expr.push(i);

            if (i.type === TokenType.LeftParenthesis)
                brackets[0]++;
            else if (i.type === TokenType.RightParenthesis) {
                brackets[0]--;
                if (onClose === 'paren')
                    reached0()
            }
            if (i.type === TokenType.LeftBrace)
                brackets[1]++;
            else if (i.type === TokenType.RightBrace) {
                brackets[1]--;
                if (onClose === 'brace')
                    reached0()
            }
            if (i.type === TokenType.LeftBracket)
                brackets[2]++;
            else if (i.type === TokenType.RightBracket) {
                brackets[2]--;
                if (onClose === 'bracket')
                    reached0();
            }
        }
        if (expr.length > 0)
            exprList.push(expr);
        for (const i of exprList)
            try {
                constructors[ConstructType.Expression](i)
            } catch (err) {
                throw {
                    msg: `SyntaxError - Invalid Syntax - ${ConstructType[ConstructType.Expression]}`,
                    matcher: ConstructType.Expression,
                    tokens
                }
            }
        return exprList;
    }

    const constructors: ConstructMap = {
        [ConstructType.List](_tok: Token[]): Construct<ConstructType.List> {
            const tokens = removeSpace(_tok);
            if (tokens[0].type === TokenType.LeftBracket && tokens[tokens.length - 1].type === TokenType.RightBracket)
                return {
                    body: matchExpressionList(tokens.slice(1, -1)).map(i => constructors[ConstructType.Expression](i)),
                    constructType: ConstructType.List
                };
            else
                throw {
                    msg: `SyntaxError - Invalid Syntax - ${ConstructType[ConstructType.List]}`,
                    matcher: ConstructType.List,
                    tokens
                }
        },
        [ConstructType.Dictionary](_tok: Token[]): Construct<ConstructType.Dictionary> {
            const tokens = removeSpace(_tok);
            const grammar: [TokenType.LeftBrace, Repeat<[TokenType.Identifier, TokenType.Colon, ConstructType.Expression]>, TokenType.RightBrace] =
                [TokenType.LeftBrace, new Repeat([TokenType.Identifier, TokenType.Colon, ConstructType.Expression]), TokenType.RightBrace];


            return {body: undefined, constructType: ConstructType.Dictionary}
        },
        [ConstructType.Call](_tok: Token[]): Construct<ConstructType.Call, Construct<ConstructType.Value>> {
            // We gotta do a backwards bracket count
            let bracketCount = 0;
            const tokens = removeSpace(_tok).reverse();

            let identifier: Token[];
            let params: Token[];

            for (const [a, i] of tokens.entries()) {
                if (i.type === TokenType.RightParenthesis)
                    bracketCount++;
                else if (i.type === TokenType.LeftParenthesis) {
                    bracketCount--;
                    if (bracketCount <= 0) { // We have reached the start
                        identifier = tokens.slice(a + 1).reverse();
                        params = tokens.slice(0, a + 1).reverse();
                        break;
                    }
                }
            }

            return {
                body: matchExpressionList(params.slice(1, -1)).map(i => constructors[ConstructType.Expression](i)),
                constructType: ConstructType.Call,
                data: constructors[ConstructType.Value](identifier)
            };
        },
        [ConstructType.PropertyAccessor](_tok: Token[]): Construct<ConstructType.PropertyAccessor, Construct<ConstructType.Value>> {
            let bracketCount = 0;
            const tokens = removeSpace(_tok).reverse();

            let identifier: Token[];
            let params: Token[];

            for (const [a, i] of tokens.entries()) {
                if (i.type === TokenType.RightBracket)
                    bracketCount++;
                else if (i.type === TokenType.LeftBracket) {
                    bracketCount--;
                    if (bracketCount <= 0) { // We have reached the start
                        identifier = tokens.slice(a + 1).reverse();
                        params = tokens.slice(0, a + 1).reverse();
                        break;
                    }
                }
            }

            return {
                body: matchExpressionList(params.slice(1, -1)).map(i => constructors[ConstructType.Expression](i)),
                constructType: ConstructType.PropertyAccessor,
                data: constructors[ConstructType.Value](identifier)
            };
        },
        [ConstructType.Function](_tok: Token[]): Construct<ConstructType.Function> {
            const tokens = removeSpace(_tok);

            return {body: undefined, constructType: ConstructType.Function}
        },
        [ConstructType.Block](tokens: Token[]): Construct<ConstructType.Block> {
            return {
                body: new Repeat([TokenType.Space, ConstructType.Statement], TokenType.Newline)
                    .action(tokens).map(i => constructors[ConstructType.Statement](i.slice(0, -1))),
                constructType: ConstructType.Block
            }
        },
        // We may need to handle cases where bracket counts are completed within lists, meaning we need to account for all bracket types.
        // Only once all three bracket types are 0 can we safely say the expression has terminated.
        [ConstructType.Expression](_tok: Token[]): Construct<ConstructType.Expression, { operand: Construct<ConstructType.Value>, operator: Token<TokenType.Operator> }> {
            const tokens = removeSpace(_tok);
            const grammar: [Optional<[ConstructType.Value]>, TokenType.Operator, Select<[ConstructType.Value, ConstructType.Expression]>] =
                [new Optional([ConstructType.Value]), TokenType.Operator, new Select([ConstructType.Value, ConstructType.Expression])];

            const checkLeftOperator = function (): ConstructType | TokenType | null {
                if (tokens[0].type === TokenType.Operator) {
                    const op = tokens[0].source;
                    const operator: operator = operators[Object.keys(operators).find(i => (operators[i] as operator).matcher(op))];

                    if (operator.associativity === 'right' && operator.operands === 1)
                        return grammar[2].action(tokens.slice(1));
                    return null;
                } else
                    return null;
            }

            const secondConstruct = grammar[2].action(tokens.slice(1));
            const left = checkLeftOperator();

            if (left && secondConstruct === ConstructType.Value)
                return {
                    body: [constructors[ConstructType.Value](tokens.slice(1))],
                    constructType: ConstructType.Expression,
                    data: {
                        operand: null,
                        operator: tokens[0] as Token<TokenType.Operator>
                    }
                };
            else if (left && secondConstruct === ConstructType.Expression)
                return {
                    body: [constructors[ConstructType.Expression](tokens.slice(1))],
                    constructType: ConstructType.Expression,
                    data: {
                        operand: null,
                        operator: tokens[0] as Token<TokenType.Operator>
                    }
                }
            else { // First parameter is a value call, meaning it can contain expressions.
                let bracketCount: number = 0;

                const buildConstruct = function (a, i): Construct<ConstructType.Expression> {
                    try {
                        const op1 = constructors[ConstructType.Value](tokens.slice(0, a));
                        return {
                            body: tokens.slice(a + 1),
                            constructType: ConstructType.Expression,
                            data: {
                                operand: op1,
                                operator: tokens[a] as Token<TokenType.Operator>
                            }
                        }
                    } catch (err) {
                        throw {
                            msg: `SyntaxError - Invalid Syntax - ${ConstructType[ConstructType.Expression]}`,
                            matcher: ConstructType.Expression,
                            tokens
                        }
                    }
                }

                for (const [a, i] of tokens.entries())
                    if (i.type === TokenType.LeftParenthesis)
                        bracketCount++;
                    else if (i.type === TokenType.RightParenthesis) {
                        bracketCount--;
                        if (bracketCount <= 0)
                            return buildConstruct(a, i);
                    } else if (i.type === TokenType.Operator && bracketCount === 0)
                        return buildConstruct(a, i);
            }
        },
        [ConstructType.Value](_tok: Token[]): Construct<ConstructType.Value> {
            const tokens = removeSpace(_tok);
            const grammar: [Select<[TokenType.Identifier, TokenType.Integer, TokenType.Boolean, TokenType.Dot, ConstructType.Call, ConstructType.PropertyAccessor, ConstructType.List, ConstructType.Dictionary, TokenType.LeftParenthesis, TokenType.RightParenthesis]>] =
                [new Select([TokenType.Identifier, TokenType.Integer, TokenType.Boolean, TokenType.Dot, ConstructType.Call, ConstructType.PropertyAccessor, ConstructType.List, ConstructType.Dictionary, TokenType.LeftParenthesis, TokenType.RightParenthesis])];

            const type = grammar[0].action(tokens);

            if (type in TokenType)
                return {body: [tokens[0]], constructType: ConstructType.Value};
            else if (type in ConstructType)
                return {body: constructors[type](tokens), constructType: ConstructType.Value};
            else
                throw {
                    msg: `SyntaxError - Invalid Syntax - ${ConstructType[ConstructType.Value]}`,
                    matcher: ConstructType.Value,
                    tokens
                }
        },
        [ConstructType.ControlFlow](_tok: Token[]): Construct<ConstructType.ControlFlow> {
            const grammar: [TokenType.ControlFlow, ConstructType.Expression, ConstructType.Block] =
                [TokenType.ControlFlow, ConstructType.Expression, ConstructType.Block];


            return {body: undefined, constructType: ConstructType.ControlFlow}
        },
        [ConstructType.Statement](_tok: Token[]): Construct<ConstructType.Statement> {
            const grammar: [Select<[ConstructType.Import, ConstructType.ControlFlow, ConstructType.Function, ConstructType.Expression]>] =
                [new Select([ConstructType.Import, ConstructType.ControlFlow, ConstructType.Function, ConstructType.Expression])];

            const type = grammar[0].action(removeSpace(_tok));

            if (type in ConstructType)
                return {body: constructors[type](_tok), constructType: ConstructType.Statement};
            else throw {
                msg: `SyntaxError - Invalid Syntax - ${ConstructType[ConstructType.Statement]}`,
                matcher: ConstructType.Statement,
                tokens: removeSpace(_tok)
            }
        },
        [ConstructType.Import](_tok: Token[]): Construct<ConstructType.Import> {
            const tokens = removeSpace(_tok);
            const grammar: [TokenType.Import, Repeat<[TokenType.String]>] =
                [TokenType.Import, new Repeat([TokenType.String])];

            if (tokens[0].type === grammar[0] && grammar[1].action(tokens.slice(1)))
                return {body: tokens.filter(i => i.type === TokenType.String), constructType: ConstructType.Import};
            else throw {
                msg: `SyntaxError - Invalid Syntax - ${ConstructType[ConstructType.Import]}`,
                matcher: ConstructType.Import,
                tokens
            }
        },
    }

    return constructors;
}
