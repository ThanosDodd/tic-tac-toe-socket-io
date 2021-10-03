const express = require("express");
const path = require("path");
const http = require("http");
const PORT = process.env.PORT || 3000;
const socketio = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketio(server);

//static folder
app.use(express.static(path.join(__dirname, "public")));

server.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});

const connections = [null, null];

//handle connection request from client
io.on("connection", (socket) => {
  //   console.log("new ws connection");

  //find available player number
  let playerIndex = -1;
  for (const i in connections) {
    if (connections[i] == null) {
      playerIndex = i;
      break;
    }
  }

  //tell connecting client what player number they are
  socket.emit("player-number", playerIndex);

  console.log(`Player ${playerIndex} has connected`);

  //ignore player 3
  if (playerIndex == -1) return;

  connections[playerIndex] = false;

  // What player number just connected
  socket.broadcast.emit("player-connection", playerIndex);

  //handle disconnect
  socket.on("disconnect", () => {
    console.log(`Player ${playerIndex} disconnected`);
    connections[playerIndex] = null;

    //tell everyone who disconnected
    socket.broadcast.emit("player-connection", playerIndex);
  });

  // on ready
  socket.on("player-ready", () => {
    socket.broadcast.emit("enemy-ready", playerIndex);
    connections[playerIndex] = true;
  });

  //  check player connections
  socket.on("check-players", () => {
    const players = [];
    for (const i in connections) {
      connections[i] == null
        ? players.push({ connected: false, ready: false })
        : players.push({ connected: true, ready: connections[i] });
    }
    socket.emit("check-players", players);
  });

  // On Fire Received
  socket.on("fire", (id) => {
    console.log(`Shot fired from ${playerIndex}`, id);

    // Emit the move to the other player
    socket.broadcast.emit("fire", id);
  });

  // on Fire Reply
  socket.on("fire-reply", (id) => {
    socket.broadcast.emit("fire-reply", id);
  });

  // Timeout connection
  setTimeout(() => {
    connections[playerIndex] = null;
    socket.emit("timeout");
    socket.disconnect();
  }, 120000);
});
