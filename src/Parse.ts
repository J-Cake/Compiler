import {Token, TokenType} from "./Lex";
import Constructors, {removeSpace} from "./buildConstruct";

export enum ConstructType { // Must go negative, otherwise, cannot be distinguished from TokenType
    ScriptRoot = -1,
    Import = -2,
    Export = -3,
    Module = -4,
    Function = -5,
    // TODO: Actions, Matchers, Iterators, Do Expressions, Exports
    Statement = -7,
    List = -8,
    Dictionary = -9,
    PropertyAccessor = -10,
    Call = -11,
    Expression = -12,
    Value = -13,
}

export interface Match {
    rule: (TokenType | ConstructType)[];

    findShortestMatch(tokens: Token[]): [Token[], number];

    action(tokens: Token[]): Token[][];
}

export abstract class Matcher<Expr extends (TokenType | ConstructType)[]> implements Match {
    rule: Expr;

    constructor(rule: Expr) {
        this.rule = rule;
    }

    abstract action(tokens: Token[]);

    findShortestMatch(tokens: Token[]): [Token[], number] {
        while (tokens.length > 0)
            if (this.action(tokens).length === 0)
                tokens.pop();
        return [tokens, tokens.length];
    }
}

export class Repeat<Expr extends (TokenType | ConstructType)[], Separator extends TokenType = TokenType.Comma> extends Matcher<Expr> {
    sep: Separator;

    trailingSeparators: boolean;

    constructor(rule: Expr, sep?: Separator, trailingSeparators: boolean = false) {
        super(rule);
        this.sep = sep ?? TokenType.Comma as Separator;

        this.trailingSeparators = trailingSeparators;

        if (rule.filter(i => i in ConstructType).length > 1)
            throw {msg: `Cannot match against two nested constructs`};
    }

    /**
     * Splits the tokens by the separator specified in the rule and returns only if all splits match the rule
     * @param _tok the token list to split
     */
    action(_tok: Token[]): [...Token[], Token<Separator>][] {
        const tokens = this.rule.includes(TokenType.Space) ? _tok : removeSpace(_tok);

        if (tokens.length === 0)
            return [];

        const groups: [...Token[], Token<Separator>][] = [];

        const brackets: [number, number, number] = [0, 0, 0] // parens, brackets, braces
        const checkBrackets = function (i: Token): boolean {
            if (i.type === TokenType.LeftParenthesis)
                brackets[0]++;
            else if (i.type === TokenType.RightParenthesis)
                brackets[0]--;
            else if (i.type === TokenType.LeftBracket)
                brackets[1]++;
            else if (i.type === TokenType.RightBracket)
                brackets[1]--;
            else if (i.type === TokenType.LeftBrace)
                brackets[2]++;
            else if (i.type === TokenType.RightBrace)
                brackets[2]--;

            return !(brackets[0] || brackets[1] || brackets[2]);
        }

        const split: Token[] = [];
        for (const i of tokens) {
            if (checkBrackets(i) && i.type === this.sep)
                if (!this.trailingSeparators && split.length > 0 || this.trailingSeparators)
                    groups.push(split.splice(0, split.length).concat(i as Token<Separator>) as [...Token[], Token<Separator>]);
                else
                    throw {
                        msg: `MatchError - Empty group`
                    }
            else
                split.push(i);
        }
        groups.push(split as [...Token[], Token<Separator>]);

        for (const [a, i] of groups.entries()) {
            const matcher = Array.from(this.rule);
            const sequence = Array.from(i);

            while (matcher[0] in TokenType && matcher.length > 0 && sequence.length > 0)
                if (sequence.shift().type !== matcher.shift())
                    throw {
                        msg: 'MatchError - Token Sequence does not match pattern',
                        sequence: groups[a]
                    };

            matcher.reverse();
            sequence.reverse();

            while (matcher[0] in TokenType && matcher.length > 0 && sequence.length > 0)
                if (sequence.shift().type !== matcher.shift())
                    throw {
                        msg: 'MatchError - Token Sequence does not match pattern',
                        sequence: groups[a]
                    };
        }

        if (!groups || groups.length <= 0)
            return [];

        groups[groups.length - 1].push({type: this.sep, source: ''}); // This is to allow the `.slice(0, -1)` on the result of this function

        return groups as [...Token[], Token<Separator>][];
    }

    private matches(tokens: Token[], sep: Token): boolean {
        return !this.rule.some(function (i, a) {
            if (i in ConstructType)
                return false;
            else
                return i === (tokens[a]?.type ?? sep.type);
        });
    }
}

export class Select<Expr extends (TokenType | ConstructType)[]> extends Matcher<Expr> {
    /**
     * Returns which construct was matched in the list of accepted types
     * @param tokens Tokens to match against
     */
    action(tokens: Token[]): TokenType | ConstructType | null {
        const constructMatchers: ConstructType[] = this.rule.filter(i => i in ConstructType) as ConstructType[];
        const tokenMatchers: TokenType[] = this.rule.filter(i => i in TokenType) as TokenType[];

        for (const i of constructMatchers)
            if (!(tokens.length > 0 && i in TokenType))
                try {
                    constructors[i](tokens);
                    return i;
                } catch (err) {
                }
        if (tokens.length > 1)
            return null;

        return tokenMatchers.find(i => i === tokens[0].type) ?? null;
    }
}

export type Construct<T extends ConstructType, K = any> = {
    constructType: T;
    body: Token[] | Construct<any>[],
    data?: K
};

const constructors = Constructors();

export default function Parse(tokens: Token[]): Construct<ConstructType.ScriptRoot> {
    return constructors[ConstructType.ScriptRoot](tokens);
}