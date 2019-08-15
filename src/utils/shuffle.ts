import {clone} from "lodash";
import {baseRandom} from "./baseRandom";

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