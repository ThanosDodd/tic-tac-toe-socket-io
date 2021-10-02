const gameInfo = document.querySelector(".game-info");
const gameContainer = document.querySelector(".game-container");
const gameSquare = document.querySelectorAll(".game-square");
const button = document.querySelector(".button");

const square1 = gameSquare[0];
const square2 = gameSquare[1];
const square3 = gameSquare[2];
const square4 = gameSquare[3];
const square5 = gameSquare[4];
const square6 = gameSquare[5];
const square7 = gameSquare[6];
const square8 = gameSquare[7];
const square9 = gameSquare[8];

let currentPlayer = "";
let squaresClassArray = [];
let gameOver = false;
let draw = false;

function startGame() {
  button.hidden = true;

  choosePlayer();

  if (currentPlayer == "Player1") {
    gameInfo.innerHTML = "It's your go";
  } else if (currentPlayer == "Computer") {
    gameInfo.innerHTML = "It's your opponent's go";
  }

  gameSquare.forEach((elem) => elem.addEventListener("click", playGame));
}

function playGame(e) {
  // Has been taken
  if (e.target.classList.contains("taken")) {
    gameInfo.style.opacity = 0;
    gameInfo.innerHTML = "Choose another square";
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
        gameInfo.innerHTML = "You win!";
      } else if (draw) {
        gameInfo.innerHTML = "Draw :|";
      } else {
        currentPlayer = "Computer";
        gameInfo.innerHTML = "It's your opponent's go";
      }
    } else if (currentPlayer == "Computer") {
      //add computer player move function
      e.target.classList.add("Computer");

      checkVictoryDraw(currentPlayer);

      if (gameOver) {
        gameInfo.innerHTML = "Opponent wins :(";
      } else if (draw) {
        gameInfo.innerHTML = "Draw :|";
      } else {
        currentPlayer = "Player1";
        gameInfo.innerHTML = "It's your go";
      }
    }
  }
}

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

    draw = true;
  }
}

function choosePlayer() {
  const number = Math.random();
  if (number >= 0.5) {
    currentPlayer = "Player1";
  } else {
    currentPlayer = "Computer";
  }
}

button.addEventListener("click", () => {
  startGame();
});
