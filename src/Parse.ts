import {Token, TokenType} from "./Lex";
import Constructors, {removeSpace} from "./buildConstruct";

// export type MatchChain = (TokenType | ConstructType | Matcher<(TokenType | ConstructType)[]>)[];

export enum ConstructType { // Must go negative, otherwise, cannot be distinguished from TokenType
    List = -1,
    Dictionary = -2,
    PropertyAccessor = -3,
    Call = -4,
    Function = -5,
    Block = -6,
    Expression = -7,
    Value = -8,
    ControlFlow = -9,
    Statement = -10,
    Import = -11
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

    constructor(rule: Expr, sep?: Separator) {
        super(rule);
        this.sep = sep ?? TokenType.Comma as Separator;

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

        const split: Token[] = [];
        for (const i of tokens)
            if (i.type === this.sep)
                groups.push(split.splice(0, split.length).concat(i as Token<Separator>) as [...Token[], Token<Separator>]);
            else
                split.push(i);

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

        return groups;
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

export class Optional<Expr extends (TokenType | ConstructType)[]> extends Matcher<Expr> {
    constructor(rule) {
        super(rule);

        if (rule.filter(i => i in ConstructType).length > 1)
            throw {msg: `Cannot match against two nested constructs`};
    }

    /**
     * Return true if the token list has been omitted, otherwise, match only if the rule matches the list of tokens.
     * @param tokens the list of tokens to match against
     */
    action(tokens: Token[]): boolean {
        if (tokens.length === 0)
            return true;

        const rule = Array.from(this.rule);

        while (rule.length > 0)
            if (rule[0] in TokenType && tokens[0].type !== rule.shift())
                return false;

        rule.reverse();
        tokens.reverse();

        while (rule.length > 0)
            if (rule[0] in TokenType && tokens[0].type !== rule.shift())
                return false;

        try {
            constructors[rule[0]](tokens.reverse());
            return false;
        } catch (err) {
            return true;
        }
    }
}

export type Construct<T extends ConstructType, K = any> = {
    constructType: T;
    body: Token[] | Construct<any>[],
    data?: K
};

const constructors = Constructors();

export default function Parse(tokens: Token[]): Construct<ConstructType.Block> {
    return constructors[ConstructType.Block](tokens);
}
