import {Construct, ConstructType} from "./Parse";

import {InstructionType, TokenType} from 'jcpu/asm/data';
import {Tuple} from "jcpu/vm/util";
import {Token as ASMToken} from "jcpu/asm/Lexer";
import {deepFlat, importFile, mkFn, postfixExpression, quickActions, recallFunction, Value} from "./convert_utils";
import util from "util";
import {Operator} from "./Lex";

export type ValuePointer<T extends Value = Value> = {
    address: number,
    length?: number,
    type: T
}

export type Context = { scope: Map<string, ValuePointer>, parent: Context };

export type ASMContent =
    [InstructionType, Tuple<ASMToken<TokenType.Register> | ASMToken<TokenType.Numeral> | ASMToken<TokenType.Address> | ASMToken<TokenType.Label>, 0 | 1 | 2>]
    |
    [ASMToken<TokenType.Label>];

export type DeepASMContent = ASMContent[] | DeepASMContent[];

export const converters: { [K in ConstructType]: (input: Construct<K>, context: Context) => DeepASMContent } = {
    [ConstructType.ScriptRoot]: function (input, context) {
        return input.body.map(i => converters[ConstructType.Statement](i, context));
    },
    [ConstructType.Import]: function (input, context) {
        return input.body.map(i => converters[ConstructType.ScriptRoot](importFile(i.source.slice(1, -1)), context));
    },
    [ConstructType.Export]: function (input, context) {
        return [];
    },
    [ConstructType.Module]: function (input, context) {
        return [];
    },
    [ConstructType.Function]: function (input, context) {
        const fnPointer = mkFn(input, context);

        return [];
    },
    [ConstructType.Statement]: function (input, context) {
        return input.body.map(i => converters[i.constructType](i, context));
    },
    [ConstructType.List]: function (input, context) {
        return [];
    },
    [ConstructType.Dictionary]: function (input, context) {
        return [];
    },
    [ConstructType.PropertyAccessor]: function (input, context) {
        return [];
    },
    [ConstructType.Call]: function (input, context) {
        return [...quickActions.pushStack, [InstructionType.Jump, [{
            type: TokenType.Address,
            source: `%${recallFunction(input.data).address.toString(16)}`
        }]]];
    },
    [ConstructType.Expression]: function (input, context) {
        const expr = postfixExpression(input);

        for (const i of expr)
            if (typeof i === 'number')
                console.log(Operator[i])
            else
                console.log(converters[ConstructType.Value](i, context));

        return [];
    },
    [ConstructType.Value]: function (input, context) {
        if ('constructType' in input.body[0])
            return converters[input.body[0].constructType](input.body[0]);
        else
            console.log(input.body[0]);

        return [];
    },
}

export default function Convert(script: Construct<ConstructType.ScriptRoot>): ASMContent[] {
    const context: Context = {scope: new Map(), parent: null};

    return [...quickActions.mkStack, ...deepFlat(converters[ConstructType.ScriptRoot](script, context)) as ASMContent[]];
}