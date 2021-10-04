//board and info
const gameInfo = document.querySelector(".game-info");
const gameContainer = document.querySelector(".game-container");
const gameSquare = document.querySelectorAll(".game-square");

//single player button
const singlePlayerButton = document.querySelector("#singlePlayerButton");

//multiplayer buttons
const multiplayerButton = document.querySelector("#multiplayerButton");
const startButton = document.querySelector("#startGame");

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
let currentPlayer = "Player1";
let squaresClassArray = [];
let gameOver = false;
let draw = false;
let taken = false;
let gameMode = "";

//multiplayer vars
let playerNum = 0;
let ready = false;
let enemyReady = false;
let shotFired = -1;

//select game mode
singlePlayerButton.addEventListener("click", startGame);
multiplayerButton.addEventListener("click", startMultiGame);

//multiPlayer game
function startMultiGame() {
  gameMode = "multiPlayer";

  const socket = io();

  //multiplayer - get player number
  //if server is full, alert client
  //if not, update current player
  socket.on("player-number", (num) => {
    if (num == -1) {
      alert("Sorry, the server is full");
    } else {
      playerNum = parseInt(num);
      if (playerNum == 1) {
        currentPlayer = "enemy-player";
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
      if (currentPlayer == "Player1") {
        gameInfo.innerText = "Your Go!";

        if (taken) {
          gameInfo.style.opacity = 0;
          gameInfo.innerText = "Choose another square";
          setTimeout(() => {
            gameInfo.style.opacity = 1;
          }, 201);
        }
      }
      if (currentPlayer == "enemy-player") {
        gameInfo.innerText = "Opponent's go";
      }
    }
  }

  //multiplayer event listeners
  gameSquare.forEach((elem) => {
    elem.addEventListener("click", multiEventListenerFunc);
  });

  function multiEventListenerFunc(e) {
    if (currentPlayer === "Player1" && ready && enemyReady) {
      shotFired = e.target.id;
      socket.emit("fire", shotFired);
    }
  }

  // On Fire Received
  socket.on("fire", (id) => {
    enemyGo(id);
    socket.emit("fire-reply", id);
    playGameMulti(socket);
  });

  // On Fire Reply Received
  socket.on("fire-reply", (id) => {
    enemyGo(id);
    playGameMulti(socket);
  });

  //multiplayer game logic
  function enemyGo(id) {
    // Has been taken
    if (gameSquare[id - 1].classList.contains("taken")) {
      console.log("taken");
      taken = true;

      // Hasn't been taken
    } else {
      taken = false;

      gameSquare[id - 1].classList.add("taken");

      if (currentPlayer == "Player1") {
        gameSquare[id - 1].classList.add("Player1");

        checkVictoryDrawMulti(currentPlayer);

        if (gameOver) {
          gameInfo.innerText = "You win!";

          // restartGame();
        } else if (draw) {
          gameInfo.innerText = "Draw :|";

          // restartGame();
        } else {
          currentPlayer = "enemy-player";
          gameInfo.innerText = "It's your opponent's go";
        }
      } else if (currentPlayer == "enemy-player") {
        //add computer player move function tk
        gameSquare[id - 1].classList.add("enemy-player");

        checkVictoryDrawMulti(currentPlayer);

        if (gameOver) {
          gameInfo.innerText = "Opponent wins :(";

          // restartGame();
        } else if (draw) {
          gameInfo.innerText = "Draw :|";

          // restartGame();
        } else {
          currentPlayer = "Player1";
          gameInfo.innerText = "It's your go";
        }
      }
    }
  }

  //multi check victory or draw
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
      console.log("Victory");

      gameSquare.forEach((elem) =>
        elem.removeEventListener("click", multiEventListenerFunc)
      );

      gameOver = true;
    } else if (
      squaresClassArray.filter((elem) => elem.contains("taken")).length == 9
    ) {
      console.log("Draw");

      gameSquare.forEach((elem) =>
        elem.removeEventListener("click", multiEventListenerFunc)
      );

      draw = true;
    }
  }

  //multi player Ready
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

//single Player game
function startGame() {
  singlePlayerButton.hidden = true;

  gameInfo.innerText = "";

  gameSquare.forEach((elem) => {
    elem.classList.remove("taken");
    elem.classList.remove("enemy-player");
    elem.classList.remove("Player1");
  });

  choosePlayer();

  if (currentPlayer == "Player1") {
    gameInfo.innerText = "It's your go";
  } else if (currentPlayer == "enemy-player") {
    gameInfo.innerText = "It's your opponent's go";
  }

  gameSquare.forEach((elem) => elem.addEventListener("click", playGame));

  //single player game logic
  function playGame(e) {
    // Has been taken
    if (e.target.classList.contains("taken")) {
      gameInfo.style.opacity = 0;
      gameInfo.innerText = "Choose another square";
      setTimeout(() => {
        gameInfo.style.opacity = 1;
      }, 201);

      // Hasn't been taken
    } else {
      e.target.classList.add("taken");

      if (currentPlayer == "Player1") {
        e.target.classList.add("Player1");

        checkVictoryDraw(currentPlayer);

        if (gameOver) {
          gameInfo.innerText = "You win!";

          restartGame();
        } else if (draw) {
          gameInfo.innerText = "Draw :|";

          restartGame();
        } else {
          currentPlayer = "enemy-player";
          gameInfo.innerText = "It's your opponent's go";
        }
      } else if (currentPlayer == "enemy-player") {
        //add computer player move function tk
        e.target.classList.add("enemy-player");

        checkVictoryDraw(currentPlayer);

        if (gameOver) {
          gameInfo.innerText = "Opponent wins :(";

          restartGame();
        } else if (draw) {
          gameInfo.innerText = "Draw :|";

          restartGame();
        } else {
          currentPlayer = "Player1";
          gameInfo.innerText = "It's your go";
        }
      }
    }
  }

  //check victory or draw
  function checkVictoryDraw(player) {
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
      console.log("Victory");

      gameSquare.forEach((elem) => elem.removeEventListener("click", playGame));

      gameOver = true;
    } else if (
      squaresClassArray.filter((elem) => elem.contains("taken")).length == 9
    ) {
      console.log("Draw");

      gameSquare.forEach((elem) => elem.removeEventListener("click", playGame));

      draw = true;
    }
  }

  //single player restart
  function restartGame() {
    currentPlayer = "Player1";
    squaresClassArray = [];
    gameOver = false;
    draw = false;

    singlePlayerButton.hidden = false;
  }

  function choosePlayer() {
    const number = Math.random();
    if (number >= 0.5) {
      currentPlayer = "Player1";
    } else {
      currentPlayer = "enemy-player";
    }
  }
}
