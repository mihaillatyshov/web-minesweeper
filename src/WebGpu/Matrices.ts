export const Float32ArrayConcat = (a: Float32Array, b: Float32Array): Float32Array => {
    const result = new Float32Array(a.length + b.length);
    result.set(a);
    result.set(b, a.length);
    return result;
};

export const createOrthographicMatrix = (
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number
): Float32Array => {
    // prettier-ignore
    return new Float32Array([
        2 / (right - left)             , 0                              , 0                  , 0,
        0                              , 2 / (top - bottom)             , 0                  , 0,
        0                              , 0                              , 1 / (far - near)   , 0,
        (left + right) / (left - right), (top + bottom) / (bottom - top), near / (near - far), 1,
    ]);
};

export const createTranslationMatrix = (x: number, y: number, z: number): Float32Array => {
    // prettier-ignore
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        x, y, z, 1,
    ]);
};
