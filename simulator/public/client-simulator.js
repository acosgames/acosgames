// const { jsonview } = require("./jsonViewer");


var socket = null;
var lastMessage = null;
let note = document.getElementById('note');
let maincontent = document.getElementById('maincontent');
let placeholder = document.getElementById('placeholder');
let iframe = document.getElementById('game-sandbox');

let nameField = document.getElementById('username');
let checkboxScaled = document.getElementById('scaled');
let inputResolution = document.getElementById('resolution');
let inputWidth = document.getElementById('maxwidth');
let inputHeight = document.getElementById('maxheight');
let selectScreenType = document.getElementById('screenType');
let screenType = 1;

let viewportSize = document.getElementById('viewportSize');
let viewportResolution = document.getElementById('viewportResolution');

nameField.value = getUsername();
nameField.onkeyup = (event) => {
    let username = event.target.value;
    updateUser(username);
};

var resoWidth = 16;
var resoHeight = 9;
var resoScale = resoWidth > resoHeight ? (resoWidth / resoHeight) : (resoHeight / resoWidth);
var resMaxWidth = 1920;
var resMaxHeight = 1080;

iframe.style.display = 'none';
var scaled = false;
// var CONTENT_WIDTH = 1920;
// var CONTENT_HEIGHT = 1080;
var timestamp = 0;
var THROTTLE = 0;

function openFullscreen(elem) {
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
    // maincontent.style.width = '100%';
    onResize();
}

function transformStr(obj) {
    var obj = obj || {},
        val = '',
        j;
    for (j in obj) {
        val += j + '(' + obj[j] + ') ';
    }

    return '-webkit-transform: ' + val + '; ' +
        '-moz-transform: ' + val + '; ' +
        'transform: ' + val;
}

function checkFullScreen() {
    if (document.fullscreenElement || document.webkitFullscreenElement ||
        document.mozFullScreenElement)
        return true;
    else
        return false;
}

function isObject(x) {
    return x != null && (typeof x === 'object' || typeof x === 'function') && !Array.isArray(x);
}

function onResize() {
    var now = +new Date,
        winWidth = window.innerWidth,
        scale,
        width,
        height,
        offsetTop,
        offsetLeft;

    if (now - timestamp < THROTTLE) {
        return onResize;
    }

    timestamp = now;

    let isFullscreen = checkFullScreen();
    let windowHeight = isFullscreen ? window.screen.height : document.documentElement.clientHeight;
    let windowWidth = isFullscreen ? window.screen.width : document.documentElement.clientWidth;
    var bgWidth = parseInt(getComputedStyle(maincontent).width, 10);
    var bgHeight = parseInt(getComputedStyle(maincontent).height, 10);
    var iframeWidth = parseInt(getComputedStyle(iframe).width, 10);
    let ratio = 1;

    let wratio = (windowWidth / bgWidth);
    let hratio = (windowHeight / bgHeight);

    let wsteps = (windowWidth / resoWidth);
    let hsteps = (windowHeight / resoHeight);
    let steps = 0;

    if (wsteps < hsteps) {
        steps = wsteps
    }
    else {
        steps = hsteps
    }

    bgWidth = (steps * resoWidth);
    bgHeight = (steps * resoHeight);




    if (screenType == '3') {
        maincontent.style.width = bgWidth + 'px';
        maincontent.style.height = bgHeight + 'px';
        scale = ((bgWidth / resMaxWidth));

        iframe.setAttribute('style', transformStr({
            scale: scale,
            translateZ: '0'
        }) + `; transform-origin: left top; width:${resMaxWidth}px; height:${resMaxHeight}px;`);
    }
    else if (screenType == '2') {
        maincontent.style.width = bgWidth + 'px';
        maincontent.style.height = bgHeight + 'px';
        iframe.setAttribute('style', 'width:100%; height:100%;')
    }
    else if (screenType == '1') {
        maincontent.style.width = windowWidth + 'px';
        maincontent.style.height = windowHeight + 'px';
        iframe.setAttribute('style', 'width:100%; height:100%;')
    }
}

function updateFrameSize(newWidth, newHeight) {

    resoWidth = newWidth || resoWidth;
    resoHeight = newHeight || resoHeight;

    let steps = resMaxWidth / resoWidth;
    resMaxHeight = resoHeight * steps;
    inputHeight.value = resMaxHeight;

    resoScale = resoWidth > resoHeight ? (resoWidth / resoHeight) : (resoHeight / resoWidth);

    if (screenType == '1') {
        viewportSize.style.display = 'none';
        viewportResolution.style.display = 'none';
    }
    else if (screenType == '2') {
        viewportSize.style.display = 'none';
        viewportResolution.style.display = 'block';
    }
    else {
        viewportSize.style.display = 'block';
        viewportResolution.style.display = 'block';
    }

    onResize();
}

window.addEventListener('resize', onResize, false);

function updateUser(username) {
    if (!username || username.length == 0) return;
    window.sessionStorage.setItem('name', username);
    // window.sessionStorage.setItem(username, stringHashCode(username));
}

function getUsername() {
    return window.sessionStorage.getItem('name') || '';
}


selectScreenType.onchange = (event) => {
    console.log(event.target.value);

    screenType = event.target.value;
    updateFrameSize();
    localStorage.setItem('screenType', screenType);
}



inputResolution.oninput = (event) => {
    let val = event.target.value;
    let parts = val.split(':');
    if (!parts || parts.length != 2) {
        return;
    }

    resoWidth = 1 * parts[0];
    resoHeight = 1 * parts[1];
    if (!Number.isInteger(resoWidth) || !Number.isInteger(resoHeight))
        return;

    if (resoWidth <= 0 || resoHeight <= 0)
        return;

    localStorage.setItem('resoWidth', resoWidth);
    localStorage.setItem('resoHeight', resoHeight);

    updateFrameSize(resoWidth, resoHeight);
}

inputWidth.onchange = (event) => {
    let val = event.target.value;

    val = 1 * val;
    if (!Number.isInteger(val))
        return;


    if (val <= 0)
        return;

    resMaxWidth = val;

    let steps = resMaxWidth / resoWidth;
    resMaxHeight = resoHeight * steps;

    localStorage.setItem('resMaxWidth', resMaxWidth);
    localStorage.setItem('resMaxHeight', resMaxHeight);

    updateFrameSize(resoWidth, resoHeight);
}



screenType = localStorage.getItem('screenType') || "1";
resoWidth = localStorage.getItem('resoWidth') || 16;
resoHeight = localStorage.getItem('resoHeight') || 9;
resMaxWidth = localStorage.getItem('resMaxWidth') || 1920;
resMaxHeight = localStorage.getItem('resMaxHeight') || 1080;
inputResolution.value = resoWidth + ':' + resoHeight;
inputWidth.value = resMaxWidth;
inputHeight.value = resMaxHeight;
selectScreenType.value = screenType;
updateFrameSize();

// document.getElementById('maximize').onclick = (event) => {
//     openFullscreen(placeholder);
// }

document.getElementById('leavegame').onclick = (event) => {
    // speechSynthesis.cancel();
    if (socket) {
        socket.emit('action', encode({ type: 'leave', payload: {} }));
    }
    iframe.style.display = 'none';
    note.textContent = 'Status: offline';
};

document.getElementById('startgame').onclick = (event) => {

    if (socket) {
        socket.emit('action', encode({ type: 'gamestart', payload: null }));
    }
};


document.getElementById('joingame').onclick = (event) => {
    let displayname = getUsername();
    if (displayname.trim().length == 0) {
        alert('Please enter a username.');
        return;
    }

    iframe.src = null;

    iframe.src = '/iframe';

    document.getElementById('joingame').innerText = 'Joining';
    document.getElementById('joingame').disabled = true;

    iframe.onload = function () {
        console.log('game-sandbox is loaded');
        setTimeout(() => {
            connect(displayname, () => {
                if (socket) socket.emit('action', encode({ type: 'join', payload: {} }));
            });
        }, 200);
    };



};

// document.getElementById('reload').onclick = (event) => {
//     if (socket) socket.emit('reload', 'now!');
// };








//--------------------------------------------------
//WebSockets Connection / Management 
//--------------------------------------------------
function connect(username, onjoin) {
    note.textContent = 'Status: connecting...';

    if (socket && !socket.disconnected) {
        socket.disconnect();
    }

    let host = window.location.host;
    console.log(host);
    socket = io('ws://' + host, {
        transports: ['websocket'],
        upgrade: true,
        query: 'username=' + username,
    });

    socket.on('connect', (evt) => {
        if (onjoin) onjoin(evt);
        window.sessionStorage.setItem('connected', true);

        note.textContent = 'Status: connected';
        iframe.style.display = 'block';
    });

    var latency = 0;
    var latencyStart = 0;
    var offsetTime = 0;
    socket.on('connected', (message) => {
        //message should have { id, name }
        message = decode(message);
        socket.user = message;
        updateLatency();
    });

    function updateLatency() {
        latencyStart = new Date().getTime();
        socket.emit('time', encode({ payload: latencyStart }));
    }

    function showStateView(data, elem) {
        let copy = JSON.parse(JSON.stringify(data));
        if (isObject(copy)) {
            let keys = Object.keys(copy);
            for (var i = 0; i < keys.length; i++) {
                let key = keys[i];
                if (!isObject(copy[key]))
                    continue;

                let childKeys = Object.keys(copy[key]);
                if (childKeys.length == 0) {
                    delete copy[key];
                }
            }
        }

        if (copy['delta'])
            delete copy['delta'];

        elem.replaceChildren();

        if (copy['state']) {
            createStateTitle(elem, 'State');
            showJSONView(copy['state'], elem, false);
        }
        if (copy['events']) {
            createStateTitle(elem, 'events');
            showJSONView(copy['events'], elem, false);
        }
        if (copy['players']) {
            createStateTitle(elem, 'players');
            showJSONView(copy['players'], elem, false);
        }
        if (copy['timer']) {
            createStateTitle(elem, 'timer');
            showJSONView(copy['timer'], elem, false);
        }
        if (copy['next']) {
            createStateTitle(elem, 'next');
            showJSONView(copy['next'], elem, false);
        }
        if (copy['rules']) {
            createStateTitle(elem, 'rules');
            showJSONView(copy['rules'], elem, false);
        }

    }

    function createStateTitle(elem, title) {
        let child = document.createElement('h5');
        child.innerText = title;
        child.classList.add('state-title');
        elem.appendChild(child)
    }
    function showJSONView(data, elem, keepChildren) {

        if (keepChildren)
            elem.replaceChildren();

        // create json tree object
        const tree = jsonview.create(data);

        // render tree into dom element
        jsonview.render(tree, elem);

        jsonview.expand(tree);
        // you can render json data without creating tree
        // const tree = jsonview.renderJSON(data, document.querySelector('.tree'));
    }

    socket.on('time', (message) => {
        message = decode(message);
        let serverOffset = message.payload.offset;
        let serverTime = message.payload.serverTime;
        let currentTime = new Date().getTime();
        latency = currentTime - latencyStart;
        offsetTime = currentTime - serverTime;
        let realTime = currentTime + offsetTime + Math.ceil(latency / 2);
        console.log('Latency Start: ', latencyStart);
        console.log('Latency: ', latency);
        console.log('Offset Time: ', offsetTime);
        console.log('Server Offset: ', serverOffset);
        console.log('Server Time: ', serverTime);
        console.log('Client Time: ', currentTime);
        console.log('Real Time: ', realTime);
    });

    socket.on('lastAction', (message) => {
        message = decode(message);
        console.log('Last Action: ', message);

        showJSONView(message, document.getElementById('action'));
    })

    socket.on('join', (message) => {
        message = decode(message);
        console.log('JOINED: ', message);
        if (!message) return;
        lastMessage = {};

        // document.getElementById('delta').innerHTML = jsonViewer(message, true);

        message = DELTA.merge(lastMessage || {}, message);
        showStateView(message, document.getElementById('state'));

        document.getElementById('joingame').innerText = 'Join Game';
        document.getElementById('joingame').style.display = 'none';
        document.getElementById('joingame').disabled = false;
        document.getElementById('leavegame').style.display = 'inline-block';
        document.getElementById('startgame').style.display = 'inline-block';


        if (!message.players) return;

        let localPlayer = message.players[socket.user.id];
        if (localPlayer) note.textContent = 'Status: ingame';
        // console.log('Game: ', message);
        message.local = Object.assign({}, socket.user, localPlayer);
        sendFrameMessage(message);
        // console.timeEnd('ActionLoop');

        if (message && message.events && message.events.gameover) {
            lastMessage = null;
        } else {
            lastMessage = message;
        }





    })
    socket.on('game', (message) => {
        let delta = decode(message);
        console.log('GAME UPDATE: ', delta);
        if (!delta) return;

        // document.getElementById('delta').innerHTML = jsonViewer(delta, true);

        message = DELTA.merge(lastMessage || {}, delta);


        showStateView(message, document.getElementById('state'));
        if (!message.players) return;

        let localPlayer = message.players[socket.user.id];
        if (localPlayer) note.textContent = 'Status: ingame';
        // console.log('Game: ', message);
        message.delta = delta;
        message.local = Object.assign({}, socket.user, localPlayer);
        sendFrameMessage(message);
        // console.timeEnd('ActionLoop');

        if (message && message.events && message.events.gameover) {
            lastMessage = null;
        } else {
            lastMessage = message;
        }
    });

    socket.on('private', (message) => {
        message = decode(message);
        console.log('Private Data: ', message);

        let localPlayer = lastMessage.players[socket.user.id];

        if (localPlayer) {
            localPlayer = DELTA.merge(localPlayer || {}, message);
            lastMessage.local = localPlayer;
            lastMessage.private = message;
        }

        showJSONView(message, document.getElementById('private'));

        // message.local = Object.assign({}, socket.user, localPlayer);
        sendFrameMessage(lastMessage);
        console.timeEnd('[ACOS] ActionLoop');
    });

    socket.on('disconnect', () => {
        note.textContent = 'Status: offline';
        window.sessionStorage.setItem('connected', false);

        document.getElementById('leavegame').style.display = 'none';
        document.getElementById('startgame').style.display = 'none';
        document.getElementById('joingame').style.display = 'inline-block';
        document.getElementById('joingame').innerText = 'Join Game';
        document.getElementById('joingame').disabled = false;
    });
}



function attachToFrame() {
    window.addEventListener('message', recvFrameMessage, false);
}

function detachFromFrame() {
    window.removeEventListener('message', recvFrameMessage, false);
}

function sendFrameMessage(msg) {
    if (iframe) iframe.contentWindow.postMessage(msg, '*');
}

function recvFrameMessage(evt) {
    let data = evt.data;
    if (data.type == '__ready') {
        return;
    }
    // console.time('ActionLoop');
    if (socket) socket.emit('action', encode(data));
}

function onLoad() {
    attachToFrame();

    let connected = window.sessionStorage.getItem('connected');
    if (typeof connected !== 'undefined' && connected == 'true') {
        let displayname = getUsername();
        if (displayname.trim().length == 0) {
            return;
        }

        note.textContent = 'Status: reconnecting...';

        setTimeout(() => {
            connect(displayname, () => {
                if (socket) socket.emit('action', encode({ type: 'join', payload: {} }));
            });
        }, 500);
    }
}
onLoad();
console.log('Simulator Loaded');