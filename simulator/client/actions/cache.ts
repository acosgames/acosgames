export function removeWithExpiry(key: string): void {
    localStorage.removeItem(key);
}

export function setWithExpiry(key: string, value: unknown, ttl: number): void {
    const now = new Date();
    const item = {
        value,
        expiry: now.getTime() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
}

export function getWithExpiry<T = unknown>(key: string): T | null {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr) as { value: T; expiry: number };
    const now = new Date();
    if (now.getTime() > item.expiry) {
        localStorage.removeItem(key);
        return null;
    }
    return item.value;
}
