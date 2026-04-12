export function updateBrowserTitle(title: string): void {
    document.title = title;

    const oldFavicon = document.querySelector("link[rel=icon]");
    const link = document.createElement("link") as HTMLLinkElement;
    link.id = "favicon";
    link.type = "image/x-icon";
    link.rel = "icon";
    link.href = "/play-favicon.ico";
    if (oldFavicon) {
        document.head.removeChild(oldFavicon);
    }
    document.head.appendChild(link);
}

export function revertBrowserTitle(): void {
    document.title = "ACOS Online";

    const oldFavicon = document.querySelector("link[rel=icon]");
    const link = document.createElement("link") as HTMLLinkElement;
    link.id = "favicon";
    link.type = "image/x-icon";
    link.rel = "icon";
    link.href = "/favicon.ico";
    if (oldFavicon) {
        document.head.removeChild(oldFavicon);
    }
    document.head.appendChild(link);
}
