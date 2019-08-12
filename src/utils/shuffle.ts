import {clone} from "lodash";

// stolen from lodash... a fisher yates shuffle... (here because its annoying that lodash captures Math.random)
export function shuffle<T>(array: T[]): T[] {
    let clonedArray = clone(array);
    let index = -1;
    let lastIndex = clonedArray.length - 1;

    while (++index < clonedArray.length) {
        let rand = baseRandom(index, lastIndex);
        let value = clonedArray[rand];

        clonedArray[rand] = clonedArray[index];
        clonedArray[index] = value;
    }
    return clonedArray;
}

function baseRandom(lower: number, upper: number) {
    return lower + Math.floor(Math.random() * (upper - lower + 1));
}