export function fromEntries<T>(entries: [string, T][]): { [index in string]: T } {
    let object: { [index in string]: T } = {};

    for (let entry of entries) {
        object[entry[0]] = entry[1];
    }

    return object;
}