const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startScreen = document.getElementById("startScreen");

let gameStarted = false;
let paused = false;

// ======================
// IMAGES
// ======================
const playerImg = new Image();
playerImg.src = "https://png.pngtree.com/png-vector/20241016/ourlarge/pngtree-vampire-cartoon-png-image_14089958.png";

const pickleImg = new Image();
pickleImg.src = "https://www.clipartmax.com/png/middle/15-153390_image-result-for-pickle-clipart-food-prints-family-transparent-background-pickle-clipart.png";

const strongPickleImg = new Image();
strongPickleImg.src = "https://img.freepik.com/premium-psd/png-pickled-cucumber-transparent-background_53876-497988.jpg";

const bossPickleImg = new Image();
bossPickleImg.src = "https://png.pngtree.com/png-vector/20240528/ourmid/pngtree-cartoon-pickle-character-with-big-eyes-png-image_12526411.png";

const explosionImg = new Image();
explosionImg.src = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5MsJ_CSDz6qeaC3vBwG8ETNKHBaMeefEO2g&s";

// ======================
// GAME STATE
// ======================
let score, lives, gameOver, fireCooldown, fireRate, wave, flashTimer;

// ======================
// PLAYER
// ======================
const player = {
  width: 40,
  height: 20,
  speed: 6,
  x: 0,
  y: 0
};

// ======================
// INPUT
// ======================
const keys = {};
document.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;

  if (e.code === "Space") e.preventDefault();

  // Pause
  if (e.key === "Escape" && gameStarted && !gameOver) {
    paused = !paused;
  }

  // Restart
  if (e.key.toLowerCase() === "r" && gameOver) {
    resetGame();
  }
});

document.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

// ======================
// PROJECTILES
// ======================
let bullets = [];
let enemyBullets = [];
let explosions = [];

// ======================
// ENEMIES
// ======================
let enemies = [];

function spawnWave() {
  enemies = [];
  const rows = 3 + wave;
  const cols = 6;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let strong = Math.random() < 0.2;

      enemies.push({
        x: 80 + c * 70,
        y: 60 + r * 50,
        width: 40,
        height: 30,
        dx: 1 + wave * 0.3,
        hp: strong ? 3 : 1,
        img: strong ? strongPickleImg : pickleImg,
        wobble: Math.random() * 10,
        boss: false
      });
    }
  }
}

// ======================
// RESET GAME
// ======================
function resetGame() {
  score = 0;
  lives = 3;
  fireRate = 20;
  fireCooldown = 0;
  wave = 1;
  gameOver = false;
  paused = false;
  flashTimer = 0;

  bullets = [];
  enemyBullets = [];
  explosions = [];

  player.x = canvas.width / 2 - player.width / 2;
  player.y = canvas.height - 60;

  spawnWave();
}

// ======================
// START GAME
// ======================
startScreen.addEventListener("click", () => {
  startScreen.style.display = "none";
  gameStarted = true;
  resetGame();
  loop();
});

// ======================
// COLLISION
// ======================
function hit(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// ======================
// UPDATE
// ======================
function update() {
  if (!gameStarted || gameOver || paused) return;

  // Movement
  if (keys["a"] && player.x > 0) player.x -= player.speed;
  if (keys["d"] && player.x < canvas.width - player.width) player.x += player.speed;

  // Shooting
  if (keys[" "] && fireCooldown <= 0) {
    bullets.push({
      x: player.x + player.width / 2 - 2,
      y: player.y,
      width: 4,
      height: 10
    });
    fireCooldown = fireRate;
  }
  fireCooldown--;

  // Upgrade (fire rate)
  if (keys["p"] && score >= 100) {
    fireRate = Math.max(5, fireRate - 5);
    score -= 100;
    keys["p"] = false; // prevent holding
  }

  bullets.forEach(b => (b.y -= 10));
  enemyBullets.forEach(b => (b.y += 6));

  // Enemy movement
  enemies.forEach(e => {
    e.x += e.dx;
    e.wobble += 0.1;

    if (Math.random() < 0.002 * wave) {
      enemyBullets.push({
        x: e.x + e.width / 2,
        y: e.y + e.height,
        width: 4,
        height: 10
      });
    }
  });

  // Bounce enemies
  if (enemies.some(e => e.x < 0 || e.x > canvas.width - e.width)) {
    enemies.forEach(e => {
      e.dx *= -1;
      e.y += 10;
    });
  }

  // Bullet collisions
  bullets.forEach((b, bi) => {
    enemies.forEach((e, ei) => {
      if (hit(b, e)) {
        bullets.splice(bi, 1);
        e.hp--;

        if (e.hp <= 0) {
          explosions.push({ x: e.x, y: e.y, timer: 20 });
          enemies.splice(ei, 1);
          score += e.boss ? 200 : 10;
        }
      }
    });
  });

  // Player hit
  enemyBullets.forEach((b, bi) => {
    if (hit(b, player)) {
      enemyBullets.splice(bi, 1);
      lives--;
      flashTimer = 10;
      if (lives <= 0) gameOver = true;
    }
  });

  // Explosion timer
  explosions.forEach((ex, i) => {
    ex.timer--;
    if (ex.timer <= 0) explosions.splice(i, 1);
  });

  if (flashTimer > 0) flashTimer--;

  // Next wave
  if (enemies.length === 0) {
    wave++;
    spawnWave();
  }
}

// ======================
// DRAW
// ======================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // UI
  ctx.font = "16px monospace";
  ctx.fillStyle = "#00ff66";
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`Lives: ${lives}`, 10, 40);
  ctx.fillText(`Wave: ${wave}`, 10, 60);

  if (paused) {
    ctx.font = "30px monospace";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "left";
    return;
  }

  // Player (flash when hit)
  if (flashTimer % 2 === 0) {
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
  }

  // Bullets
  ctx.fillStyle = "yellow";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

  ctx.fillStyle = "red";
  enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

  // Enemies
  enemies.forEach(e => {
    let wobbleY = Math.sin(e.wobble) * 3;
    ctx.drawImage(e.img, e.x, e.y + wobbleY, e.width, e.height);
  });

  // Explosions
  explosions.forEach(ex => {
    ctx.drawImage(explosionImg, ex.x, ex.y, 40, 40);
  });

  if (gameOver) {
    ctx.font = "40px monospace";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
    ctx.font = "18px monospace";
    ctx.fillText("Press R to Restart", canvas.width / 2, canvas.height / 2 + 40);
    ctx.textAlign = "left";
  }
}

// ======================
// LOOP
// ======================
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
