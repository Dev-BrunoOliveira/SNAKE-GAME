const gameBoard = document.getElementById("game-board");
const context = gameBoard.getContext("2d");
const scoreElement = document.getElementById("score");

const tileSize = 20;
let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let score = 0;
let dx = 0;
let dy = 0;
let isGameOver = false;

function main() {
  if (isGameOver) {
    alert(
      `Fim de Jogo! Sua pontuação foi: ${score}. Pressione OK para recomeçar.`
    );
    document.location.reload();
    return;
  }

  setTimeout(() => {
    clearBoard();
    drawFood();
    moveSnake();
    drawSnake();
    checkCollision();
    main();
  }, 100);
}

main();

function clearBoard() {
  context.fillStyle = "#ffff";
  context.fillRect(0, 0, gameBoard.width, gameBoard.height);
}

function drawFood() {
  context.fillStyle = "lightgreen";
  context.strokeStyle = "darkgreen";
  context.fillRect(food.x * tileSize, food.y * tileSize, tileSize, tileSize);
  context.strokeRect(food.x * tileSize, food.y * tileSize, tileSize, tileSize);
}

function drawSnake() {
  snake.forEach((part) => {
    context.fillStyle = "lightgreen";
    context.strokeStyle = "darkgreen";
    context.fillRect(part.x * tileSize, part.y * tileSize, tileSize, tileSize);
    context.strokeRect(
      part.x * tileSize,
      part.y * tileSize,
      tileSize,
      tileSize
    );
  });
}

function moveSnake() {
  const head = { x: snake[0].x + dx, y: snake[0].y + dy };
  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreElement.textContent = score;
    generateFood();
  } else {
    snake.pop();
  }
}

function generateFood() {
  food.x = Math.floor(Math.random() * (gameBoard.width / tileSize));
  food.y = Math.floor(Math.random() * (gameBoard.height / tileSize));

  snake.forEach((part) => {
    if (part.x === food.x && part.y === food.y) {
      generateFood();
    }
  });
}

document.addEventListener("keydown", changeDirection);

function changeDirection(event) {
  const KEY_LEFT = 37;
  const KEY_UP = 38;
  const KEY_RIGHT = 39;
  const KEY_DOWN = 40;

  const keyPressed = event.keyCode;

  const goingUp = dy === -1;
  const goingDown = dy === 1;
  const goingRight = dx === 1;
  const goingLeft = dx === -1;

  if (keyPressed === KEY_LEFT && !goingRight) {
    dx = -1;
    dy = 0;
  }
  if (keyPressed === KEY_UP && !goingDown) {
    dx = 0;
    dy = -1;
  }
  if (keyPressed === KEY_RIGHT && !goingLeft) {
    dx = 1;
    dy = 0;
  }
  if (keyPressed === KEY_DOWN && !goingUp) {
    dx = 0;
    dy = 1;
  }
}

function checkCollision() {
  const head = snake[0];
  const boardWidthInTiles = gameBoard.width / tileSize;
  const boardHeightInTiles = gameBoard.height / tileSize;

  if (
    head.x < 0 ||
    head.x >= boardWidthInTiles ||
    head.y < 0 ||
    head.y >= boardHeightInTiles
  ) {
    isGameOver = true;
  }

  for (let i = 1; i < snake.length; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) {
      isGameOver = true;
      break;
    }
  }
}
