const http = require("http");
const fs = require("fs");
const WebSocketServer = require('websocket').server;
const url = require("url");

var chatlog = [];

const HTTP_PORT = 8000;

const Color = {
    "BLUE": "\x1b[34m",
    "GREEN": "\x1b[32m",
    "RED": "\x1b[31m",
    "RESET": "\x1b[0m"
}

console.log(Color.BLUE + "Starting server...");
var HostServer = http.createServer(function(req, res) {
    console.log(Color.BLUE + "Request Received: " + req.url);

    var q = url.parse(req.url, true);
    if (q.pathname == '/') {
        console.log(Color.GREEN + "Delivered index file");
        fs.readFile('./index.html', function(err, data) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(data);
            return res.end();
        });

    } else if (q.pathname == '/client.js') {
        console.log(Color.GREEN + "Delivered client script");
        fs.readFile('./client.js', function(err, data) {
            res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
            res.write(data);
            return res.end();
        });

    } else if (q.pathname == '/style.css') {
        console.log(Color.GREEN + "Delivered CSS file");
        fs.readFile('./style.css', function(err, data) {
            res.writeHead(200, { 'Content-Type': 'text/css' });
            res.write(data);
            return res.end();
        });

    } else {
        console.log(Color.RED + "Could not deliver '" + q.pathname + "'");
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end("<html><center><h1>Invalid Request '" + req.url + "'</h1><hr />YTParty V1.1</center></html>")
    }
});

try {
    HostServer.listen(HTTP_PORT);
    console.log(Color.GREEN + "Ready! - Hosted on port " + HTTP_PORT);
} catch {
    console.log(Color.RED + "Failed to start!");
    process.exit();
}

function sendServerMessage(message) {
    payload = {
        "command": "servermsg",
        "body": message
    }
    messageLog = { "user": "Gerald", "body": message, "sysMessage": true };
    chatlog.push(messageLog);
    wsServer.broadcast(JSON.stringify(payload));
}

function sendPlayingPacket(timestamp) {
    payload = {
        "command": "play",
        "body": timestamp
    };
    wsServer.broadcast(JSON.stringify(payload));
    sendServerMessage("Video Playing at " + new Date(timestamp * 1000).toISOString().substr(11, 8));
};

function sendPausedPacket() {
    payload = {
        "command": "pause",
    };
    wsServer.broadcast(JSON.stringify(payload));
    sendServerMessage("Video Paused");
};

function sendKeyPacket(key) {
    payload = {
        "command": "key",
        "body": key
    };
    wsServer.broadcast(JSON.stringify(payload));
};

function setKey(key) {
    if (playerViewKey == "") {
        playerViewKey = key;
    }
    sendKeyPacket(key);
}

function sendChatMessage(packet) {
    messageLog = { "user": packet.user, "body": packet.body, "sysMessage": false };
    chatlog.push(messageLog)
    wsServer.broadcast(JSON.stringify(packet));
};

function loadNewVideo(URL) {
    var q = url.parse(URL, true);
    var viewkey = q.query.v;
    if (!viewkey) {
        return;
    }

    playerViewKey = viewkey;
    autoLoading = true;

    payload = {
        "command": "autoload"
    }

    wsServer.broadcast(JSON.stringify(payload));
}

function sendIdentity(connection, identity) {
    payload = {
        "command": "identify",
        "body": identity
    }
    connection.send(JSON.stringify(payload));
}

function reloadChat(connection) {
    chatlog.forEach(item => {
        payload = {
            "command": "chatload",
            "body": item
        }
        connection.send(JSON.stringify(payload));
    });
}

var playerViewKey = "";
var clients = 0;
var autoLoading = false;

wsServer = new WebSocketServer({
    httpServer: HostServer
});

wsServer.on('request', function(request) {
    const connection = request.accept(null, request.origin);
    clients++;
    console.log(Color.GREEN + "WebSocket client connected: " + request.key + " @ " + request.remoteAddress);
    sendServerMessage("Someone has joined the party!");
    sendIdentity(connection, request.key);
    reloadChat(connection);

    connection.on('message', function(message) {
        packet = JSON.parse(message.utf8Data);
        console.log(Color.BLUE + "Command Packet:" + Color.RESET, packet);

        if (packet.command == "playing") {
            sendPlayingPacket(packet.body);
        } else if (packet.command == "paused") {
            sendPausedPacket();
        } else if (packet.command == "getkey") {
            sendKeyPacket(playerViewKey);
        } else if (packet.command == "setkey") {
            setKey(packet.body);
        } else if (packet.command == "chat") {
            sendChatMessage(packet);
        } else if (packet.command == "newVideo") {
            loadNewVideo(packet.body);
        } else if (packet.command == "clear") {
            chatlog = [];
            sendServerMessage("The chat has been cleared. It will not load when you change videos.");
        } else if (packet.command == "typingstart") {
            wsServer.broadcast(JSON.stringify(packet));
        } else if (packet.command == "typingstop") {
            wsServer.broadcast(JSON.stringify(packet));
        }
    });

    connection.on('close', function(reasonCode, description) {
        console.log(Color.RED + 'Websocket client disconnected: ' + request.key + " @ " + request.remoteAddress);
        sendServerMessage("Someone has left the party!")
        clients = clients - 1;
        if (clients < 1) {
            clients = 0;
            if (!autoLoading) {
                playerViewKey = "";
                chatlog = [];
            } else {
                autoLoading = false;
            }
        }
    });
});