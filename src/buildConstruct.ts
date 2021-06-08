import {Construct, ConstructType, Repeat, Select} from "./Parse";
import {Token, TokenType} from "./Lex";

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

            if (i.type === TokenType.Comma)
                reached0();
            else
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
    const countParens = function* (tokens: Token[], includePrev: boolean = true): Generator<Token[]> {
        const brackets: [number, number, number] = [0, 0, 0];
        const accumulator: Token[] = [];

        for (const i of tokens) {
            accumulator.push(i);
            if (i.type === TokenType.LeftParenthesis)
                brackets[0]++;
            else if (i.type === TokenType.RightParenthesis) {
                brackets[0]--;
                if (!(brackets[0] || brackets[1] || brackets[2]))
                    if (includePrev)
                        yield Array.from(accumulator);
                    else
                        yield accumulator.splice(0, accumulator.length)
            } else if (i.type === TokenType.LeftBracket)
                brackets[1]++;
            else if (i.type === TokenType.RightBracket) {
                brackets[1]--;
                if (!(brackets[0] || brackets[1] || brackets[2]))
                    if (includePrev)
                        yield Array.from(accumulator);
                    else
                        yield accumulator.splice(0, accumulator.length)
            } else if (i.type === TokenType.LeftBrace)
                brackets[2]++;
            else if (i.type === TokenType.RightBrace) {
                brackets[2]--;
                if (!(brackets[0] || brackets[1] || brackets[2]))
                    if (includePrev)
                        yield Array.from(accumulator);
                    else
                        yield accumulator.splice(0, accumulator.length)
            }
        }

        // Only if there was a change, should we re-emit the last of the accumulator.
        if (![TokenType.RightBrace, TokenType.RightBracket, TokenType.RightParenthesis].includes(tokens[tokens.length - 1].type))
            yield accumulator;
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

            throw {
                msg: `SyntaxError - Invalid Syntax - ${ConstructType[ConstructType.Dictionary]}`,
                matcher: ConstructType.Dictionary,
                tokens
            }

            // return {body: undefined, constructType: ConstructType.Dictionary}
        },
        [ConstructType.Call](_tok: Token[]): Construct<ConstructType.Call, Construct<ConstructType.Value>> {
            // We gotta do a backwards bracket count
            if (_tok.length > 2 && _tok.some(i => i.type === TokenType.LeftParenthesis)) { // just a tiny little optimisation
                let bracketCount = 0;
                const tokens = Array.from(removeSpace(_tok)).reverse();

                if (tokens.length > 2 && tokens.some(i => i.type === TokenType.LeftParenthesis)) {

                    let identifier: Token[];
                    let params: Token[];

                    for (const [a, i] of tokens.entries()) {
                        if (i.type === TokenType.RightParenthesis)
                            bracketCount++;
                        else if (i.type === TokenType.LeftParenthesis) {
                            bracketCount--;
                            if (bracketCount <= 0) { // We have reached the start
                                identifier = tokens.slice(a + 1).reverse();
                                params = tokens.slice(0, a + 1).reverse().slice(1, -1);
                                break;
                            }
                        }
                    }

                    return {
                        body: matchExpressionList(params).map(i => constructors[ConstructType.Expression](i)),
                        constructType: ConstructType.Call,
                        data: constructors[ConstructType.Value](identifier),
                    };
                } else throw {
                    msg: `SyntaxError - Invalid Syntax - ${ConstructType[ConstructType.Call]}`,
                    matcher: ConstructType.Call,
                    tokens: tokens
                }
            } else throw {
                msg: `SyntaxError - Invalid Syntax - ${ConstructType[ConstructType.Call]}`,
                matcher: ConstructType.Call,
                tokens: _tok
            }
        },
        [ConstructType.PropertyAccessor](_tok: Token[]): Construct<ConstructType.PropertyAccessor, Construct<ConstructType.Value>> {
            let bracketCount = 0;
            const tokens = removeSpace(_tok).reverse();

            let identifier: Token[];
            let prop: Token[];

            for (const [a, i] of tokens.entries())
                if (i.type === TokenType.RightBracket)
                    bracketCount++;
                else if (i.type === TokenType.LeftBracket) {
                    bracketCount--;
                    if (bracketCount <= 0) { // We have reached the start
                        identifier = tokens.slice(a + 1).reverse();
                        prop = tokens.slice(0, a + 1).reverse().slice(1, -1);
                        break;
                    }
                }

            if (!prop || !identifier || prop.length <= 0 || identifier.length <= 0)
                throw {
                    msg: `SyntaxError - Expected Value - ${ConstructType[ConstructType.PropertyAccessor]}`,
                    matcher: ConstructType.PropertyAccessor,
                    tokens
                }

            return {
                body: [constructors[ConstructType.Expression](prop)],
                constructType: ConstructType.PropertyAccessor,
                data: constructors[ConstructType.Value](identifier)
            };
        },
        [ConstructType.Function](_tok: Token[]): Construct<ConstructType.Function, Token<TokenType.Identifier>[]> {
            // TODO: Add some sort of `do` expression, where passing a list of functions will generate a new function, calling all its children in sequence
            const tokens = removeSpace(_tok);

            const params: Token<TokenType.Identifier>[] = [];

            const trigger = tokens.findIndex(i => i.type === TokenType.Lambda);
            if (trigger >= 0) {
                const paramList = tokens.slice(0, trigger);
                const isNamed = paramList.some(i => i.type === TokenType.LeftParenthesis) && paramList[0].type === TokenType.Identifier;

                if (isNamed) {
                    if (paramList[1].type === TokenType.LeftParenthesis && paramList[paramList.length - 1].type === TokenType.RightParenthesis)
                        params.push(...new Repeat([TokenType.Identifier]).action(paramList.slice(2, -1)).map(i => i[0] as Token<TokenType.Identifier>));
                    else
                        throw {
                            msg: `SyntaxError - Named Functions must be parenthesised - ${ConstructType[ConstructType.Function]}`,
                            matcher: ConstructType.Function,
                            tokens
                        }
                } else {
                    if (paramList[0].type === TokenType.LeftParenthesis && paramList[paramList.length - 1].type === TokenType.RightParenthesis)
                        params.push(...new Repeat([TokenType.Identifier]).action(paramList.slice(1, -1)).map(i => i[0] as Token<TokenType.Identifier>))
                    else
                        params.push(...new Repeat([TokenType.Identifier]).action(paramList).map(i => i[0] as Token<TokenType.Identifier>));
                }
            } else
                throw {
                    msg: `SyntaxError - No function declarator found - ${ConstructType[ConstructType.Function]}`,
                    matcher: ConstructType.Function,
                    tokens
                }

            const expr = constructors[ConstructType.Expression](tokens.slice(trigger + 1));

            return {
                body: [expr],
                constructType: ConstructType.Function,
                data: params
            }

        },
        [ConstructType.Expression](_tok: Token[]): Construct<ConstructType.Expression, Token<TokenType.Operator>[]> {
            // TODO: Implement parenthesised expressions

            const rpt = new Repeat([ConstructType.Value], TokenType.Operator);
            const body = rpt.action(removeSpace(_tok)).map(i => [constructors[ConstructType.Value](i.slice(0, -1)), i.pop()]).flat(1).slice(0, -1);

            return {
                body: body.map(i => 'body' in i ? i : null),
                data: body.map(i => 'body' in i ? null : i),
                constructType: ConstructType.Expression
            };
        },
        [ConstructType.Value](_tok: Token[]): Construct<ConstructType.Value> {
            const tokens = removeSpace(_tok);

            if (!_tok || _tok.length <= 0)
                throw {
                    msg: `SyntaxError - Expected Value - ${ConstructType[ConstructType.Value]}`,
                    matcher: ConstructType.Value,
                    tokens
                }

            return {
                body: Array.from(countParens(tokens)).map(tokens => {
                    // TODO: Add Dictionaries and Lists
                    const constructSelect = new Select([ConstructType.Call, ConstructType.PropertyAccessor, ConstructType.Function]).action(tokens);

                    if (constructSelect)
                        return constructors[constructSelect](tokens);
                    else if (!tokens.find(i => i.type === TokenType.Dot))
                        return [tokens[0]];
                    else
                        return tokens.reduce((a: Token[][], i: Token) => i.type === TokenType.Dot ? [...a, []] : [...a.slice(0, -1), a[a.length - 1].concat(i)], [[]]);
                }),
                constructType: ConstructType.Value
            };
        },
        [ConstructType.Statement](_tok: Token[]): Construct<ConstructType.Statement> {
            const tokens = removeSpace(_tok);
            const grammar = new Select([ConstructType.Import, ConstructType.Function, ConstructType.Expression])
            const type = grammar.action(tokens);

            if (type in ConstructType)
                return {
                    body: [constructors[type](tokens)],
                    constructType: ConstructType.Statement
                };
            else
                throw {
                    msg: `SyntaxError - Invalid Syntax - ${ConstructType[ConstructType.Statement]}`,
                    matcher: ConstructType.Statement,
                    tokens
                }
        },
        [ConstructType.Import](_tok: Token[]): Construct<ConstructType.Import> {
            const tokens = removeSpace(_tok);
            const grammar: [TokenType.Import, Repeat<[TokenType.String]>] =
                [TokenType.Import, new Repeat([TokenType.String])];

            if (tokens[0].type === grammar[0] && grammar[1].action(tokens.slice(1)))
                return {
                    body: tokens.filter(i => i.type === TokenType.String),
                    constructType: ConstructType.Import
                };
            else throw {
                msg: `SyntaxError - Invalid Syntax - ${ConstructType[ConstructType.Import]}`,
                matcher: ConstructType.Import,
                tokens
            }
        },
        [ConstructType.Export](_tok: Token[]): Construct<ConstructType.Export> {
            const tokens = removeSpace(_tok);

            const grammar: Repeat<[ConstructType.Expression]> = new Repeat([ConstructType.Expression]);

            if (tokens[0].type === grammar[0] && grammar[1].action(tokens.slice(1)))
                return {
                    body: grammar.action(tokens).map(i => constructors[ConstructType.Expression](i.slice(0, -1))),
                    constructType: ConstructType.Export
                };
            else throw {
                msg: `SyntaxError - Invalid Syntax - ${ConstructType[ConstructType.Export]}`,
                matcher: ConstructType.Export,
                tokens
            }
        },
        [ConstructType.Module](_tok: Token[]): Construct<ConstructType.Module, string> {
            const tokens = removeSpace(_tok);
            if (tokens[0].type === TokenType.Module && tokens[1].type === TokenType.Identifier)
                return {
                    body: new Repeat([ConstructType.Statement]).action(tokens.slice(2)).map(i => constructors[ConstructType.Statement](i)),
                    constructType: ConstructType.Module,
                    data: tokens[1].source
                };
            else
                throw {
                    msg: `SyntaxError - Invalid Syntax - ${ConstructType[ConstructType.Module]}`,
                    matcher: ConstructType.Module,
                    tokens
                }
        },
        [ConstructType.ScriptRoot](_tok: Token[]): Construct<ConstructType.ScriptRoot> {
            return {
                body: new Repeat([ConstructType.Statement], TokenType.Newline) // TODO: LAST TOKEN MAY NOT BE A NEWLINE
                    .action(_tok).map(i => constructors[ConstructType.Statement](i.slice(0, -1))),
                constructType: ConstructType.ScriptRoot
            }
        }
    }

    return constructors;
}
