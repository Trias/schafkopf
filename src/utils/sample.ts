import {baseRandom} from "./baseRandom";

/**
 * A specialized version of `_.sample` for arrays.
 *
 * @private
 * @param {Array} array The array to sample.
 * @returns {*} Returns the random element.
 */
export function sample<T>(array: T[]): T | undefined {
    let length = array.length;
    return length ? array[baseRandom(0, length - 1)] : undefined;
}


