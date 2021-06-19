
class Delta {
    delta(from, to, result) {

        if (Array.isArray(from)) {
            return this.arrDelta(from, to, []);
        }

        if (this.isObject(from)) {
            return this.objDelta(from, to, {});
        }

        if (from != to) {
            result = to;
        }

        return result;
    }

    isObject(x) {
        return x != null && (typeof x === 'object' || typeof x === 'function') && !Array.isArray(x);
    }
    objDelta(from, to, result) {
        result = result || {};

        for (var key in to) {

            if (!(key in from)) {
                result[key] = to[key];
                continue;
            }

            let child = this.delta(from[key], to[key]);
            if (typeof child !== 'undefined' &&
                ((typeof child === 'string') ||
                    (typeof child === 'number') ||
                    (typeof child === 'boolean') ||
                    Object.keys(child).length > 0))
                result[key] = child;
            // else
            //     result[key] = to[key];
        }
        return result;
    }

    arrDelta(from, to, result) {
        result = result || [];

        if (from.length != to.length) {
            return to;
        }

        for (var i = 0; i < to.length; i++) {

            let child = this.delta(from[i], to[i]);
            if (typeof child !== 'undefined' &&
                (typeof child === 'string' ||
                    typeof child === 'number' ||
                    typeof child == 'boolean' ||
                    Object.keys(child).length > 0))
                return to;
        }
        return result;
    }
}

module.exports = new Delta();