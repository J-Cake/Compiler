import {inspect} from 'util';

import Lex from '../Lex';
import Parse from '../Parse';

const print = x => void console.log(inspect(x, false, null, true));

print(Parse(Lex(`x(1 + 2)`)))