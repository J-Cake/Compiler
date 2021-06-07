import util from "util";

import _constructs from '../buildConstruct';
import {ConstructType} from "../Parse";
import Lex from "../Lex";

const constructs = _constructs();
const print = (...x) => console.log.apply(null, x.map(i => util.inspect(i, false, null, true)));

if (false) {
    try {
        print("Import", ConstructType.Import, constructs[ConstructType.Import](Lex(`import 'io'`)))
    } catch (err) {
        console.error("Failed Import")
    }

    try {
        print("List", ConstructType.List, constructs[ConstructType.List](Lex(`[1, 2, 3]`)))
    } catch (err) {
        console.error("Failed List");
    }

    try {
        print("Dictionary", ConstructType.Dictionary, constructs[ConstructType.Dictionary](Lex(`{a: 1, b: 2, c: 3}`)));
    } catch (err) {
        console.error("Failed Dictionary")
    }

    try {
        print("Call 1", ConstructType.Call, constructs[ConstructType.Call](Lex(`a(1, 2)`)));
        print("Call 2", ConstructType.Call, constructs[ConstructType.Call](Lex(`io.println_out('hi')`)));
    } catch (err) {
        console.error("Failed Call")
    }

    try {
        print("Property", ConstructType.PropertyAccessor, constructs[ConstructType.PropertyAccessor](Lex(`a[1]`)));
    } catch (err) {
        console.error("Failed Property")
    }

    try {
        print("Expression", ConstructType.Expression, constructs[ConstructType.Expression](Lex(`1 + 2`)));
        print("Expression", ConstructType.Expression, constructs[ConstructType.Expression](Lex(`io.println('hi')`)));
    } catch (err) {
        console.error("Failed Expression")
    }

    try {
        print("Value", ConstructType.Value, constructs[ConstructType.Value](Lex(`3`)));
    } catch (err) {
        console.error("Failed Value")
    }
}

print("Expr", ConstructType.Expression, constructs[ConstructType.Expression](Lex(`(b ^ 2 + b ^ 2) ^ (1/2)`)));
print("Expr", ConstructType.Expression, constructs[ConstructType.Expression](Lex(`6 * a + 5`)));