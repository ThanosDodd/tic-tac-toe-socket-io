//board and info
const gameInfo = document.querySelector(".game-info");
const gameContainer = document.querySelector(".game-container");
const gameSquare = document.querySelectorAll(".game-square");
const roomID = document.querySelector("#RoomID");

//multiplayer buttons
const multiplayerButton = document.querySelector("#multiplayerButton");
multiplayerButton.addEventListener("click", startMultiGame);
const startButton = document.querySelector("#startGame");
//multiplayer div
const multiplayerSelected = document.querySelector(".multiplayer-selected");

//individual squares for game outcome
const square1 = gameSquare[0];
const square2 = gameSquare[1];
const square3 = gameSquare[2];
const square4 = gameSquare[3];
const square5 = gameSquare[4];
const square6 = gameSquare[5];
const square7 = gameSquare[6];
const square8 = gameSquare[7];
const square9 = gameSquare[8];

//game vars
let currentPlayer = "WhitePlayer";
let squaresClassArray = [];

let gameOver = false;
let draw = false;
let taken = false;
let ready = false;
let enemyReady = false;

let playerNum = 0;
let shotFired = -1;

//start with multiplayer options hidden
multiplayerSelected.hidden = true;

//multiPlayer game
function startMultiGame() {
  multiplayerButton.hidden = true;
  multiplayerSelected.hidden = false;
  roomID.hidden = true;
  gameInfo.innerText = "";

  gameSquare.forEach((elem) => {
    elem.classList.remove("taken");
    elem.classList.remove("BlackPlayer");
    elem.classList.remove("WhitePlayer");
  });

  const socket = io();

  socket.emit("join-room", roomID.value);

  //Get player number
  //if room is full, alert client
  //if not, update current player
  socket.on("player-number", (num) => {
    if (num == -1) {
      alert("Sorry, the server is full");
    } else {
      playerNum = parseInt(num);
      if (playerNum == 1) {
        currentPlayer = "BlackPlayer";
      }
      //multiplayer - get other player status
      socket.emit("check-players");
    }
  });

  //multiplayer - another player has connected or disconnected
  socket.on("player-connection", (num) => {
    playerConnectedOrDisconnected(num);
  });

  //multiplayer on enemy ready
  socket.on("enemy-ready", (num) => {
    enemyReady = true;
    playerReady(num);
    if (ready) playGameMulti(socket);
  });

  //multiplayer check player status
  socket.on("check-players", (players) => {
    players.forEach((p, i) => {
      if (p.connected) playerConnectedOrDisconnected(i);
      if (p.ready) {
        playerReady(i);
        if (i != playerNum) enemyReady = true;
      }
    });
  });

  // On Timeout
  socket.on("timeout", () => {
    alert("You have reached the server time limit");
  });

  //multiplayer start button
  startButton.addEventListener("click", () => {
    startButton.hidden = true;

    playGameMulti(socket);
  });

  //multiplayer game check
  function playGameMulti(socket) {
    if (gameOver || draw) return;
    if (!ready) {
      socket.emit("player-ready");
      ready = true;
      playerReady(playerNum);
    }

    if (enemyReady) {
      if (currentPlayer == "WhitePlayer") {
        gameInfo.innerText = "Your Go!";

        if (taken) {
          gameInfo.style.opacity = 0;
          gameInfo.innerText = "Choose another square";
          setTimeout(() => {
            gameInfo.style.opacity = 1;
          }, 201);
        }
      }
      if (currentPlayer == "BlackPlayer") {
        gameInfo.innerText = "Opponent's go";
      }
    }
  }

  //Square event listeners
  gameSquare.forEach((elem) => {
    elem.addEventListener("click", multiEventListenerFunc);
  });
  function multiEventListenerFunc(e) {
    if (currentPlayer === "WhitePlayer" && ready && enemyReady) {
      shotFired = e.target.id;
      socket.emit("fire", shotFired);
    }
  }

  //On Fire Received
  socket.on("fire", (id) => {
    enemyGo(id);
    socket.emit("fire-reply", id);
    playGameMulti(socket);
  });
  //On Fire Reply Received
  socket.on("fire-reply", (id) => {
    enemyGo(id);
    playGameMulti(socket);
  });

  //Game logic
  function enemyGo(id) {
    // Has been taken
    if (gameSquare[id - 1].classList.contains("taken")) {
      console.log("taken");
      taken = true;

      // Hasn't been taken
    } else {
      taken = false;

      gameSquare[id - 1].classList.add("taken");

      if (currentPlayer == "WhitePlayer") {
        gameSquare[id - 1].classList.add("WhitePlayer");

        checkVictoryDrawMulti(currentPlayer);

        if (gameOver) {
          gameInfo.innerText = "You win!";
        } else if (draw) {
          gameInfo.innerText = "Draw :|";
        } else {
          currentPlayer = "BlackPlayer";
          gameInfo.innerText = "It's your opponent's go";
        }
      } else if (currentPlayer == "BlackPlayer") {
        //add computer player move function tk
        gameSquare[id - 1].classList.add("BlackPlayer");

        checkVictoryDrawMulti(currentPlayer);

        if (gameOver) {
          gameInfo.innerText = "Opponent wins :(";
        } else if (draw) {
          gameInfo.innerText = "Draw :|";
        } else {
          currentPlayer = "WhitePlayer";
          gameInfo.innerText = "It's your go";
        }
      }
    }
  }

  //Check victory or draw
  function checkVictoryDrawMulti(player) {
    squaresClassArray = Array.from(
      Array.from(gameSquare).map((elem) => elem.classList)
    );

    if (
      (square1.classList.contains(player) &&
        square2.classList.contains(player) &&
        square3.classList.contains(player)) ||
      (square4.classList.contains(player) &&
        square5.classList.contains(player) &&
        square6.classList.contains(player)) ||
      (square7.classList.contains(player) &&
        square8.classList.contains(player) &&
        square9.classList.contains(player)) ||
      (square1.classList.contains(player) &&
        square4.classList.contains(player) &&
        square7.classList.contains(player)) ||
      (square2.classList.contains(player) &&
        square5.classList.contains(player) &&
        square8.classList.contains(player)) ||
      (square3.classList.contains(player) &&
        square6.classList.contains(player) &&
        square9.classList.contains(player)) ||
      (square1.classList.contains(player) &&
        square5.classList.contains(player) &&
        square9.classList.contains(player)) ||
      (square3.classList.contains(player) &&
        square5.classList.contains(player) &&
        square7.classList.contains(player))
    ) {
      gameSquare.forEach((elem) =>
        elem.removeEventListener("click", multiEventListenerFunc)
      );

      gameOver = true;
    } else if (
      squaresClassArray.filter((elem) => elem.contains("taken")).length == 9
    ) {
      gameSquare.forEach((elem) =>
        elem.removeEventListener("click", multiEventListenerFunc)
      );

      draw = true;
    }
  }

  //Styles for connected status and current player
  function playerReady(num) {
    let player = `.p${parseInt(num) + 1}`;
    document.querySelector(`${player} .ready span`).classList.toggle("green");
  }
  function playerConnectedOrDisconnected(num) {
    let player = `.p${parseInt(num) + 1}`;
    document
      .querySelector(`${player} .connected span`)
      .classList.toggle("green");

    if (parseInt(num) === playerNum)
      document.querySelector(player).style.fontWeight = "bold";
  }
}
