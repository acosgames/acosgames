export async function send(type, payload) {
    window.parent.postMessage({ type, payload }, "*");
}

export async function listen(callback) {
    window.addEventListener("message", onMessage(callback), false);
}

const onMessage = (callback) => (evt) => {
    // console.log("MESSAGE EVENT CALLED #1");
    let message = evt.data;
    let origin = evt.origin;
    let source = evt.source;
    if (!message || message.length == 0) return;

    if (callback) {
        callback(message);
    }
};

useEffect(() => {
    console.log("ATTACHING TO MESSAGE EVENT");
    window.addEventListener("message", onMessage, false);
    console.log("CREATING TIMER LOOP");
    timerLoop();

    send("ready", true);
}, []);
