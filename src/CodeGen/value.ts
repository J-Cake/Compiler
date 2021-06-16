import {Token, TokenType} from "../Lex";
import {Construct, ConstructType, Value as TokenValue} from "../Parse";
import {Context, ValuePointer} from "./Generate";
import {getSnippet} from "../util";

/**
 * A list of all possible ways in which a binary sequence can be interpreted.
 * raw: A raw binary sequence - can be used to store integers or other binary information
 * float: An IEEE floating-point binary number
 * str: A sequence of unicode characters
 * fn: A pointer to a function
 * list: A pointer to a list
 * dict: A pointer to a dictionary
 * ptr: A pointer to a pointer
 */
export enum Value {
    Raw,
    Float,
    String,
    Function,
    List,
    Dictionary,
    Pointer
}

export type Primitive<Type extends Value = Value> = [dataType: Type, value: Buffer];

export default function mkPointer(input: Construct<ConstructType.Value, TokenValue>, context: Context): Primitive {
    const firstValue = input.data[0];

    if ('type' in firstValue && firstValue.type !== TokenType.Identifier)
        return extractPrimitive(firstValue as Token<TokenType.Integer | TokenType.Boolean | TokenType.String>);
    else if ('type' in firstValue)
        return [Value.Pointer, Buffer.from([findSymbol(context, firstValue as Token<TokenType.Identifier>).address])];
    else
        console.log('evaluating construct', firstValue);

    return [Value.Raw, Buffer.alloc(1)];
}

export function findSymbol(context: Context, reference: Token<TokenType.Identifier>): ValuePointer {
    if (context.scope.has(reference.source))
        return context.scope.get(reference.source)
    else if (context.parent)
        return findSymbol(context.parent, reference);
    else
        throw {
            msg: `ReferenceError: Reference to unknown symbol \`${reference.source}\`.`,
            origin: reference,
            getSnippet: () => getSnippet(reference)
        };
}

export function extractPrimitive(primitive: Token<TokenType.Integer | TokenType.String | TokenType.Boolean>): Primitive {
    const actions: Record<typeof primitive.type, (token: typeof primitive) => Primitive> = {
        [TokenType.Integer]: token => [Value.Raw, Buffer.from([Number(token.source)])],
        [TokenType.String]: token => [Value.String, Buffer.from(token.source.slice(1, -1))],
        [TokenType.Boolean]: token => [Value.Raw, Buffer.from([token.source === 'true' ? 1 : 0])]
    };

    return actions[primitive.type](primitive);
}