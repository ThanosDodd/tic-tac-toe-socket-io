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
    if (connections[0] == null || connections[1] == null) {
      socket.join(room);

      io.in(room).emit("room-connection", "success");
    } else {
      socket.emit("room-connection", "failure");
      return;
    }

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

    //broadcast connected player number
    io.in(room).emit("player-connection", playerIndex);

    //handle disconnect
    socket.on("disconnect", () => {
      connections[playerIndex] = null;
      //tell everyone which player disconnected
      //TODO reset game when someone disconnects
      io.in(room).emit("player-connection", playerIndex);
    });
    // on ready
    socket.on("player-ready", () => {
      socket.to(room).emit("enemy-ready", playerIndex);
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
