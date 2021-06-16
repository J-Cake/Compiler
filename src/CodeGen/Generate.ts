import {Construct, ConstructType} from "../Parse";

import {Tuple} from "jcpu/vm/util";
import {InstructionType, TokenType as ASMTokenType} from 'jcpu/asm/data';
import {Token as ASMToken} from "jcpu/asm/Lexer";

import {Operator} from "../Lex";
import mkPointer, {findSymbol, Value} from "./value";
import {deepFlat, importItem, quickActions} from "./util";
import {mkFn} from "./fn";
import {postfixExpression} from "./expr";

export type ValuePointer<T extends (Value | Type | ValuePointer) = Value | Type> = {
    address: number,
    length?: number,
    type: T
}

export type Type = {};

export type Context = {
    scope: Map<string, ValuePointer>,
    types: Map<string, Value>
    parent: Context,
};

export type ASMContent =
    [InstructionType, Tuple<ASMToken<ASMTokenType.Register> | ASMToken<ASMTokenType.Numeral> | ASMToken<ASMTokenType.Address> | ASMToken<ASMTokenType.Label>, 0 | 1 | 2>]
    | [ASMToken<ASMTokenType.Label>];

export type DeepASMContent = ASMContent[] | DeepASMContent[];

export const converters: { [K in ConstructType]: (input: Construct<K>, context: Context) => DeepASMContent } = {
    [ConstructType.ScriptRoot]: function (input, context) {
        return input.body.map(i => converters[ConstructType.Statement](i, context));
    },
    [ConstructType.Import]: function (input, context) {
        return input.body.map(i => converters[ConstructType.ScriptRoot](importItem(i.source.slice(1, -1)), context));
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
            type: ASMTokenType.Address,
            source: `%${findSymbol(context, input.data).address.toString(16)}`
        }]]];
    },
    [ConstructType.Expression]: function (input, context) {
        const expr = postfixExpression(input);

        for (const i of expr)
            if (typeof i === 'number')
                console.log(Operator[i])
            else
                console.log(mkPointer(i, context));
                // console.log(converters[ConstructType.Value](i, context));

        return [];
    },
    [ConstructType.Value]: function (input, context) {
        throw {
            msg: 'BrokenCompilerWarning: Invalid function used.'
        }
    },
}

export default function Convert(script: Construct<ConstructType.ScriptRoot>): ASMContent[] {
    const context: Context = {
        scope: new Map([['m', <ValuePointer>{address: 0xff, length: 0x1, type: Value.Raw}]]),
        types: new Map([['raw', Value.Raw], ['float', Value.Float], ['str', Value.String]]),
        parent: null
    };

    return [...quickActions.mkStack, ...deepFlat(converters[ConstructType.ScriptRoot](script, context)) as ASMContent[]];
}