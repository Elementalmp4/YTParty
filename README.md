# YTParty

## What is YTParty?

YTParty is a basic Node.JS program which can be hosted for free on your laptop or computer (or even a Raspberry Pi) to allow your friends to watch YouTube with you! The app features a simple web interface, and our custom chat assistant, Gerald. In combination with Ngrok, you can host the program and allow people to connect securely to it (all your personal data and your IP address will be hidden) 

## How to use YTParty

1) You will need to download all the files from this repository. Then, you need to start YTParty. You can do this by simply typing `node ./YTPartyServer.js` in the root folder of the project. You can also use a runtime environment such as PM2.

2) Grab a YouTube url, note: this url must be a full `youtube.com/watch?v=********` and not `youtu.be`

3) head to `localhost:8000` if you are hosting on your computer, or the IP address of the device you are hosting on (EG: `192.168.1.1:8000`)

4) A popup box should appear asking for the URL you copied. Paste it in and press OK

5) You should now see the video loaded and a chat at the side. Use /setname [new name] to set your username

## Using YTParty with people not in your home using Ngrok

1) Download and install [Ngrok](https://ngrok.com/)

2) Follow the steps to create and connect your account

3) Once finished, start up Ngrok with the command `ngrok http 8000`

4) Go to `127.0.0.1:4040` in your browser, you will see two links. You will need to share the link that starts with HTTP, **NOT** HTTPS

## Changing the video

use `/setvideo [new video link]` to set a new video
