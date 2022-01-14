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
const connections = { 12345: [null, null], 56789: [null, null] };
const isNumber = (element) => isNaN(element) === false;

io.on("connection", (socket) => {
  socket.on("join-room", (room) => {
    if (!(room in connections)) {
      // if room doesn't exist
      // check that there is space in the server
      if (Object.keys(connections).some(isNumber)) {
        // and create it if there is
        for (const objKey in connections) {
          if (isNumber(objKey)) {
            delete Object.assign(connections, { [room]: connections[objKey] })[
              objKey
            ];
            break;
          }
        }
        // if room could be created, connect player to it if there is space
        // if there is no space in room, send roomFull message

        if (connections[room][0] == null || connections[room][1] == null) {
          socket.join(room);

          io.in(room).emit("room-connection", "success");
        } else {
          socket.emit("room-connection", "failure");
          return;
        }
      } else {
        // if there isn't room in the server, send serverFull message
        socket.emit("room-connection", "failure-sf");
        return;
      }
    } else {
      // room already exists
      if (connections[room][0] == null || connections[room][1] == null) {
        socket.join(room);

        io.in(room).emit("room-connection", "success");
      } else {
        socket.emit("room-connection", "failure");
        return;
      }
    }

    //client register in connections array if there is available space
    let playerIndex = -1;
    for (const i in connections[room]) {
      if (connections[room][i] == null) {
        playerIndex = i;
        break;
      }
    }
    connections[room][playerIndex] = false;

    //emit client of connection result
    socket.to(room).emit("player-number", playerIndex);

    // //broadcast connected player number
    // io.in(room).emit("player-connection", playerIndex);

    //handle disconnect
    socket.on("disconnect", () => {
      connections[room][playerIndex] = null;
      //tell everyone which player disconnected
      socket.to(room).emit("player-connection", playerIndex);

      if (connections[room][0] == null && connections[room][1] == null) {
        const newKey = Math.floor(Math.random() * 90000) + 10000;

        delete Object.assign(connections, { [newKey]: connections[room] })[
          room
        ];
      }
    });
    // on ready
    socket.on("player-ready", () => {
      socket.to(room).emit("enemy-ready", playerIndex);
      connections[room][playerIndex] = true;
    });

    //check player connections
    socket.on("check-players", () => {
      const players = [];
      for (const i in connections[room]) {
        connections[room][i] == null
          ? players.push({ connected: false, ready: false })
          : players.push({ connected: true, ready: connections[room][i] });
      }
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

// TODO play again?
