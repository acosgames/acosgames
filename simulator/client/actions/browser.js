export function updateBrowserTitle(title) {
    document.title = title;

    let oldFavicon = document.querySelector('link[rel=icon]');
    var link = document.createElement('link')
    link.id = 'favicon';
    link.type = 'image/x-icon'
    link.rel = 'icon';
    link.href = '/play-favicon.ico';
    if (oldFavicon) {
        document.head.removeChild(oldFavicon);
    }
    document.head.appendChild(link);

}

export function revertBrowserTitle() {
    document.title = "ACOS Online";

    let oldFavicon = document.querySelector('link[rel=icon]');
    var link = document.createElement('link')
    link.id = 'favicon';
    link.type = 'image/x-icon'
    link.rel = 'icon';
    link.href = '/favicon.ico';
    if (oldFavicon) {
        document.head.removeChild(oldFavicon);
    }
    document.head.appendChild(link);
}