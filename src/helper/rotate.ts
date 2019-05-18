import {clone} from "lodash";

export function rotate<T>(array: readonly T[], shiftAmount: number): readonly T[] {
    if (array.length == 0) {
        return array;
    }
    if (shiftAmount == 0) {
        return array;
    }
    if (shiftAmount < 0) {
        throw Error('no negative number allowed');
    }
    let myClone = clone(array) as T[];
    shiftAmount = Math.abs(shiftAmount) % myClone.length;
    while (shiftAmount > 0) {
        myClone.push(myClone.shift()!);
        shiftAmount = shiftAmount - 1;
    }
    return myClone;
}