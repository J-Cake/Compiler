import {Construct, ConstructType} from "../Parse";
import {Fn} from "../buildConstruct";
import {ASMContent, Context, converters, ValuePointer} from "./Generate";
import {TokenType as ASMTokenType} from "jcpu/asm/data";
import {resolveType} from "./util";
import {Value} from "./value";

let fns = 0;

export function mkFn(fn: Construct<ConstructType.Function, Fn>, context: Context): ValuePointer<Value.Function> & { name?: string } {
    const newContext: Context = {
        parent: context,
        scope: new Map(),
        types: new Map()
    };

    for (const i in fn.data[1])
        newContext.scope.set(i, {
            address: 0,
            type: resolveType(context, fn.data[1][i][0])
        });

    const instructions: ASMContent[] = [
        [{type: ASMTokenType.Label, source: `::fn-${fns++}`}], // TODO: If function has a name, use that instead.
        ...fn.body.map(i => converters[i.constructType](i, newContext))
    ];

    // To find the return address, the top value is popped off the stack,
    // a pointer to the return value is pushed on, and then jumped

    return {
        address: 0,
        length: 0,
        type: undefined
    }
}