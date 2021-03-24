export type cb<K> = (i: K, data: K[]) => keyof StateMachine<K>;

export type StateMachine<K> = {
    [stateName: string]: [cb<K>, boolean]
}

export function didThrowErr(fn: Function): boolean {
    try {
        fn();
        return false;
    } catch (err) {
        return true;
    }
}

export function mkStateMachine<T extends StateMachine<K>, K>(fsm: T, defaultState: keyof T, data: K[]): [boolean, keyof T] {
    const data_copy: K[] = Array.from(data);
    const currentState: (keyof T)[] = [defaultState];

    if (didThrowErr(function () {
        while (data.length > 0)
            if (currentState[0] in fsm) currentState.unshift(fsm[currentState[0]][0](data_copy.shift(), data_copy));
            else return [Boolean(fsm[currentState[1]][1]), currentState[1]];
    }))
        console.log(currentState, fsm[currentState[0]]);
        // return [fsm[currentState[0]][1], currentState[0]];

    return [fsm[currentState[0]]?.[1], currentState[0]];
}
