const http = require("http");
const fs = require("fs");
const WebSocketServer = require('websocket').server;
const url = require("url");

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
            res.writeHead(200, { 'Content-Type': 'text/javascript' });
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
    wsServer.broadcast(JSON.stringify(payload));
}

function sendPlayingPacket(timestamp) {
    payload = {
        "command": "play",
        "body": timestamp
    };
    wsServer.broadcast(JSON.stringify(payload));
    sendServerMessage("Video Playing");
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
    wsServer.broadcast(JSON.stringify(packet));
};

var playerViewKey = "";
var clients = 0;

wsServer = new WebSocketServer({
    httpServer: HostServer
});

wsServer.on('request', function(request) {
    const connection = request.accept(null, request.origin);
    clients++;
    console.log(Color.GREEN + "WebSocket client connected: " + request.key + " @ " + request.remoteAddress);
    sendServerMessage("Someone has joined the party!");

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
        }
    });

    connection.on('close', function(reasonCode, description) {
        console.log(Color.RED + 'Websocket client disconnected: ' + request.key + " @ " + request.remoteAddress);
        sendServerMessage("Someone has left the party!")
        clients = clients - 1;
        if (clients < 1) {
            clients = 0;
            playerViewKey = "";
        }
    });
});