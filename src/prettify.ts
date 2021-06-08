import {Construct, ConstructType} from "./Parse";
import {Token, TokenType} from "./Lex";
import {receiveMessageOnPort} from "worker_threads";

export default function prettify(obj: Construct<ConstructType>, depth: number = 0): string {
    const indent = new Array(depth).fill('    ').join('');
    if (obj.body.length > 0)
        return `${indent}${obj
            .body.map(i => 'type' in i ?
                `T (${TokenType[i.type]}): ${i.source}` :
                `C (${ConstructType[i.constructType]}): {\n${prettify(i, depth + 1)}\n${indent}}`).join(`,\n${indent}`)}`
    else
        return `${new Array(depth).fill('    ').join('')}[]`;
}

export function reconstructCode(obj: Construct<ConstructType.ScriptRoot>): string {
    const reconstructers: { [K in ConstructType]: (body: Construct<K>) => string } = {
        [ConstructType.ScriptRoot]: body => body.body.map(i => reconstructers[i.constructType](i)).join('\n'),
        [ConstructType.Import]: body => `import ${(body.body as Token<TokenType.String>[]).map(i => `'${i.source.slice(1, -1)}'`).join(', ')}`,
        [ConstructType.Export]: body => `export ${(body.body as Construct<ConstructType.Value>[]).map(i => reconstructers[ConstructType.Value](i as Construct<ConstructType.Value>)).join(', ')}`,
        [ConstructType.Module]: body => `namespace ${(body.body as Token<TokenType.String>[]).map(i => `'${i.source.slice(1, -1)}'`).join(', ')}`,
        [ConstructType.Function]: body => `(${body.data.map(i => i.source).join(', ')}) => ${reconstructers[ConstructType.Expression](body.body[0] as Construct<ConstructType.Expression>)}`,
        [ConstructType.Statement]: body => 'constructType' in body.body[0] ? reconstructers[body.body[0].constructType](body.body[0]) : '',
        [ConstructType.List]: body => "",
        [ConstructType.Dictionary]: body => "",
        [ConstructType.PropertyAccessor]: body => `${reconstructers[ConstructType.Value](body.data)}[${reconstructers[ConstructType.Expression](body.body[0] as Construct<ConstructType.Expression>)}]`,
        [ConstructType.Call]: body => `${reconstructers[ConstructType.Value](body.data)}(${body.body.map(i => reconstructers[ConstructType.Expression](i)).join(', ')})`,
        [ConstructType.Expression]: function (body: Construct<ConstructType.Expression, Token<TokenType.Operator>> | Token) {
            if (!body) return ''
            if ('type' in body) return body.source;
            else if (body.data) return `${reconstructers[ConstructType.Expression](body.body[0] as Construct<ConstructType.Expression>)} ${body.data.source} ${reconstructers[ConstructType.Expression](body.body[1] as Construct<ConstructType.Expression>)}`;
            else return reconstructers[ConstructType.Expression](body.body[0] as Construct<ConstructType.Expression>);
        },
        [ConstructType.Value]: body => 'type' in body.body[0] ? (body.body as Token[]).map(i => i.source).join('') : reconstructers[body.body[0].constructType](body.body[0]),
    }

    return reconstructers[ConstructType.ScriptRoot](obj);
}