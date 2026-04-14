const gameBoard = document.getElementById("game-board");
const context = gameBoard.getContext("2d");
const scoreElement = document.getElementById("score");
const startButton = document.getElementById("start-button");
const gameOverElement = document.getElementById("game-over");
const restartButton = document.getElementById("restart-button");

const mobileControls = document.getElementById("mobile-controls");
const upButton = document.getElementById("up-button");
const downButton = document.getElementById("down-button");
const leftButton = document.getElementById("left-button");
const rightButton = document.getElementById("right-button");

const PIXEL_ON = "#43523d"; 
const PIXEL_OFF = "#c7d08f"; 
const tileSize = 20;
const boardWidthInTiles = gameBoard.width / tileSize;
const boardHeightInTiles = gameBoard.height / tileSize;

let snake, food, score, dx, dy;
let gameInterval = null;

// Garante que o desenho seja nítido (pixel art)
gameBoard.style.imageRendering = "pixelated";
gameBoard.style.backgroundColor = PIXEL_OFF;

function initGame() {
  if (gameInterval) {
    clearTimeout(gameInterval);
  }

  snake = [{ x: 10, y: 10 }];
  generateFood();

  score = 0;
  dx = 0;
  dy = 0;
  scoreElement.textContent = score;
  gameOverElement.style.display = "none";
  startButton.style.display = "none";

  if (window.innerWidth <= 600) {
    mobileControls.style.display = "flex";
  }

  main();
}

function main() {
  gameInterval = setTimeout(() => {
    clearBoard();
    moveSnake();

    const isGameOver = checkCollision();

    if (isGameOver) {
      showGameOver();
      drawFood();
      drawSnake();
      return;
    }

    drawFood();
    drawSnake();
    main();
  }, 100);
}

function showGameOver() {
  clearTimeout(gameInterval);
  gameInterval = null;
  gameOverElement.style.display = "flex";
}

function clearBoard() {
  // Preenche com a cor de fundo do LCD
  context.fillStyle = PIXEL_OFF;
  context.fillRect(0, 0, gameBoard.width, gameBoard.height);

  // Moldura interna clássica do Nokia
  context.strokeStyle = PIXEL_ON;
  context.lineWidth = 2;
  context.strokeRect(2, 2, gameBoard.width - 4, gameBoard.height - 4);
}

function drawFood() {
  context.fillStyle = PIXEL_ON;
  // Comida estilo "pixel único" centralizado
  const p = 4;
  context.fillRect(
    food.x * tileSize + p,
    food.y * tileSize + p,
    tileSize - p * 2,
    tileSize - p * 2,
  );
}

function drawSnake() {
  snake.forEach((part, index) => {
    context.fillStyle = PIXEL_ON;

    // Espaçamento de 1px entre os gomos para parecer matriz de pontos
    const p = 1;
    context.fillRect(
      part.x * tileSize + p,
      part.y * tileSize + p,
      tileSize - p * 2,
      tileSize - p * 2,
    );

    // Se for a cabeça, adiciona o detalhe do olho "vazado"
    if (index === 0) {
      context.fillStyle = PIXEL_OFF;
      context.fillRect(part.x * tileSize + 4, part.y * tileSize + 4, 4, 4);
      context.fillRect(part.x * tileSize + 12, part.y * tileSize + 4, 4, 4);
    }
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
  food = {
    x: Math.floor(Math.random() * (boardWidthInTiles - 2)) + 1,
    y: Math.floor(Math.random() * (boardHeightInTiles - 2)) + 1,
  };

  for (const part of snake) {
    if (part.x === food.x && part.y === food.y) {
      generateFood();
      break;
    }
  }
}

function checkCollision() {
  const head = snake[0];

  // Colisão com as bordas (ajustado para a moldura desenhada)
  if (
    head.x < 0 ||
    head.x >= boardWidthInTiles ||
    head.y < 0 ||
    head.y >= boardHeightInTiles
  ) {
    return true;
  }
  // Colisão com o próprio corpo
  for (let i = 1; i < snake.length; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) {
      return true;
    }
  }
  return false;
}

function changeDirection(directionKey) {
  if (!gameInterval && directionKey >= 37 && directionKey <= 40) {
    initGame();
  }

  const goingUp = dy === -1;
  const goingDown = dy === 1;
  const goingRight = dx === 1;
  const goingLeft = dx === -1;

  if (directionKey === 37 && !goingRight) {
    dx = -1;
    dy = 0;
  }
  if (directionKey === 38 && !goingDown) {
    dx = 0;
    dy = -1;
  }
  if (directionKey === 39 && !goingLeft) {
    dx = 1;
    dy = 0;
  }
  if (directionKey === 40 && !goingUp) {
    dx = 0;
    dy = 1;
  }
}

function handleControl(directionKey) {
  changeDirection(directionKey);
}

document.addEventListener("keydown", (e) => handleControl(e.keyCode));
upButton.addEventListener("click", () => handleControl(38));
downButton.addEventListener("click", () => handleControl(40));
leftButton.addEventListener("click", () => handleControl(37));
rightButton.addEventListener("click", () => handleControl(39));

startButton.addEventListener("click", initGame);
restartButton.addEventListener("click", initGame);
