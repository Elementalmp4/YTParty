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
    } else if (serverPacket.command == "autoload") {
        location.reload();
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

function setNewVideo(videoURL) {
    payload = JSON.stringify({
        "command": "newVideo",
        "body": videoURL
    });
    webSocketClient.send(payload);
}

const fonts = {
    "italic": ["𝘢", "𝘣", "𝘤", "𝘥", "𝘦", "𝘧", "𝘨", "𝘩", "𝘪", "𝘫", "𝘬", "𝘭", "𝘮", "𝘯", "𝘰", "𝘱", "𝘲", "𝘳", "𝘴", "𝘵", "𝘶", "𝘷", "𝘸", "𝘹", "𝘺", "𝘻", "𝘈", "𝘉", "𝘊", "𝘋", "𝘌", "𝘍", "𝘎", "𝘏", "𝘐", "𝘑", "𝘒", "𝘓", "𝘔", "𝘕", "𝘖", "𝘗", "𝘘", "𝘙", "𝘚", "𝘛", "𝘜", "𝘝", "𝘞", "𝘟", "𝘠", "𝘡"],
    "bold": ["𝗮", "𝗯", "𝗰", "𝗱", "𝗲", "𝗳", "𝗴", "𝗵", "𝗶", "𝗷", "𝗸", "𝗹", "𝗺", "𝗻", "𝗼", "𝗽", "𝗾", "𝗿", "𝘀", "𝘁", "𝘂", "𝘃", "𝘄", "𝘅", "𝘆", "𝘇", "𝗔", "𝗕", "𝗖", "𝗗", "𝗘", "𝗙", "𝗚", "𝗛", "𝗜", "𝗝", "𝗞", "𝗟", "𝗠", "𝗡", "𝗢", "𝗣", "𝗤", "𝗥", "𝗦", "𝗧", "𝗨", "𝗩", "𝗪", "𝗫", "𝗬", "𝗭"],
    "cursive": ["𝒶", "𝒷", "𝒸", "𝒹", "𝑒", "𝒻", "𝑔", "𝒽", "𝒾", "𝒿", "𝓀", "𝓁", "𝓂", "𝓃", "𝑜", "𝓅", "𝓆", "𝓇", "𝓈", "𝓉", "𝓊", "𝓋", "𝓌", "𝓍", "𝓎", "𝓏", "𝒜", "𝐵", "𝒞", "𝒟", "𝐸", "𝐹", "𝒢", "𝐻", "𝐼", "𝒥", "𝒦", "𝐿", "𝑀", "𝒩", "𝒪", "𝒫", "𝒬", "𝑅", "𝒮", "𝒯", "𝒰", "𝒱", "𝒲", "𝒳", "𝒴", "𝒵"],
    "strikethrough": ["a̵", "b̵", "c̵", "d̵", "e̵", "f̵", "g̵", "h̵", "i̵", "j̵", "k̵", "l̵", "m̵", "n̵", "o̵", "p̵", "q̵", "r̵", "s̵", "t̵", "u̵", "v̵", "w̵", "x̵", "y̵", "z̵", "A̵", "B̵", "C̵", "D̵", "E̵", "F̵", "G̵", "H̵", "I̵", "J̵", "K̵", "L̵", "M̵", "N̵", "O̵", "P̵", "Q̵", "R̵", "S̵", "T̵", "U̵", "V̵", "W̵", "X̵", "Y̵", "Z̵"],
    "underline": ["a̲̲", "b̲̲", "c̲̲", "d̲̲", "e̲̲", "f̲̲", "g̲̲", "h̲̲", "i̲̲", "j̲̲", "k̲̲", "l̲̲", "m̲̲", "n̲̲", "o̲̲", "p̲̲", "q̲̲", "r̲̲", "s̲̲", "t̲̲", "u̲̲", "v̲̲", "w̲̲", "x̲̲", "y̲̲", "z̲̲", "a̲", "b̲", "c̲", "d̲", "e̲", "f̲", "g̲", "h̲", "i̲", "j̲", "k̲", "l̲", "m̲", "n̲", "o̲", "p̲", "q̲", "r̲", "s̲", "t̲", "u̲", "v̲", "w̲", "x̲", "y̲", "z̲"],
    "english": ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]
};

function convert(body, fontName) {
    font = fonts[fontName];
    var message = "";
    str = body.split("");
    for (i = 0; i < str.length; i++) {
        if (fonts.english.includes(str[i])) {
            message = message + font[fonts.english.indexOf(str[i])];
        } else {
            message = message + str[i];
        }
    }
    return message;
}

function toCrazyCase(body) {
    var direction = Math.round(Math.random());
    var chars = body.split("");
    var final = "";
    for (var i = 0; i < chars.length; i++) {
        if (fonts.english.includes(chars[i])) {
            if (direction == 0) {
                final += chars[i].toLowerCase();
                direction = 1;
            } else {
                final += chars[i].toUpperCase();
                direction = 0;
            }
        } else {
            final += chars[i];
        }
    }
    return final;
}

function toSpacedMessage(message) {
    return message.split("").join(" ");
}

document.getElementById("chat-input").addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        message = document.getElementById("chat-input").value;

        if (message === "") {
            return;
        }

        if (message.startsWith("/")) {
            var sendChatMessage = true;
            const args = message.slice(1).split(/ +/);
            const command = args.shift().toLowerCase();
            document.getElementById("chat-input").value = "";

            if (command == "setname") {
                setName(args.join(" "));
                sendChatMessage = false;
            } else if (command == "ping") {
                addSystemMessage("Pong!");
                sendChatMessage = false;
            } else if (command == "setvideo") {
                setNewVideo(args[0]);
            } else if (command == "help") {
                addSystemMessage("/setname - sets your name /setvideo - sets the new video /help - shows this message /b - changes your text to bold /i - changes your text to italics /c - changes your text to cursive /cc - cHaNgEs YoUr TeXt LiKe ThIs /s - strikes through your message /u - underlines your message /sp - seperates every character in your message with a space")
                sendChatMessage = false;
            } else if (command == "b") {
                message = convert(args.join(" "), "bold")
            } else if (command == "i") {
                message = convert(args.join(" "), "italic")
            } else if (command == "c") {
                message = convert(args.join(" "), "cursive")
            } else if (command == "s") {
                message = convert(args.join(" "), "strikethrough")
            } else if (command == "u") {
                message = convert(args.join(" "), "underline")
            } else if (command == "cc") {
                message = toCrazyCase(args.join(" "));
            } else if (command == "sp") {
                message = toSpacedMessage(args.join(" "));
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