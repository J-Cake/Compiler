import * as util from "util";
import {Construct, ConstructType} from "./Format";

export default function Parse(block: Construct<ConstructType.Block>) {
    console.log("Lines", util.inspect(block, false, null, true));
}
