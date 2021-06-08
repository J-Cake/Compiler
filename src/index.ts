import Lex from "./Lex";
import Parse from "./Parse";
import Convert from "./Converter";

const simpleSource = `
import 'io'

io.println_out('hi')
`;
const middleSource = `
data[getDataType(a)](a + 1)
`;

// # hyp(a, b) => (a ^ 2 + b ^ 2) ^ (1/2)
// # if hyp(3, 4) == 5 io.println_out(capitalise('hello world')) // Gonna rework control-flows
const difficultSource = `
import 'calc', 'str', 'io'

hyp(a, b) => calc.sqrt(a ** 2 + b ** 2)
capitalise(string) => split(string, ' ').map(i => str.join([i[0].upper, i.range(1).lower]), '')

io.println_out(capitalise('hello world'))
io.println_out(hyp(3, 4))
`

export default function main(argv: string[]): number {
    // const tokens = Lex(`capitalise(string) => split(string, ' ').map(i => str.join([i[0].upper, i.range(1).lower]), '')`, '<anonymous>');
    const tokens = Lex(`hyp(x, y) => calc.sqrt(x ** 2 + y ** 2)`, '<anonymous>');
    const block = Parse(tokens);
    const asm = Convert(block);

    return 0;
}
