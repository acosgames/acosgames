
const IFrameSrc = `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <title>Acos-Client Simulator</title>
        <meta name="description" content="ACOS Client Simulator" />
        <meta name="author" content="A Cup of Skill" />
        <meta
            http-equiv="Content-Security-Policy"
            content="default-src https://fonts.gstatic.com https://fonts.googleapis.com https://cdn.acos.games 'unsafe-inline' 'self' data:"
        />
    </head>
    <body>
        <div id="root"></div>
        <script>
            let acosTimeouts = {}
            let acosIntervals = {}
            let acosTimeCount = 0;
            let paused = false;
            let acosAnimationFuncs = [];
            let acosAnimationCount = 0;
            let acosAnimationElems = [];

            window.setTimeout = window.setTimeout;
            window.setInterval = window.setInterval;
            window.clearTimeout = window.clearTimeout;
            window.clearInterval = window.clearInterval;
            window.requestAnimationFrame = window.requestAnimationFrame;

            const oldTimeout = window.setTimeout 
            const oldInterval = window.setInterval
            const oldClearTimeout = window.clearTimeout
            const oldClearInterval = window.clearInterval
            const oldRequestAnimationFrame = window.requestAnimationFrame;

            window.setTimeout = (func, milliseconds) => {
                if( paused )
                    return;
                let pausable = pauseable_timeout(func, milliseconds)
                let id =pausable.getId()
                acosTimeouts['t/'+id] = pausable
            }

            window.setInterval = (func, milliseconds) => {
                if( paused )
                    return;
                let pausable = pauseable_timeout(func, milliseconds)
                let id =pausable.getId()
                acosIntervals['t/'+id] = pausable
            }

            window.clearTimeout = (timeoutId) => {
                if( acosTimeouts['t/'+timeoutId] ) 
                    delete acosTimeouts['t/'+timeoutId]
                oldClearTimeout(timeoutId)
            }

            window.clearInterval = (timeoutId) => {
                if( acosIntervals['t/'+timeoutId] ) 
                    delete acosIntervals['t/'+timeoutId]
                oldClearInterval(timeoutId)
            }

            window.requestAnimationFrame = (func) => {
                
                if(!paused) {
                    oldRequestAnimationFrame(func);
                } else {
                    acosAnimationFuncs.push(func);
                }
            }


            

            const acosURLPrefix = 'cdn.acos.games/file/acospub/g/'
            const onMessage = (evt) => {
                let m = evt.data
                let origin = evt.origin
                let source = evt.source
                if (!m || m.length == 0)
                    return
                if( m.type == 'load' ) { 
                    //de()
                    let url = 'https://'+acosURLPrefix+m.payload.game_slug+'/client/client.bundle.'+m.payload.version+'.js'
                    console.log(">>> Loading Client Bundle: ", url)
                    loadJS(url)
                }
                else if( m.type == 'pause' ) {
                    paused = true;
                    console.log("Attempting to pause timeouts and intervals ", Object.keys(acosTimeouts).length, Object.keys(acosIntervals).length);
                    for(let key in acosTimeouts) {
                        let pauseable = acosTimeouts[key];
                        pauseable.pause()
                    }

                    for(let key in acosIntervals) {
                        let pauseable = acosIntervals[key];
                        pauseable.pause()
                    }


                    const allElements = document.getElementsByTagName('*');
                    for (const element of allElements) {
                        if( element.animationPlayState != 'running' ) {
                            continue;
                        }
                        
                        acosAnimationElems.push(element);
                        element.animationPlayState = 'paused'
                    }

                }
                else if( m.type == 'unpause' ) {
                    paused = false;
                    console.log("Attempting to unpause timeouts and intervals ", Object.keys(acosTimeouts).length, Object.keys(acosIntervals).length);
                    
                    for(let key in acosTimeouts) {
                        let pauseable = acosTimeouts[key];
                        pauseable.unpause()
                    }

                    for(let pauseable of acosIntervals) {
                        let pauseable = acosIntervals[key];
                        pauseable.unpause()
                    }

                    for(let func of acosAnimationFuncs) {
                        func();
                    }

                    acosAnimationFuncs = [];

                    for(const element of acosAnimationElems) {
                        element.animationPlayState = 'running'
                    }
                }
                
            }
            function de() {
                window.removeEventListener('message', onMessage, false)
            }
            function at() {
                window.addEventListener('message', onMessage, false)
            }
            function loadJS(url) {
                loadScript(url, function(path, status) {
                    if( status == 'ok')
                        setTimeout(()=>{
                            window.parent.postMessage({ type:'loaded' }, '*')
                        },1)
                });
            }
            at()
            let mainScript = null;
            function loadScript(path, callback) {
                var done = false

                if( mainScript) { 
                    // mainScript.parentNode.removeChild(mainScript);

                    // let rootElem = document.getElementById("root");
                    // let body = rootElem.parentNode;
                    // body.removeChild(rootElem);

                    // let newRootElem = document.createElement("div");
                    // newRootElem.id = "root";


                    // body.prepend(newRootElem)
                    //location.reload();
                    // window.top.location.reload();
                }

                mainScript = document.createElement('script')
                mainScript.onload = handleLoad
                mainScript.onreadystatechange = handleReadyStateChange
                mainScript.onerror = handleError
                mainScript.src = path
                document.body.appendChild(mainScript)
                function handleLoad() {
                    if (!done) {
                        done = true
                        callback(path, "ok")
                    }
                }
                function handleReadyStateChange() {
                    var state;
                    if (!done) {
                        state = mainScript.readyState
                        if (state === "complete") {
                            handleLoad()
                        }
                    }
                }
                function handleError() {
                    if (!done) {
                        done = true
                        callback(path, "error")
                    }
                }
            }


            function pauseable_timeout(func, milliseconds) {
                let date_ms = new Date().valueOf()
                
                let time_left = milliseconds
                let id = acosTimeCount++
                let timeout = 0;

                const newTimeout = ()=>{ 
                    if( acosTimeouts['t/'+id] )
                        delete acosTimeouts['t/'+id]
                    func()
                }

                timeout = oldTimeout(newTimeout, milliseconds)

                return {
                    getId: () => {
                        return timeout
                    },
                    pause: () => {
                        clearTimeout(timeout)
                        timeout = 0
                        const elapsed_time = new Date().valueOf() - date_ms
                        time_left -= elapsed_time
                    },
                    unpause: () => {
                        timeout = oldTimeout(newTimeout, time_left)
                        date_ms = new Date().valueOf()
                    }
                }
            }
              

            function pauseable_interval(callback, delay) {
                let callbackStartTime = Date.now()
                let remaining = 0
                let timerId = null
                let paused = false
                let id = acosTimeCount++

                const clear = () => {
                    window.clearInterval(timerId)
                }

                const newSetTimeout = () => {
                    clear()
                    timerId = oldInterval(() => {
                        
                        callbackStartTime = Date.now()
                        callback()
                    }, delay)
                }

                newSetTimeout()
                
                return {
                    getId: () => {
                        return timerId;
                    },
                    pause : () => {
                        clear()
                        remaining -= Date.now() - callbackStartTime
                        paused = true
                    },
                    resume : () => {
                        window.setTimeout(newSetTimeout, remaining)
                        paused = false
                    }
                }
            }

           
        </script>
    </body>
</html>`;

export default IFrameSrc;