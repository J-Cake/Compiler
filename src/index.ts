import Lex from "./Lex";
import Parse from "./Parse";
import Convert from "./CodeGen/Generate";
import Assemble from "./Assembler";

export = function Compile(source: string, origin?: string): Buffer {
    const tokens = Lex(source, origin ?? '<unknown>');
    const block = Parse(tokens);
    const asm = Convert(block);
    return Assemble(asm);
}