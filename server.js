const express = require("express");
const app = express();

const http = require("http");
const server = http.createServer(app);

const socketio = require("socket.io");
const io = socketio(server);

const path = require("path");
const PORT = process.env.PORT || 3000;

//static folder
app.use(express.static(path.join(__dirname, "public")));

//listen
server.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});

//handle connection request from client
const connections = [null, null];

io.on("connection", (socket) => {
  socket.on("join-room", (room) => {
    //TODO Check that there is enough space before adding potential third person
    socket.join(room);

    //client register in connections array if there is available space
    let playerIndex = -1;
    for (const i in connections) {
      if (connections[i] == null) {
        playerIndex = i;
        break;
      }
    }
    connections[playerIndex] = false;

    //emit client of connection result
    socket.to(room).emit("player-number", playerIndex);

    //ignore player 3+
    if (playerIndex == -1) return;

    //broadcast connected player number
    io.in(room).emit("player-connection", playerIndex);

    //handle disconnect
    socket.on("disconnect", () => {
      connections[playerIndex] = null;
      //tell everyone which player disconnected
      io.in(room).emit("player-connection", playerIndex);
    });

    // on ready
    socket.on("player-ready", () => {
      io.in(room).emit("enemy-ready", playerIndex);
      connections[playerIndex] = true;
    });

    //check player connections
    socket.on("check-players", () => {
      const players = [];
      for (const i in connections) {
        connections[i] == null
          ? players.push({ connected: false, ready: false })
          : players.push({ connected: true, ready: connections[i] });
      }
      console.log(players);
      io.in(room).emit("check-players", players);
    });

    // On Fire Received
    socket.on("fire", (id) => {
      // Emit the move to the other player
      socket.to(room).emit("fire", id);
    });

    // on Fire Reply
    socket.on("fire-reply", (id) => {
      socket.to(room).emit("fire-reply", id);
    });
  });
});
