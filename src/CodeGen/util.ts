import {Construct, ConstructType} from "../Parse";
import {ASMContent, Context, Type} from "./Generate";
import {Token, TokenType} from "../Lex";
import {InstructionType, TokenType as ASMTokenType} from 'jcpu/asm/data';
import {getSnippet} from "../util";
import {Value} from "./value";

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

export function importItem(specifier: Construct<ConstructType.Import>): Construct<ConstructType.ScriptRoot> {
    // throw {
    //     msg: `ImportError - Cannot find module ${specifier}`,
    //     searchPaths: []
    // }
    return {
        body: [],
        constructType: ConstructType.ScriptRoot
    };
}

export function resolveType(context: Context, reference: Token<TokenType.TypeReference>): Type | Value {
    if (context.types.has(reference.source.slice(1)))
        return context.types.get(reference.source.slice(1))
    else if (context.parent)
        return resolveType(context.parent, reference);
    else
        throw {
            msg: `ReferenceError: Reference to unknown type \`${reference.source.slice(1)}\`.`,
            origin: reference,
            getSnippet: () => getSnippet(reference)
        };
}

export const quickActions: { [action: string]: ASMContent[] } = {
    mkStack: [],
    pushStack: [
        [InstructionType.Load, [{source: '%0', type: ASMTokenType.Address}, {
            source: '$addr',
            type: ASMTokenType.Register
        }]],
        [InstructionType.Sum, [{source: '$addr', type: ASMTokenType.Register}, {
            source: '1',
            type: ASMTokenType.Numeral
        }]]
    ]
};
