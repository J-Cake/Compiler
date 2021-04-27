import Lex from "./Lex";
import Parse from "./Parse";
import * as util from "util";

const source = `
import 'str', 'io'

hyp(a, b) (b ** 2 + b ** 2) ** 0.5
capitalise(string) split(string, ' ').map(word(i) str.join([i[0].upper, i.range(1).lower]), '')

io.println_out(capitalise('hello world'))
`;

const simpleSource = `
import 'io'

io.println_out('hi')
`;
const middleSource = `
# Here the type is assumed to be
# Type: *enum* 
# data: {[Type]: n => number}

data[getDataType(a)](a + 1)

# Call
# [PropertyAccessor, Expression]
# [Identifier, [Call, Expression]]
`
const difficultSource = `
import 'str', 'io'

hyp(a, b) 
    (b ** 2 + b ** 2) ** 0.5

capitalise(string) 
    split(string, ' ').map(word(i) str.join([i[0].upper, i.range(1).lower]), '')

if hyp(3, 4) == 5
    io.println_out(capitalise('hello world'))
`

export default function main(argv: string[]): number {
    const tokens = Lex(simpleSource, '<anonymous>');
    const block = Parse(tokens);

    console.log(util.inspect(block, false, null, true));

    return 0;
}
