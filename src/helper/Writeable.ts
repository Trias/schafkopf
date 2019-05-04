type Writable<T> = {
    -readonly [K in keyof T]: T[K]
}

export default Writable;