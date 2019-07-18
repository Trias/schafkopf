let memoized = new WeakMap();

export function memoize(target: any, name: string, descriptor: any) {
    let getter = descriptor.get, setter = descriptor.set;

    descriptor.get = function () {
        let table = memoizationFor(this);
        if (name in table) {
            return table[name];
        }
        return table[name] = getter.call(this);
    };

    descriptor.set = function (val: any) {
        let table = memoizationFor(this);
        setter.call(this, val);
        table[name] = val;
    }
}

function memoizationFor(obj: any) {
    let table = memoized.get(obj);
    if (!table) {
        table = Object.create(null);
        memoized.set(obj, table);
    }

    return table;
}