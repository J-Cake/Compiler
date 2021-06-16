import {Construct, ConstructType} from "../Parse";
import {Operator, operators, Token, TokenType} from "../Lex";

export const extractInfix = (expression: Construct<ConstructType.Expression>): (Construct<ConstructType.Value> | Token<TokenType.Operator>)[] => expression.body.map((i, a) => i ?? expression.data[a]);

export function postfixExpression(input: Construct<ConstructType.Expression>): (Construct<ConstructType.Value> | Operator)[] {
    const output: (Construct<ConstructType.Value> | Operator)[] = [];
    const opstack: (Operator | TokenType.LeftParenthesis | TokenType.RightParenthesis)[] = [];

    const expr = extractInfix(input);

    const getOp = (op: Token<TokenType.Operator>): Operator => Object.keys(operators)
        .map(i => Number(i))
        .find((i: keyof typeof operators) => operators[i].matcher(op.source));

    for (const i of expr)
        if ('constructType' in i)
            output.push(i);
        else {
            while (opstack[opstack.length - 1] in Operator &&
            (operators[getOp(i) as Operator].associativity === 'left' && operators[getOp(i) as Operator].precedence <= operators[opstack[opstack.length - 1] as Operator].precedence) ||
            (operators[getOp(i) as Operator].associativity === 'right' && operators[getOp(i) as Operator].precedence < operators[opstack[opstack.length - 1] as Operator].precedence))
                output.push(opstack.pop() as Operator);

            opstack.push(getOp(i));
        } // Do shit with brackets

    output.push(...opstack.filter(i => i in Operator).reverse() as Operator[]);

    return output;
}