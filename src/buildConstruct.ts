import {Construct, ConstructType, Repeat, Select, Value} from "./Parse";
import {Token, TokenType} from "./Lex";

export type ConstructMap = {
    [P in ConstructType]: (tokens: Token[]) => Construct<P>
};

export function removeSpace(tokens: Token[]): Token<Exclude<TokenType, TokenType.Space>>[] {
    return tokens.filter(i => i.type !== TokenType.Space);
}

const matchExpressionList = function (tokens: Token[], constructors: ConstructMap, onClose: 'bracket' | 'brace' | 'paren' = 'paren'): Token[][] {
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
const split = (tokens: Token[], by: TokenType, keepDelimiter?: boolean): Token[][] => tokens.reduce((a: Token[][], i: Token) => i.type === by ? [...a, keepDelimiter ? [i] : []] : [...a.slice(0, -1), a[a.length - 1].concat(i)], [[]]);
export type Fn = [returnType: Token<TokenType.TypeReference>, params: { [param: string]: [type: Token<TokenType.TypeReference>, name: Token<TokenType.Identifier>] }];

export default function buildConstructors(): ConstructMap {
    const constructors: ConstructMap = {
        [ConstructType.List](_tok: Token[]): Construct<ConstructType.List> {
            const tokens = removeSpace(_tok);
            if (tokens[0].type === TokenType.LeftBracket && tokens[tokens.length - 1].type === TokenType.RightBracket)
                return {
                    body: matchExpressionList(tokens.slice(1, -1), constructors).map(i => constructors[ConstructType.Expression](i)),
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
                        body: matchExpressionList(params, constructors).map(i => constructors[ConstructType.Expression](i)),
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
        [ConstructType.Function](_tok: Token[]): Construct<ConstructType.Function, Fn> {
            // TODO: Add some sort of `do` expression, where passing a list of functions will generate a new function, calling all its children in sequence
            const tokens = removeSpace(_tok);

            const params: { [param: string]: [type: Token<TokenType.TypeReference>, name: Token<TokenType.Identifier>] } = {};

            const trigger = tokens.findIndex(i => i.type === TokenType.Lambda);

            const preTrigger = tokens.slice(0, trigger);
            let returnType: Token<TokenType.TypeReference> = null;

            if (preTrigger[preTrigger.length - 1].type === TokenType.RightParenthesis) {
                const preParens = preTrigger.slice(0, preTrigger.findIndex(i => i.type === TokenType.LeftParenthesis))

                if (preParens[0].type === TokenType.TypeReference)
                    returnType = preParens[0] as typeof returnType;
                else
                    throw {
                        msg: `SyntaxError - Functions must specify their return type - ${ConstructType[ConstructType.Function]}`,
                        matcher: ConstructType.Function,
                        tokens
                    }
            } else {
                if (preTrigger[0].type !== TokenType.TypeReference || (preTrigger[1] && preTrigger[1].type !== TokenType.TypeReference))
                    throw {
                        msg: `SyntaxError - Functions must specify their return type - ${ConstructType[ConstructType.Function]}`,
                        matcher: ConstructType.Function,
                        tokens
                    }
                returnType = preTrigger[0] as typeof returnType;
            }

            if (trigger > 0) {
                const paramList = tokens.slice(0, trigger);
                const isNamed = paramList.some(i => i.type === TokenType.LeftParenthesis) && paramList[1].type === TokenType.Identifier;

                const parse = function (input: typeof paramList) {
                    const rpt = new Repeat([TokenType.TypeReference, TokenType.Identifier]).action(input);

                    for (const i of rpt)
                        params[i[1].source] = [i[0] as Token<TokenType.TypeReference>, i[1] as Token<TokenType.Identifier>];
                }

                if (isNamed) {
                    if (paramList[2].type === TokenType.LeftParenthesis && paramList[paramList.length - 1].type === TokenType.RightParenthesis)
                        parse(paramList.slice(3, -1));
                    else
                        throw {
                            msg: `SyntaxError - Named Functions must be parenthesised - ${ConstructType[ConstructType.Function]}`,
                            matcher: ConstructType.Function,
                            tokens
                        }
                } else {
                    if (paramList[1].type === TokenType.LeftParenthesis && paramList[paramList.length - 1].type === TokenType.RightParenthesis)
                        parse(paramList.slice(2, -1));
                    else
                        parse(paramList.slice(1));
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
                data: [returnType, params]
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
        [ConstructType.Value](_tok: Token[]): Construct<ConstructType.Value, Value> {
            const tokens = removeSpace(_tok);

            if (!_tok || _tok.length <= 0)
                throw {
                    msg: `SyntaxError - Expected Value - ${ConstructType[ConstructType.Value]}`,
                    matcher: ConstructType.Value,
                    tokens
                }

            const constructSelect = new Select([ConstructType.Call, ConstructType.PropertyAccessor, ConstructType.Function]);

            const segments = Array.from(countParens(tokens, false))
                .map(i => [i, i.findIndex(i => i.type === TokenType.LeftParenthesis)] as const)
                .map(i => i[1] > 0 ? [i[0].slice(0, i[1]), [i[0].slice(i[1])]] as const : [i[0], []] as const)
                .map(i => [split(i[0], TokenType.SubReference, true), i[1]]).flat(2).filter(i => i.length > 0);

            const merged = segments.reduce((acc: Token[][], i: Token[]) => i[0].type === TokenType.LeftParenthesis ? [...acc.slice(0, -1), [...acc[acc.length - 1], ...i]] : [...acc, i], [[]]);

            let type: ConstructType | TokenType;
            return {
                body: [],
                constructType: ConstructType.Value,
                data: merged.map(i => typeof (type = constructSelect.action(i)) === 'number' ? constructors[type](i) : i).flat(1) as Value
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
