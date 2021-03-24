import sm from 'source-map-support';
import {mkStateMachine} from "../build/out/StateMachine.js";

sm.install();

// {
//     const fsm = {
//         'If': [i => i === 'if' ? 'Condition' : null, false],
//         'Condition': [i => i === 'expr' ? 'block' : null, false],
//         'Block': [(i, [next]) => i === 'block' ? (next === 'else' ? 'Else' : 'ElseIf') : null, false],
//         'ElseIf': [i => i === 'elseif' ? 'Condition' : null, true],
//         'Else': [i => i === 'else' ? '_ElseBlock' : null, true],
//         '_ElseBlock': [i => i === 'block' ? 'Done' : null, false],
//         'Done': [i => null, true]
//     }
//     const testValid = mkStateMachine(fsm, 'If', ['if', 'expr', 'block', 'elseif', 'expr', 'block', 'else', 'block']);
//     console.log(testValid);
// }

{
    const fsm = {
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
    // const machine = mkStateMachine(fsm, 'A', ['A']);
    console.log(mkStateMachine(fsm, 'A', ['B', 'A', 'A', 'A']));
}

