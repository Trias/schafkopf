export function shiftRightWithBase(n: number, shiftAmount: number, base: number) {
    if (base <= 1) {
        throw Error('base must be higher than 1');
    }
    if (shiftAmount < 0) {
        throw Error('shift amount must be positive');
    }
    if (n < 0) {
        throw Error('number must be positive');
    }
    if (n == 0 || shiftAmount == 0) {
        return n;
    }
    if (n < base ** shiftAmount) {
        return 0;
    }

    let x = n - n % base ** shiftAmount;

    return x / base ** shiftAmount;
}