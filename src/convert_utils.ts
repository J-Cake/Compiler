import {Construct, ConstructType} from "./Parse";
import {ASMContent, Context, converters, ValuePointer} from "./Converter";
import {Operator, operators, Token, TokenType} from "./Lex";
import {TokenType as ASMTokenType} from 'jcpu/asm/data';

export enum Value {
    Integer,
    Boolean,
    String,
    List,
    Dictionary,
    Function
}

type deepArray<T extends K[], K = any> = K[] | deepArray<T, K>[];
export const deepFlat = function <T extends deepArray<A[]>, A>(arr: T): A[] {
    const flattened: A[] = [];

    const flat = (arr: T) => {
        for (const i of arr)
            if (Array.isArray(i))
                flat(i as T);
            else
                flattened.push(i);
    }

    flat(arr);

    return flattened;
}

export function importFile(specifier: string): Construct<ConstructType.ScriptRoot> {
    // throw {
    //     msg: `ImportError - Cannot find module ${specifier}`,
    //     searchPaths: []
    // }
    return {
        body: [],
        constructType: ConstructType.ScriptRoot
    };
}

export function recallFunction(value: Construct<ConstructType.Value>): ValuePointer<Value.Function> {
    return {
        address: 0,
        type: Value.Function
    }
}

let fns = 0;

export function mkFn(fn: Construct<ConstructType.Function, Token<TokenType.Identifier>[]>, context: Context): ValuePointer<Value.Function> & { name?: string } {
    const newContext: Context = {
        parent: context,
        scope: new Map()
    };

    const instructions: ASMContent[] = [
        [{type: ASMTokenType.Label, source: `::fn-${fns++}`}],
        ...fn.body.map(i => converters[i.constructType](i, newContext))
    ];

    console.log(instructions);

    // To find the return address, the top value is popped off the stack,
    // a pointer to the return value is pushed on, and then jumped

    return {
        address: 0,
        length: 0,
        type: undefined
    }
}

export const quickActions: { [action: string]: ASMContent[] } = {
    mkStack: [],
    pushStack: []
};

export const extractInfix = (expression: Construct<ConstructType.Expression>): (Construct<ConstructType.Value> | Token<TokenType.Operator>)[] => expression.body.map((i, a) => i ?? expression.data[a]);

export function postfixExpression(input: Construct<ConstructType.Expression>): (Construct<ConstructType.Value> | Operator)[] {
    const output: (Construct<ConstructType.Value> | Operator)[] = [];
    const opstack: Operator[] = [];

    const expr = extractInfix(input);

    const getOp = op => operators[Object.keys(operators).find(i => operators[Number(i) as keyof typeof operators].matcher(i))];

    for (const i of expr)
        if ('constructType' in i)
            output.push(i);
        else
            console.log(getOp(i.source));

    return output;
}