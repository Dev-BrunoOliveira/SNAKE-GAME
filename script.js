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

const tileSize = 20;
const boardWidthInTiles = gameBoard.width / tileSize; 
const boardHeightInTiles = gameBoard.height / tileSize; 

let snake, food, score, dx, dy;
let gameInterval = null;

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
    startButton.style.display = 'none';
    if(window.innerWidth <= 600) {
        mobileControls.style.display = 'flex';
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
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, gameBoard.width, gameBoard.height);
}

function drawFood() {
    context.fillStyle = "red";
    context.strokeStyle = "darkred";
    context.fillRect(food.x * tileSize, food.y * tileSize, tileSize, tileSize);
    context.strokeRect(food.x * tileSize, food.y * tileSize, tileSize, tileSize);
}

function drawSnake() {
    snake.forEach((part, index) => {
        context.fillStyle = index === 0 ? "#004d00" : "green";
        context.strokeStyle = "black";
        context.fillRect(part.x * tileSize, part.y * tileSize, tileSize, tileSize);
        context.strokeRect(part.x * tileSize, part.y * tileSize, tileSize, tileSize);
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
        x: Math.floor(Math.random() * boardWidthInTiles),
        y: Math.floor(Math.random() * boardHeightInTiles)
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

    if (head.x < 0 || head.x >= boardWidthInTiles || head.y < 0 || head.y >= boardHeightInTiles) {
        return true;
    }
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            return true;
        }
    }
    return false;
}

function changeDirection(directionKey) {
    if(!gameInterval) return; 

    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;

    const KEY_LEFT = 37;
    const KEY_UP = 38;
    const KEY_RIGHT = 39;
    const KEY_DOWN = 40;

    if (directionKey === KEY_LEFT && !goingRight) { dx = -1; dy = 0; }
    if (directionKey === KEY_UP && !goingDown) { dx = 0; dy = -1; }
    if (directionKey === KEY_RIGHT && !goingLeft) { dx = 1; dy = 0; }
    if (directionKey === KEY_DOWN && !goingUp) { dx = 0; dy = 1; }
}

function handleControl(directionKey) {
    if (!gameInterval) {
        initGame();
    }
    changeDirection(directionKey);
}

document.addEventListener("keydown", e => handleControl(e.keyCode));
upButton.addEventListener('click', () => handleControl(38));
downButton.addEventListener('click', () => handleControl(40));
leftButton.addEventListener('click', () => handleControl(37));
rightButton.addEventListener('click', () => handleControl(39));

startButton.addEventListener("click", initGame);
restartButton.addEventListener("click", initGame);