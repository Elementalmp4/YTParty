//YTParty Setup
const websocketServerURL = "ws://" + location.host;
webSocketClient = new WebSocket(websocketServerURL);
const locationURL = new URL(location.href);
const viewKey = locationURL.searchParams.get("viewkey");
var lastCommand = "",
    lastMessage = "",
    username = "",
    globalKey = "";

function createPlayer(Viewkey) {
    globalKey = Viewkey;
    tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '599',
        width: '900',
        videoId: globalKey,
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    console.log("Ready");
}

function sendPlayingPacket(time) {
    payload = {
        "command": "playing",
        "body": time
    }
    webSocketClient.send(JSON.stringify(payload));
}

function sendPausedPacket() {
    payload = {
        "command": "paused"
    }
    webSocketClient.send(JSON.stringify(payload));
}

function playVideo(playFromTime) {
    player.seekTo(playFromTime, true);
    player.playVideo();
}

function pauseVideo() {
    player.pauseVideo();
}

function onPlayerStateChange(event) {
    if (event.data == "1") {
        sendPlayingPacket(Math.floor(player.getCurrentTime()));
    } else if (event.data == "2") {
        sendPausedPacket();
    }
}

//Load video and iFrame API
function loadVideo(viewKey) {
    $("#chat").show();
    console.log("Video loader started with key " + viewKey);
    createPlayer(viewKey);
}

//Payload Functions
function getKey() {
    payload = {
        "command": "getkey"
    }
    webSocketClient.send(JSON.stringify(payload));
}

function setKey(key) {
    payload = {
        "command": "setkey",
        "body": key
    }
    webSocketClient.send(JSON.stringify(payload));
}

function promptForURL() {
    const keyURL = window.prompt("You need to enter a YouTube video URL:");
    if (!keyURL) {
        promptForURL();
    }
    const promptedURL = new URL(keyURL);
    const URLLoadedViewKey = promptedURL.searchParams.get("v");
    if (URLLoadedViewKey) {
        setKey(URLLoadedViewKey);
    } else {
        promptForURL();
    }
}

function addChatMessage(message) {
    const text = message.body;
    const user = message.user;

    var message = `
          <div>
              <p class="msg-nickname">${user}</p>
              <br />
              <p${message.sysMessage ? ' class="system-message"' : ""}>${text}</p>
          </div>
          <br />
      `;

    $("#chat").prepend(message);
    $('#chat').scrollTop($('#chat')[0].scrollHeight);
}

function sendMessage(message) {
    payload = JSON.stringify({
        "command": "chat",
        "user": username == "" ? "YTParty User" : username,
        "body": message
    });
    webSocketClient.send(payload);
};

function addSystemMessage(message) {
    if (message == lastMessage) {
        return;
    }
    addChatMessage({
        "body": message,
        "user": "Gerald",
        "sysMessage": true
    });
    lastMessage = message;
}

function focusChat() {
    $("#chat-input").focus();
}

//Websocket Functions
webSocketClient.onmessage = function(content) {
    serverPacket = JSON.parse(content.data);
    console.log("Server: ", serverPacket);
    if (serverPacket.command == lastCommand) {
        console.log("Received same command, returning");
        return;
    }
    if (serverPacket.command == "play") {
        console.log("Play command triggered");
        playVideo(serverPacket.body);
        lastCommand = serverPacket.command;
    } else if (serverPacket.command == "pause") {
        console.log("Pause command triggered");
        pauseVideo();
        lastCommand = serverPacket.command;
    } else if (serverPacket.command == "key") {
        console.log("Key command triggered");
        if (serverPacket.body !== "") {
            console.log("Got key, loading video");
            loadVideo(serverPacket.body);
        } else {
            console.log("Prompting for URL");
            $("#chat").hide();
            promptForURL();
        }
    } else if (serverPacket.command == "chat") {
        console.log("Chat command triggered");
        addChatMessage(serverPacket);
    } else if (serverPacket.command == "servermsg") {
        addSystemMessage(serverPacket.body);
    }
}

webSocketClient.onopen = function() {
    if (!viewKey) {
        getKey();
    } else {
        loadVideo(viewKey);
        setKey(viewKey);
    }
}

function setName(name) {
    username = name;
    addSystemMessage("Your name is now " + name);
    setServerUsername(name);
}

document.getElementById("chat-input").addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        message = document.getElementById("chat-input").value;

        if (message === "") {
            return;
        }

        if (message.startsWith("/")) {
            const args = message.split(/ +/g);
            const command = args.shift();
            document.getElementById("chat-input").value = "";

            if (command == "/setname") {
                setName(args.join(" "));
                sendChatMessage = false;
            } else if (command == "/ping") {
                addSystemMessage("Pong!");
            }

            document.getElementById("chat-input").value = "";
            if (sendChatMessage) {
                sendMessage(message);
            }
        } else {
            document.getElementById("chat-input").value = "";
            sendMessage(message);
        }
    }
});