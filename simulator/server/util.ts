export function cloneObj<T>(obj: T): T {
    if (typeof obj === "object" || Array.isArray(obj)) {
        return JSON.parse(JSON.stringify(obj));
    }
    return obj;
}

export function isObject(x: unknown): x is Record<string, unknown> {
    return (
        x != null &&
        (typeof x === "object" || typeof x === "function") &&
        !Array.isArray(x)
    );
}

