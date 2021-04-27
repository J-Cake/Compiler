import util from 'util';

import _constructs from '../buildConstruct';
import {ConstructType} from "../Parse";
import Lex from "../Lex";

const constructs = _constructs();

{
    const tokens = Lex(`import 'io'`);
    // console.log("Statement", util.inspect(constructs[ConstructType.Statement](tokens), false, null, true));
}

{
    const tokens = Lex(`io.println_out('hi')`);
    // console.log("Call", util.inspect(constructs[ConstructType.Call](tokens), false, null, true));
    console.log("Call", util.inspect(constructs[ConstructType.Call](Lex(`data[getDataType(a)](a + 1)`)), false, null, true));
}
