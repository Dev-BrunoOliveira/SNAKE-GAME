const gameBoard = document.getElementById("game-board");
const context = gameBoard.getContext("2d");
const scoreElement = document.getElementById("score");
const startButton = document.getElementById("start-button");
const menuButton = document.getElementById("menu-button");
const gameOverElement = document.getElementById("game-over");
const restartButton = document.getElementById("restart-button");
const goMenuButton = document.getElementById("go-menu-button");
const goTitle = document.getElementById("go-title");
const goScore = document.getElementById("go-score");

const mainMenu = document.getElementById("main-menu");
const gameContainer = document.getElementById("game-container");
const mobileControls = document.getElementById("mobile-controls");
const desktopInstructions = document.getElementById("desktop-instructions");

const btnSnake = document.getElementById("btn-snake");
const btnTetris = document.getElementById("btn-tetris");
const btnAsteroids = document.getElementById("btn-asteroids");

const PIXEL_ON = "#43523d"; 
const PIXEL_OFF = "#c7d08f"; 


gameBoard.style.imageRendering = "pixelated";
gameBoard.style.backgroundColor = PIXEL_OFF;

let currentGame = null;
let currentType = null;
let isGlobalPaused = false;

// --- AUDIO SYNTHESIS ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type, frequency, duration, type2) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  if(type2) {
    osc.frequency.exponentialRampToValueAtTime(type2, audioCtx.currentTime + duration);
  }
  
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playNoise(duration) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  
  // Basic lowpass filter for explosion sound
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1000;

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  noise.start();
}

const Sounds = {
  coin: () => playSound('square', 880, 0.1, 1200),
  blip: () => playSound('square', 440, 0.05),
  drop: () => playSound('square', 200, 0.1, 100),
  line: () => { playSound('square', 880, 0.1); setTimeout(()=>playSound('square', 1200, 0.2), 100); },
  laser: () => playSound('sawtooth', 880, 0.1, 200),
  explosion: () => playNoise(0.3),
  gameOver: () => playSound('square', 200, 0.5, 50)
};

// --- HIGH SCORES ---
function getHighScores() {
  return {
    snake: parseInt(localStorage.getItem('hs-snake')) || 0,
    tetris: parseInt(localStorage.getItem('hs-tetris')) || 0,
    asteroids: parseInt(localStorage.getItem('hs-asteroids')) || 0
  };
}

function saveHighScore(game, score) {
  const hs = getHighScores();
  if (score > hs[game]) {
    localStorage.setItem(`hs-${game}`, score);
    updateHighScoresUI();
  }
}

function updateHighScoresUI() {
  const hs = getHighScores();
  document.getElementById('hs-snake').textContent = hs.snake;
  document.getElementById('hs-tetris').textContent = hs.tetris;
  document.getElementById('hs-asteroids').textContent = hs.asteroids;
}
updateHighScoresUI();

// --- GAME MANAGEMENT ---
function clearBoard() {
  context.fillStyle = PIXEL_OFF;
  context.fillRect(0, 0, gameBoard.width, gameBoard.height);
  context.strokeStyle = PIXEL_ON;
  context.lineWidth = 2;
  context.strokeRect(2, 2, gameBoard.width - 4, gameBoard.height - 4);
}

function drawPause() {
  context.fillStyle = 'rgba(199, 208, 143, 0.8)'; 
  context.fillRect(0, 0, gameBoard.width, gameBoard.height);
  
  context.fillStyle = PIXEL_ON;
  context.font = '30px "Press Start 2P"';
  context.textAlign = 'center';
  context.fillText('PAUSED', gameBoard.width/2, gameBoard.height/2 + 10);
}

function togglePause() {
  if (!currentGame || currentGame.isGameOver) return;
  isGlobalPaused = !isGlobalPaused;
  if (isGlobalPaused) {
    drawPause();
  } else {
    // Resume game loop
    if (currentGame.update) requestAnimationFrame(currentGame.update);
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'p' || e.key === 'Escape') togglePause();
});


function showMenu() {
  if (currentGame) {
    currentGame.stop();
    currentGame = null;
  }
  isGlobalPaused = false;
  mainMenu.classList.remove("hidden");
  gameContainer.classList.add("hidden");
  mobileControls.classList.add("hidden");
  gameOverElement.classList.add("hidden");
  updateHighScoresUI();
  
  document.querySelectorAll('.controls-group').forEach(el => el.classList.add('hidden'));
}

function startGame(gameType) {
  audioCtx.resume();
  isGlobalPaused = false;
  currentType = gameType;
  mainMenu.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  gameOverElement.classList.add("hidden");
  startButton.style.display = "none";
  
  if (window.innerWidth <= 600) {
    mobileControls.classList.remove("hidden");
    document.querySelectorAll('.controls-group').forEach(el => el.classList.add('hidden'));
    document.getElementById(`controls-${gameType}`).classList.remove('hidden');
  } else {
    // Desktop instructions
    if (gameType === 'snake') {
      desktopInstructions.innerHTML = 'MOVER: Setas<br>PAUSAR: P / ESC';
    } else if (gameType === 'tetris') {
      desktopInstructions.innerHTML = 'MOVER: Esq/Dir<br>ROTACIONAR: Cima<br>SOFT DROP: Baixo<br>HARD DROP: Espaço<br>PAUSAR: P / ESC';
    } else if (gameType === 'asteroids') {
      desktopInstructions.innerHTML = 'ROTACIONAR: Esq/Dir<br>PROPULSÃO: Cima<br>ATIRAR: Espaço<br>PAUSAR: P / ESC';
    }
  }

  scoreElement.textContent = "0";

  if (gameType === 'snake') currentGame = new SnakeGame();
  else if (gameType === 'tetris') currentGame = new TetrisGame();
  else if (gameType === 'asteroids') currentGame = new AsteroidsGame();

  currentGame.start();
}

function handleGameOver(score) {
  currentGame.isGameOver = true;
  saveHighScore(currentType, score);
  goScore.textContent = score;
  gameOverElement.classList.remove("hidden");
  Sounds.gameOver();
}

btnSnake.addEventListener("click", () => startGame('snake'));
btnTetris.addEventListener("click", () => startGame('tetris'));
btnAsteroids.addEventListener("click", () => startGame('asteroids'));

menuButton.addEventListener("click", showMenu);
goMenuButton.addEventListener("click", showMenu);

restartButton.addEventListener("click", () => {
  gameOverElement.classList.add("hidden");
  if (currentGame) currentGame.start();
});

startButton.addEventListener("click", () => {
  if (currentGame) currentGame.start();
});

// --- SNAKE GAME ---
class SnakeGame {
  constructor() {
    this.tileSize = 20;
    this.boardWidthInTiles = gameBoard.width / this.tileSize;
    this.boardHeightInTiles = gameBoard.height / this.tileSize;
    this.interval = null;
    this.isGameOver = false;
    
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleUp = () => this.changeDirection(38);
    this.handleDown = () => this.changeDirection(40);
    this.handleLeft = () => this.changeDirection(37);
    this.handleRight = () => this.changeDirection(39);
  }

  start() {
    this.stop();
    this.isGameOver = false;
    this.snake = [{ x: 10, y: 10 }];
    this.score = 0;
    this.dx = 0;
    this.dy = 0;
    scoreElement.textContent = this.score;
    this.generateFood();
    
    document.addEventListener("keydown", this.handleKeyDown);
    document.getElementById("up-button").addEventListener("click", this.handleUp);
    document.getElementById("down-button").addEventListener("click", this.handleDown);
    document.getElementById("left-button").addEventListener("click", this.handleLeft);
    document.getElementById("right-button").addEventListener("click", this.handleRight);

    this.loop();
  }

  stop() {
    if (this.interval) clearTimeout(this.interval);
    document.removeEventListener("keydown", this.handleKeyDown);
    document.getElementById("up-button").removeEventListener("click", this.handleUp);
    document.getElementById("down-button").removeEventListener("click", this.handleDown);
    document.getElementById("left-button").removeEventListener("click", this.handleLeft);
    document.getElementById("right-button").removeEventListener("click", this.handleRight);
  }

  loop() {
    const speed = Math.max(50, 150 - Math.floor(this.score / 50) * 10);
    
    this.interval = setTimeout(() => {
      if (isGlobalPaused) {
        this.loop();
        return;
      }

      clearBoard();
      this.moveSnake();
      
      if (this.checkCollision()) {
        this.stop();
        handleGameOver(this.score);
        this.drawFood();
        this.drawSnake();
        return;
      }

      this.drawFood();
      this.drawSnake();
      this.loop();
    }, speed);
  }

  drawFood() {
    context.fillStyle = PIXEL_ON;
    const p = 4;
    context.fillRect(
      this.food.x * this.tileSize + p,
      this.food.y * this.tileSize + p,
      this.tileSize - p * 2,
      this.tileSize - p * 2
    );
  }

  drawSnake() {
    this.snake.forEach((part, index) => {
      context.fillStyle = PIXEL_ON;
      const p = 1;
      context.fillRect(
        part.x * this.tileSize + p,
        part.y * this.tileSize + p,
        this.tileSize - p * 2,
        this.tileSize - p * 2
      );

      if (index === 0) {
        context.fillStyle = PIXEL_OFF;
        context.fillRect(part.x * this.tileSize + 4, part.y * this.tileSize + 4, 4, 4);
        context.fillRect(part.x * this.tileSize + 12, part.y * this.tileSize + 4, 4, 4);
      }
    });
  }

  moveSnake() {
    if (this.dx === 0 && this.dy === 0) return;

    const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };
    this.snake.unshift(head);
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      scoreElement.textContent = this.score;
      Sounds.coin();
      this.generateFood();
    } else {
      this.snake.pop();
    }
  }

  generateFood() {
    this.food = {
      x: Math.floor(Math.random() * (this.boardWidthInTiles - 2)) + 1,
      y: Math.floor(Math.random() * (this.boardHeightInTiles - 2)) + 1,
    };
    for (const part of this.snake) {
      if (part.x === this.food.x && part.y === this.food.y) {
        this.generateFood();
        break;
      }
    }
  }

  checkCollision() {
    const head = this.snake[0];
    if (head.x < 0 || head.x >= this.boardWidthInTiles || head.y < 0 || head.y >= this.boardHeightInTiles) return true;
    for (let i = 1; i < this.snake.length; i++) {
      if (this.snake[i].x === head.x && this.snake[i].y === head.y) return true;
    }
    return false;
  }

  handleKeyDown(e) {
    if (e.keyCode >= 37 && e.keyCode <= 40) {
      e.preventDefault(); // prevent scrolling
      if (!isGlobalPaused) this.changeDirection(e.keyCode);
    }
  }

  changeDirection(key) {
    const goingUp = this.dy === -1;
    const goingDown = this.dy === 1;
    const goingRight = this.dx === 1;
    const goingLeft = this.dx === -1;

    if (key === 37 && !goingRight) { this.dx = -1; this.dy = 0; }
    if (key === 38 && !goingDown) { this.dx = 0; this.dy = -1; }
    if (key === 39 && !goingLeft) { this.dx = 1; this.dy = 0; }
    if (key === 40 && !goingUp) { this.dx = 0; this.dy = 1; }
  }
}

class TetrisGame {
  constructor() {
    this.COLS = 10;
    this.ROWS = 20;
    this.BLOCK_SIZE = 20; 
    this.OFFSET_X = (gameBoard.width - (this.COLS * this.BLOCK_SIZE)) / 2; 
    this.interval = null;
    this.isGameOver = false;
    
    this.SHAPES = [
      [],
      [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], // I
      [[1,0,0], [1,1,1], [0,0,0]], // J
      [[0,0,1], [1,1,1], [0,0,0]], // L
      [[1,1], [1,1]], // O
      [[0,1,1], [1,1,0], [0,0,0]], // S
      [[0,1,0], [1,1,1], [0,0,0]], // T
      [[1,1,0], [0,1,1], [0,0,0]], // Z
    ];

    this.bag = [];
    this.nextPieceTypeId = null;

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleUp = () => this.playerRotate(1);
    this.handleDown = () => this.playerDrop();
    this.handleLeft = () => this.playerMove(-1);
    this.handleRight = () => this.playerMove(1);
    this.handleDrop = () => this.hardDrop();
  }

  start() {
    this.stop();
    this.isGameOver = false;
    this.board = Array.from({ length: this.ROWS }, () => Array(this.COLS).fill(0));
    this.score = 0;
    scoreElement.textContent = this.score;
    this.dropCounter = 0;
    this.dropInterval = 800;
    this.lastTime = 0;
    
    this.bag = [];
    this.nextPieceTypeId = this.getRandomType();
    this.spawnPiece();
    
    document.addEventListener("keydown", this.handleKeyDown);
    const bindBtn = (id, fn) => {
      const btn = document.getElementById(id);
      btn.addEventListener("touchstart", (e)=>{e.preventDefault(); if(!isGlobalPaused) fn();});
      btn.addEventListener("mousedown", (e)=>{e.preventDefault(); if(!isGlobalPaused) fn();});
    };
    bindBtn("tetris-up-button", this.handleUp);
    bindBtn("tetris-down-button", this.handleDown);
    bindBtn("tetris-left-button", this.handleLeft);
    bindBtn("tetris-right-button", this.handleRight);
    bindBtn("tetris-space-button", this.handleDrop);

    this.update = this.update.bind(this);
    this.interval = requestAnimationFrame(this.update);
  }

  stop() {
    if (this.interval) cancelAnimationFrame(this.interval);
    document.removeEventListener("keydown", this.handleKeyDown);
  }

  getRandomType() {
    if (this.bag.length === 0) {
      this.bag = [1, 2, 3, 4, 5, 6, 7];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop();
  }

  spawnPiece() {
    const typeId = this.nextPieceTypeId;
    this.nextPieceTypeId = this.getRandomType();
    
    this.piece = {
      shape: this.SHAPES[typeId].map(row => [...row]), 
      x: Math.floor(this.COLS / 2) - Math.floor(this.SHAPES[typeId][0].length / 2),
      y: 0
    };
    if (this.collide()) {
      this.isGameOver = true;
      handleGameOver(this.score);
    }
  }

  collide() {
    for (let y = 0; y < this.piece.shape.length; ++y) {
      for (let x = 0; x < this.piece.shape[y].length; ++x) {
        if (this.piece.shape[y][x] !== 0 &&
           (this.board[y + this.piece.y] && this.board[y + this.piece.y][x + this.piece.x]) !== 0) {
          return true;
        }
      }
    }
    return false;
  }

  merge() {
    this.piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          this.board[y + this.piece.y][x + this.piece.x] = value;
        }
      });
    });
    Sounds.drop();
  }

  rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
      for (let x = 0; x < y; ++x) {
        [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
      }
    }
    if (dir > 0) matrix.forEach(row => row.reverse());
    else matrix.reverse();
  }

  playerRotate(dir) {
    const pos = this.piece.x;
    let offset = 1;
    this.rotate(this.piece.shape, dir);
    while (this.collide()) {
      this.piece.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > this.piece.shape[0].length) {
        this.rotate(this.piece.shape, -dir);
        this.piece.x = pos;
        return;
      }
    }
    Sounds.blip();
  }

  playerMove(dir) {
    this.piece.x += dir;
    if (this.collide()) this.piece.x -= dir;
    else Sounds.blip();
  }

  playerDrop() {
    this.piece.y++;
    if (this.collide()) {
      this.piece.y--;
      this.merge();
      this.spawnPiece();
      this.sweep();
    }
    this.dropCounter = 0;
  }
  
  hardDrop() {
    while (!this.collide()) {
      this.piece.y++;
    }
    this.piece.y--;
    this.merge();
    this.spawnPiece();
    this.sweep();
    this.dropCounter = 0;
  }

  sweep() {
    let rowCount = 1;
    let cleared = false;
    outer: for (let y = this.ROWS - 1; y >= 0; --y) {
      for (let x = 0; x < this.COLS; ++x) {
        if (this.board[y][x] === 0) continue outer;
      }
      const row = this.board.splice(y, 1)[0].fill(0);
      this.board.unshift(row);
      ++y;
      this.score += rowCount * 10;
      rowCount *= 2;
      cleared = true;
    }
    
    if (cleared) {
      scoreElement.textContent = this.score;
      this.dropInterval = Math.max(100, 800 - (Math.floor(this.score / 100) * 50));
      Sounds.line();
    }
  }

  drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          context.fillStyle = PIXEL_ON;
          const px = this.OFFSET_X + (x + offset.x) * this.BLOCK_SIZE;
          const py = (y + offset.y) * this.BLOCK_SIZE;
          const p = 1;
          context.fillRect(px + p, py + p, this.BLOCK_SIZE - p*2, this.BLOCK_SIZE - p*2);
        }
      });
    });
  }

  update(time = 0) {
    if (isGlobalPaused || this.isGameOver) return;
    
    const deltaTime = time - this.lastTime;
    this.lastTime = time;
    this.dropCounter += deltaTime;

    if (this.dropCounter > this.dropInterval) {
      this.playerDrop();
    }

    clearBoard();
    
    context.strokeStyle = PIXEL_ON;
    context.lineWidth = 1;
    context.strokeRect(this.OFFSET_X - 1, -1, this.COLS * this.BLOCK_SIZE + 2, this.ROWS * this.BLOCK_SIZE + 2);

    this.drawMatrix(this.board, { x: 0, y: 0 });
    this.drawMatrix(this.piece.shape, { x: this.piece.x, y: this.piece.y });
    
    // Draw NEXT piece preview
    context.fillStyle = PIXEL_ON;
    context.font = '12px "Press Start 2P"';
    context.textAlign = 'left';
    context.fillText('NEXT', this.OFFSET_X + (this.COLS * this.BLOCK_SIZE) + 15, 30);
    
    const nextShape = this.SHAPES[this.nextPieceTypeId];
    nextShape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          const px = this.OFFSET_X + (this.COLS * this.BLOCK_SIZE) + 20 + (x * 12); 
          const py = 45 + (y * 12);
          context.fillRect(px, py, 10, 10);
        }
      });
    });
    
    this.interval = requestAnimationFrame(this.update);
  }

  handleKeyDown(e) {
    if (isGlobalPaused || this.isGameOver) return;
    if (e.keyCode >= 32 && e.keyCode <= 40) e.preventDefault();
    switch(e.keyCode) {
      case 37: this.playerMove(-1); break;
      case 39: this.playerMove(1); break;
      case 40: this.playerDrop(); break;
      case 38: this.playerRotate(1); break;
      case 32: this.hardDrop(); break;
    }
  }
}

// --- ASTEROIDS GAME ---
class AsteroidsGame {
  constructor() {
    this.WIDTH = gameBoard.width;
    this.HEIGHT = gameBoard.height;
    this.interval = null;
    this.isGameOver = false;
    
    this.keys = {};
    this.handleKeyDown = (e) => { this.keys[e.code] = true; if(e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') e.preventDefault(); };
    this.handleKeyUp = (e) => { this.keys[e.code] = false; };
  }

  start() {
    this.stop();
    this.isGameOver = false;
    this.score = 0;
    scoreElement.textContent = this.score;
    
    this.ship = { x: this.WIDTH/2, y: this.HEIGHT/2, vx: 0, vy: 0, radius: 8, angle: -Math.PI/2 };
    this.bullets = [];
    this.asteroids = this.generateAsteroids(4);
    this.particles = [];

    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);
    
    const bindBtn = (id, code) => {
      const btn = document.getElementById(id);
      btn.addEventListener("touchstart", (e)=>{e.preventDefault(); this.keys[code] = true;});
      btn.addEventListener("touchend", (e)=>{e.preventDefault(); this.keys[code] = false;});
      btn.addEventListener("mousedown", (e)=>{e.preventDefault(); this.keys[code] = true;});
      btn.addEventListener("mouseup", ()=>{this.keys[code] = false;});
      btn.addEventListener("mouseleave", ()=>{this.keys[code] = false;});
    };
    bindBtn("ast-left-button", "ArrowLeft");
    bindBtn("ast-right-button", "ArrowRight");
    bindBtn("ast-up-button", "ArrowUp");
    bindBtn("ast-space-button", "Space");

    this.lastShoot = 0;
    this.update = this.update.bind(this);
    this.interval = requestAnimationFrame(this.update);
  }

  stop() {
    if (this.interval) cancelAnimationFrame(this.interval);
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
  }

  generateAsteroids(num) {
    const asteroids = [];
    for (let i = 0; i < num; i++) {
      let x, y;
      do {
        x = Math.random() * this.WIDTH;
        y = Math.random() * this.HEIGHT;
      } while (Math.hypot(x - this.WIDTH/2, y - this.HEIGHT/2) < 50);

      const points = [];
      const numPoints = 8 + Math.random() * 4;
      for (let j = 0; j < numPoints; j++) points.push(Math.random() * 0.4 + 0.8);

      asteroids.push({
        x, y, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
        radius: 25, angle: 0, size: 3, points
      });
    }
    return asteroids;
  }

  createExplosion(x, y, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, life: 20 + Math.random() * 10
      });
    }
    Sounds.explosion();
  }

  update(time = 0) {
    if (isGlobalPaused || this.isGameOver) {
      this.lastShoot = time; 
      return;
    }

    // Input
    if (this.keys['ArrowLeft']) this.ship.angle -= 0.1;
    if (this.keys['ArrowRight']) this.ship.angle += 0.1;
    if (this.keys['ArrowUp']) {
      this.ship.vx += Math.cos(this.ship.angle) * 0.15;
      this.ship.vy += Math.sin(this.ship.angle) * 0.15;
    } else {
      this.ship.vx *= 0.99;
      this.ship.vy *= 0.99;
    }
    
    if (this.keys['Space'] && time - this.lastShoot > 200) {
      if (this.bullets.length < 5) {
        this.bullets.push({
          x: this.ship.x + Math.cos(this.ship.angle) * this.ship.radius,
          y: this.ship.y + Math.sin(this.ship.angle) * this.ship.radius,
          vx: Math.cos(this.ship.angle) * 5, vy: Math.sin(this.ship.angle) * 5, life: 60
        });
        Sounds.laser();
        this.lastShoot = time;
      }
    }

    // Move Ship
    this.ship.x += this.ship.vx; this.ship.y += this.ship.vy;
    if (this.ship.x < 0) this.ship.x = this.WIDTH;
    if (this.ship.x > this.WIDTH) this.ship.x = 0;
    if (this.ship.y < 0) this.ship.y = this.HEIGHT;
    if (this.ship.y > this.HEIGHT) this.ship.y = 0;

    // Move Bullets
    this.bullets = this.bullets.filter(b => b.life > 0);
    this.bullets.forEach(b => {
      b.x += b.vx; b.y += b.vy; b.life--;
      if (b.x < 0) b.x = this.WIDTH;
      if (b.x > this.WIDTH) b.x = 0;
      if (b.y < 0) b.y = this.HEIGHT;
      if (b.y > this.HEIGHT) b.y = 0;
    });

    // Move Asteroids
    this.asteroids.forEach(a => {
      a.x += a.vx; a.y += a.vy;
      if (a.x < -a.radius) a.x = this.WIDTH + a.radius;
      if (a.x > this.WIDTH + a.radius) a.x = -a.radius;
      if (a.y < -a.radius) a.y = this.HEIGHT + a.radius;
      if (a.y > this.HEIGHT + a.radius) a.y = -a.radius;
    });

    // Move Particles
    this.particles = this.particles.filter(p => p.life > 0);
    this.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });

    // Collisions
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      for (let j = this.asteroids.length - 1; j >= 0; j--) {
        const b = this.bullets[i], a = this.asteroids[j];
        if (!b || !a) continue;
        if (Math.hypot(b.x - a.x, b.y - a.y) < a.radius) {
          this.bullets.splice(i, 1);
          const hit = this.asteroids.splice(j, 1)[0];
          this.score += hit.size * 10;
          scoreElement.textContent = this.score;
          this.createExplosion(hit.x, hit.y, 8);
          
          if (hit.size > 1) {
            for (let k = 0; k < 2; k++) {
              this.asteroids.push({
                x: hit.x, y: hit.y, vx: (Math.random()-0.5)*3, vy: (Math.random()-0.5)*3,
                radius: hit.radius/2, angle: 0, size: hit.size - 1, points: hit.points
              });
            }
          }
          break;
        }
      }
    }

    let died = false;
    this.asteroids.forEach(a => {
      if (Math.hypot(this.ship.x - a.x, this.ship.y - a.y) < a.radius + this.ship.radius - 2) {
        died = true;
      }
    });

    if (this.asteroids.length === 0) {
      this.asteroids = this.generateAsteroids(4 + Math.floor(this.score / 100));
    }

    this.draw();

    if (died) {
      this.createExplosion(this.ship.x, this.ship.y, 20);
      this.draw(); 
      this.stop();
      handleGameOver(this.score);
    } else {
      this.interval = requestAnimationFrame(this.update);
    }
  }

  draw() {
    clearBoard();
    context.strokeStyle = PIXEL_ON;
    context.fillStyle = PIXEL_ON;

    // Ship
    context.save();
    context.translate(this.ship.x, this.ship.y);
    context.rotate(this.ship.angle);
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(this.ship.radius, 0);
    context.lineTo(-this.ship.radius, this.ship.radius * 0.7);
    context.lineTo(-this.ship.radius * 0.5, 0);
    context.lineTo(-this.ship.radius, -this.ship.radius * 0.7);
    context.closePath();
    context.stroke();
    // Thrust
    if (this.keys['ArrowUp'] && Math.random() > 0.5) {
      context.beginPath();
      context.moveTo(-this.ship.radius * 0.6, 0);
      context.lineTo(-this.ship.radius * 1.5, (Math.random()-0.5)*4);
      context.stroke();
    }
    context.restore();

    // Asteroids
    context.lineWidth = 2;
    this.asteroids.forEach(a => {
      context.beginPath();
      for (let i = 0; i < a.points.length; i++) {
        const angle = a.angle + (i * Math.PI * 2) / a.points.length;
        const radius = a.radius * a.points[i];
        const x = a.x + Math.cos(angle) * radius;
        const y = a.y + Math.sin(angle) * radius;
        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.closePath();
      context.stroke();
    });
  
    this.bullets.forEach(b => {
      context.fillRect(b.x - 1.5, b.y - 1.5, 3, 3);
    });

    this.particles.forEach(p => {
      if (Math.random() > 0.3) context.fillRect(p.x, p.y, 2, 2);
    });
  }
}
