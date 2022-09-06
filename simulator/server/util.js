function cloneObj(obj) {
    if (typeof obj === 'object')
        return JSON.parse(JSON.stringify(obj));
    if (Array.isArray(obj)) {
        return JSON.parse(JSON.stringify(obj));
    }
    return obj;
}

function isObject(x) {
    return x != null && (typeof x === 'object' || typeof x === 'function') && !Array.isArray(x);
}



module.exports = { cloneObj, isObject };