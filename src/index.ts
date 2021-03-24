import Lex, {TokenType} from "./Lex";
import Parse from "./Parse";
import Format from "./Format";

const source = `
import 'str', 'io'

hyp(a, b) (b ** 2 + b ** 2) ** 0.5
capitalise(str) split(str, ' ').map(word(i) str.join([i[0].upper, i.range(1).lower]), '')

io.print_out(capitalise('hello world'))
`;

export default function main(argv: string[]): number {
    const tokens = Lex(source, '<anonymous>');
    const lines = Format(tokens);
    const statements = Parse(lines);

    return 0;
}
