import 'source-map-support/register';
import {mkStateMachine, StateMachine} from "../StateMachine";

const fsm: StateMachine<string> = {
    'A': [i => ({
        'A': 'B',
        'B': 'C',
        'C': 'A'
    })[i], false],
    'B': [i => ({
        'A': 'A',
        'B': 'C',
        'C': 'B'
    })[i], true],
    'C': [i => ({
        'A': 'B',
        'B': 'A',
        'C': 'C'
    })[i], false]
}
console.log(mkStateMachine(fsm, 'A', ['B', 'A', 'A', 'A']));
