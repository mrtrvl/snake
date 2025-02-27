document.addEventListener('DOMContentLoaded', () => {
  // Audio Context
  let audioCtx = null;
  let audioInitialized = false;

  // Initialize audio context on first user interaction
  function initAudio() {
    if (audioInitialized) return;

    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioInitialized = true;
    } catch (error) {
      console.log('Audio initialization failed:', error);
    }
  }

  // Function to play a beep sound
  function playBeep(frequency, duration, type = 'sine') {
    if (!audioCtx || !audioInitialized) {
      try {
        initAudio();
      } catch (error) {
        console.log('Could not initialize audio:', error);
        return;
      }
    }

    try {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  }

  // Initialize audio on various user interactions
  document.addEventListener('touchstart', initAudio, { once: true });
  document.addEventListener('click', initAudio, { once: true });
  document.addEventListener('keydown', initAudio, { once: true });

  // Resume audio context on visibility change (for mobile browsers)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && audioCtx) {
      audioCtx.resume();
    }
  });

  // Game elements
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreElement = document.getElementById('score');
  const finalScoreElement = document.getElementById('final-score');
  const messageElement = document.getElementById('message');
  const restartButton = document.getElementById('restart');
  const upButton = document.getElementById('up');
  const downButton = document.getElementById('down');
  const leftButton = document.getElementById('left');
  const rightButton = document.getElementById('right');

  // Sound elements
  const eatSound = document.getElementById('eatSound');
  const specialSound = document.getElementById('specialSound');
  const gameOverSound = document.getElementById('gameOverSound');
  const startSound = document.getElementById('startSound');

  // Sound functions
  function playSound(sound) {
    sound.currentTime = 0;
    sound.play().catch(error => console.log('Sound play failed:', error));
  }

  // Game variables
  let score = 0;
  let gameSpeed = 200; // Changed from 100 to 200 (slower)
  let gameActive = true;

  // Base size and scaling
  const BASE_SIZE = 400;
  const BASE_GRID = 20;
  let gridSize = BASE_GRID;
  let tileCount = BASE_SIZE / BASE_GRID;

  // Snake variables
  const snake = {
    x: 10,
    y: 10,
    color: '#4CAF50',
    speedX: 0,
    speedY: 0,
    tail: [],
    tailLength: 3
  };

  // Function to update canvas size
  function updateCanvasSize() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const scale = Math.min(containerWidth / BASE_SIZE, 1);

    // Update canvas size
    canvas.width = BASE_SIZE * scale;
    canvas.height = BASE_SIZE * scale;

    // Update grid size
    gridSize = BASE_GRID * scale;

    // Redraw if game is already running
    if (gameActive && (snake.speedX !== 0 || snake.speedY !== 0)) {
      clearCanvas();
      drawFood();
      drawBirthdayItems();
      drawSnake();
      drawMessages();
    }
  }

  // Call once at start and add resize listener
  updateCanvasSize();
  window.addEventListener('resize', updateCanvasSize);

  // Food variables
  let food = generateFood();

  // Special birthday items
  let birthdayItems = [];
  const birthdayItemsImages = [
    { emoji: '🎁', points: 5 },
    { emoji: '🎂', points: 7 },
    { emoji: '🎈', points: 3 }
  ];

  // Variable to keep track of player name (Alexander)
  const playerName = "Alexander";

  // Birthday messages for when Alexander collects special items
  const birthdayMessages = [
    "Palju õnne sünnipäevaks, Alexander!",
    "Sa oled äge, Alexander!",
    "Suurepärane ussi juhtimisoskus, Alexander!",
    "Tubli töö, sünnipäevalaps!",
    "Sa oled 8-aastane ja väga osav selles mängus!"
  ];

  let currentMessage = "";
  let messageTimer = 0;

  // Game initialization
  function init() {
    // Reset all game state
    score = 0;
    scoreElement.textContent = score;
    snake.x = 10;
    snake.y = 10;
    snake.speedX = 0;
    snake.speedY = 0;
    snake.tail = [];
    snake.tailLength = 3;
    food = generateFood();
    birthdayItems = [];
    gameActive = true;
    gameSpeed = 200; // Reset speed to initial value
    messageElement.style.display = 'none';

    // Clear the canvas and redraw initial state
    clearCanvas();
    drawFood();
    drawSnake();

    // Show initial message
    currentMessage = "Vajuta nooleklahvi või nuppu alustamiseks, Alexander!";
    messageTimer = 200;
    drawMessages();
  }

  // Generate food at a random position
  function generateFood() {
    // Make sure food doesn't spawn on snake
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount),
        color: '#FF5722'
      };
    } while (checkCollision(newFood.x, newFood.y));

    return newFood;
  }

  // Generate special birthday item
  function generateBirthdayItem() {
    if (birthdayItems.length < 2 && Math.random() < 0.3) {
      const randomItem = birthdayItemsImages[Math.floor(Math.random() * birthdayItemsImages.length)];

      let newItem;
      do {
        newItem = {
          x: Math.floor(Math.random() * tileCount),
          y: Math.floor(Math.random() * tileCount),
          emoji: randomItem.emoji,
          points: randomItem.points,
          timeLeft: 100 // Will disappear after some time
        };
      } while (checkCollision(newItem.x, newItem.y) ||
        (newItem.x === food.x && newItem.y === food.y));

      birthdayItems.push(newItem);
    }
  }

  // Check collision with any part of the snake
  function checkCollision(x, y) {
    // Check collision with snake head
    if (snake.x === x && snake.y === y) {
      return true;
    }

    // Check collision with snake body
    for (let i = 0; i < snake.tail.length; i++) {
      if (snake.tail[i].x === x && snake.tail[i].y === y) {
        return true;
      }
    }

    return false;
  }

  // Main game loop
  function gameLoop() {
    if (!gameActive) return;

    setTimeout(() => {
      clearCanvas();
      moveSnake();
      checkCollisions();
      drawFood();
      drawBirthdayItems();
      drawSnake();
      drawMessages();

      // Check for birthday item spawning
      if (Math.random() < 0.02) {
        generateBirthdayItem();
      }

      // Update timer for birthday items
      updateBirthdayItems();

      // Continue the game loop if active
      if (gameActive) {
        gameLoop();
      }
    }, gameSpeed);
  }

  // Clear the canvas
  function clearCanvas() {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add a subtle grid pattern
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;

    for (let i = 0; i < tileCount; i++) {
      ctx.beginPath();
      ctx.moveTo(i * gridSize, 0);
      ctx.lineTo(i * gridSize, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * gridSize);
      ctx.lineTo(canvas.width, i * gridSize);
      ctx.stroke();
    }
  }

  // Move the snake
  function moveSnake() {
    // Only add to tail and move if the snake is actually moving
    if (snake.speedX !== 0 || snake.speedY !== 0) {
      // Add current position to the tail
      snake.tail.unshift({ x: snake.x, y: snake.y });

      // Remove tail if longer than it should be
      if (snake.tail.length > snake.tailLength) {
        snake.tail.pop();
      }

      // Move the head
      snake.x += snake.speedX;
      snake.y += snake.speedY;

      // Wrap around the edges of the canvas
      if (snake.x < 0) snake.x = tileCount - 1;
      if (snake.x >= tileCount) snake.x = 0;
      if (snake.y < 0) snake.y = tileCount - 1;
      if (snake.y >= tileCount) snake.y = 0;
    }
  }

  // Check for collisions with food, special items, and the snake itself
  function checkCollisions() {
    // Check collision with food
    if (snake.x === food.x && snake.y === food.y) {
      // Play eat sound
      playBeep(880, 0.1);

      // Increase the tail length
      snake.tailLength += 1;

      // Increase score
      score += 1;
      scoreElement.textContent = score;

      // Spawn new food
      food = generateFood();

      // Speed up the game slightly (but not too much)
      if (gameSpeed > 80) { // Changed from 50 to 80 (won't get as fast)
        gameSpeed -= 0.5; // Changed from 1 to 0.5 (slower acceleration)
      }
    }

    // Check collision with birthday items
    for (let i = birthdayItems.length - 1; i >= 0; i--) {
      const item = birthdayItems[i];
      if (snake.x === item.x && snake.y === item.y) {
        // Play special sound
        playBeep(1760, 0.2, 'square');

        // Increase the tail length
        snake.tailLength += 1;

        // Increase score based on item value
        score += item.points;
        scoreElement.textContent = score;

        // Show a birthday message
        showBirthdayMessage();

        // Remove the item
        birthdayItems.splice(i, 1);
      }
    }

    // Check collision with the snake's tail
    for (let i = 1; i < snake.tail.length; i++) {
      if (snake.x === snake.tail[i].x && snake.y === snake.tail[i].y) {
        gameOver();
      }
    }
  }

  // Show a random birthday message
  function showBirthdayMessage() {
    currentMessage = birthdayMessages[Math.floor(Math.random() * birthdayMessages.length)];
    messageTimer = 50; // Show for 50 game cycles
  }

  // Update special birthday items
  function updateBirthdayItems() {
    for (let i = birthdayItems.length - 1; i >= 0; i--) {
      birthdayItems[i].timeLeft--;

      // Remove if time's up
      if (birthdayItems[i].timeLeft <= 0) {
        birthdayItems.splice(i, 1);
      }
    }
  }

  // Draw the food
  function drawFood() {
    ctx.fillStyle = food.color;
    ctx.beginPath();
    const radius = gridSize / 2;
    ctx.arc(
      food.x * gridSize + radius,
      food.y * gridSize + radius,
      radius - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // Draw birthday special items
  function drawBirthdayItems() {
    birthdayItems.forEach(item => {
      ctx.font = `${gridSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        item.emoji,
        item.x * gridSize + gridSize / 2,
        item.y * gridSize + gridSize / 2
      );

      // Add a pulsating effect to make items stand out
      if (item.timeLeft < 30) {
        const opacity = item.timeLeft / 30;
        ctx.strokeStyle = `rgba(255, 87, 34, ${opacity})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          item.x * gridSize + 2,
          item.y * gridSize + 2,
          gridSize - 4,
          gridSize - 4
        );
      }
    });
  }

  // Draw the snake
  function drawSnake() {
    // Draw the head first
    ctx.fillStyle = snake.color;
    ctx.fillRect(
      snake.x * gridSize,
      snake.y * gridSize,
      gridSize,
      gridSize
    );

    // Draw the snake's tail
    for (let i = 0; i < snake.tail.length; i++) {
      // Calculate color gradient for tail segments
      const segmentIndex = i / snake.tail.length;
      const red = Math.floor(76 + segmentIndex * 100);
      const green = Math.floor(175 + segmentIndex * 30);
      const blue = Math.floor(80 + segmentIndex * 50);

      ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
      ctx.fillRect(
        snake.tail[i].x * gridSize + 1,
        snake.tail[i].y * gridSize + 1,
        gridSize - 2,
        gridSize - 2
      );

      // Add snake pattern
      ctx.fillStyle = `rgba(0, 0, 0, 0.1)`;
      if (i % 2 === 0) {
        ctx.fillRect(
          snake.tail[i].x * gridSize + gridSize / 2,
          snake.tail[i].y * gridSize + 1,
          gridSize / 2 - 1,
          gridSize - 2
        );
      } else {
        ctx.fillRect(
          snake.tail[i].x * gridSize + 1,
          snake.tail[i].y * gridSize + 1,
          gridSize / 2 - 1,
          gridSize - 2
        );
      }
    }

    // Draw snake head
    ctx.fillStyle = snake.color;
    ctx.fillRect(
      snake.x * gridSize,
      snake.y * gridSize,
      gridSize,
      gridSize
    );

    // Draw snake eyes
    const eyeSize = gridSize / 5;
    ctx.fillStyle = 'white';

    // Eyes position based on direction
    let leftEyeX, leftEyeY, rightEyeX, rightEyeY;

    if (snake.speedX === 1) {
      // Moving right
      leftEyeX = snake.x * gridSize + gridSize - eyeSize * 2;
      leftEyeY = snake.y * gridSize + eyeSize;
      rightEyeX = snake.x * gridSize + gridSize - eyeSize * 2;
      rightEyeY = snake.y * gridSize + gridSize - eyeSize * 2;
    } else if (snake.speedX === -1) {
      // Moving left
      leftEyeX = snake.x * gridSize + eyeSize;
      leftEyeY = snake.y * gridSize + eyeSize;
      rightEyeX = snake.x * gridSize + eyeSize;
      rightEyeY = snake.y * gridSize + gridSize - eyeSize * 2;
    } else if (snake.speedY === -1) {
      // Moving up
      leftEyeX = snake.x * gridSize + eyeSize;
      leftEyeY = snake.y * gridSize + eyeSize;
      rightEyeX = snake.x * gridSize + gridSize - eyeSize * 2;
      rightEyeY = snake.y * gridSize + eyeSize;
    } else if (snake.speedY === 1) {
      // Moving down
      leftEyeX = snake.x * gridSize + eyeSize;
      leftEyeY = snake.y * gridSize + gridSize - eyeSize * 2;
      rightEyeX = snake.x * gridSize + gridSize - eyeSize * 2;
      rightEyeY = snake.y * gridSize + gridSize - eyeSize * 2;
    } else {
      // Default (not moving or first render)
      leftEyeX = snake.x * gridSize + eyeSize * 2;
      leftEyeY = snake.y * gridSize + eyeSize;
      rightEyeX = snake.x * gridSize + gridSize - eyeSize * 3;
      rightEyeY = snake.y * gridSize + eyeSize;
    }

    ctx.beginPath();
    ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
    ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // Draw pupils
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(leftEyeX, leftEyeY, eyeSize / 2, 0, Math.PI * 2);
    ctx.arc(rightEyeX, rightEyeY, eyeSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw birthday messages
  function drawMessages() {
    if (messageTimer > 0) {
      ctx.font = '16px Comic Sans MS';
      ctx.fillStyle = '#FF5722';
      ctx.textAlign = 'center';
      ctx.fillText(currentMessage, canvas.width / 2, 30);
      messageTimer--;
    }
  }

  // Game over
  function gameOver() {
    gameActive = false;
    // Play game over sound
    playBeep(440, 0.3, 'sawtooth');

    finalScoreElement.textContent = score;
    messageElement.style.display = 'flex';

    // Show special message for good score
    const messageTitle = document.querySelector('.message-content h2');
    if (score >= 20) {
      messageTitle.textContent = "Suurepärane töö, Alexander!";
    } else if (score >= 10) {
      messageTitle.textContent = "Hästi mängitud, Alexander!";
    } else {
      messageTitle.textContent = "Mäng läbi, Alexander!";
    }
  }

  // Event listeners for keyboard controls
  document.addEventListener('keydown', (e) => {
    // Start game loop if not already active
    if (!gameActive) return;

    // Check if game has started yet (if snake is not moving)
    const gameStarted = snake.speedX !== 0 || snake.speedY !== 0;

    switch (e.key) {
      case 'ArrowUp':
        if (snake.speedY !== 1) { // Prevent moving in the opposite direction
          snake.speedX = 0;
          snake.speedY = -1;
          if (!gameStarted) startGameLoop();
        }
        break;
      case 'ArrowDown':
        if (snake.speedY !== -1) {
          snake.speedX = 0;
          snake.speedY = 1;
          if (!gameStarted) startGameLoop();
        }
        break;
      case 'ArrowLeft':
        if (snake.speedX !== 1) {
          snake.speedX = -1;
          snake.speedY = 0;
          if (!gameStarted) startGameLoop();
        }
        break;
      case 'ArrowRight':
        if (snake.speedX !== -1) {
          snake.speedX = 1;
          snake.speedY = 0;
          if (!gameStarted) startGameLoop();
        }
        break;
    }
  });

  // Event listeners for touch controls
  upButton.addEventListener('click', () => {
    if (!gameActive) return;
    if (snake.speedY !== 1) {
      snake.speedX = 0;
      snake.speedY = -1;
      // Fix the game start condition
      const gameStarted = snake.tail.length > 0;
      if (!gameStarted) startGameLoop();
    }
  });

  downButton.addEventListener('click', () => {
    if (!gameActive) return;
    if (snake.speedY !== -1) {
      snake.speedX = 0;
      snake.speedY = 1;
      // Fix the game start condition
      const gameStarted = snake.tail.length > 0;
      if (!gameStarted) startGameLoop();
    }
  });

  leftButton.addEventListener('click', () => {
    if (!gameActive) return;
    if (snake.speedX !== 1) {
      snake.speedX = -1;
      snake.speedY = 0;
      // Fix the game start condition
      const gameStarted = snake.tail.length > 0;
      if (!gameStarted) startGameLoop();
    }
  });

  rightButton.addEventListener('click', () => {
    if (!gameActive) return;
    if (snake.speedX !== -1) {
      snake.speedX = 1;
      snake.speedY = 0;
      // Fix the game start condition
      const gameStarted = snake.tail.length > 0;
      if (!gameStarted) startGameLoop();
    }
  });

  // Function to start the game loop
  function startGameLoop() {
    // Make sure audio is initialized when game starts
    initAudio();

    // Play start sound
    playBeep(1175, 0.2);

    // Clear any welcome message
    currentMessage = "Läks lahti, Alexander!";
    messageTimer = 30;

    // Start the game loop
    gameLoop();
  }

  // Event listeners for restart button - handle all touch/click scenarios
  function handleRestart(e) {
    // Always prevent default to ensure no unwanted behaviors
    e.preventDefault();
    e.stopPropagation();

    // Initialize audio context if needed
    initAudio();

    // Reset and start new game
    init();

    // Play start sound
    playBeep(1175, 0.2);

    return false;
  }

  // Remove existing listeners and add new ones
  restartButton.addEventListener('click', handleRestart);
  restartButton.addEventListener('touchstart', handleRestart, { passive: false });
  restartButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
  }, { passive: false });

  // Prevent default touch behaviors only for buttons
  document.addEventListener('touchstart', function (e) {
    if (e.target.tagName === 'BUTTON') {
      e.preventDefault();
    }
  }, { passive: false });

  // Prevent scrolling during game
  document.addEventListener('touchmove', function (e) {
    if (e.target.tagName === 'CANVAS' || e.target.tagName === 'BUTTON') {
      e.preventDefault();
    }
  }, { passive: false });

  // Enhanced touch controls with passive listeners where possible
  function handleButtonPress(direction) {
    if (!gameActive) return;

    switch (direction) {
      case 'up':
        if (snake.speedY !== 1) {
          snake.speedX = 0;
          snake.speedY = -1;
          const gameStarted = snake.tail.length > 0;
          if (!gameStarted) startGameLoop();
        }
        break;
      case 'down':
        if (snake.speedY !== -1) {
          snake.speedX = 0;
          snake.speedY = 1;
          const gameStarted = snake.tail.length > 0;
          if (!gameStarted) startGameLoop();
        }
        break;
      case 'left':
        if (snake.speedX !== 1) {
          snake.speedX = -1;
          snake.speedY = 0;
          const gameStarted = snake.tail.length > 0;
          if (!gameStarted) startGameLoop();
        }
        break;
      case 'right':
        if (snake.speedX !== -1) {
          snake.speedX = 1;
          snake.speedY = 0;
          const gameStarted = snake.tail.length > 0;
          if (!gameStarted) startGameLoop();
        }
        break;
    }
  }

  upButton.addEventListener('touchstart', () => {
    handleButtonPress('up');
  }, { passive: true });

  downButton.addEventListener('touchstart', () => {
    handleButtonPress('down');
  }, { passive: true });

  leftButton.addEventListener('touchstart', () => {
    handleButtonPress('left');
  }, { passive: true });

  rightButton.addEventListener('touchstart', () => {
    handleButtonPress('right');
  }, { passive: true });

  // Initialize audio on first click/touch
  document.addEventListener('click', initAudio, { once: true });
  document.addEventListener('touchstart', initAudio, { once: true });

  // Initialize the game
  init();
});