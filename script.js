const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let cities = [];
let playerPath = [];
let isPlaying = false;
let level = 'easy';
let optimalPath = [];
let botInterval = null;
let score = 0;

function distance(city1, city2) {
  return Math.sqrt((city1.x - city2.x) ** 2 + (city1.y - city2.y) ** 2);
}

function generateCities(numCities) {
  cities = [];
  for (let i = 0; i < numCities; i++) {
    cities.push({
      x: Math.random() * (canvas.width - 50) + 25,
      y: Math.random() * (canvas.height - 50) + 25,
    });
  }
}

function drawCities() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Vẽ đường nối các thành phố với khoảng cách
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.2; // Điều chỉnh độ dày đường đi (đơn vị pixel)
  ctx.fillStyle = '#000';
  cities.forEach((city1, index1) => {
    cities.forEach((city2, index2) => {
      if (index1 < index2) {
        const dist = distance(city1, city2);
        ctx.beginPath();
        ctx.moveTo(city1.x, city1.y);
        ctx.lineTo(city2.x, city2.y);
        ctx.stroke();
        ctx.closePath();
        ctx.fillText(
          dist.toFixed(1),
          (city1.x + city2.x) / 2,
          (city1.y + city2.y) / 2
        );
      }
    });
  });

  // Vẽ các thành phố
  cities.forEach((city, index) => {
    ctx.beginPath();
    ctx.arc(city.x, city.y, 10, 0, Math.PI * 2);
    ctx.lineWidth = 3; // Điều chỉnh độ dày đường đi (đơn vị pixel)
    ctx.fillStyle = '#00ffffff';
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
    ctx.fillStyle = '#000';
    ctx.fillText(index + 1, city.x + 12, city.y);
  });
}

function drawPath(path, color = 'red') {
  ctx.strokeStyle = color;
  for (let i = 0; i < path.length - 1; i++) {
    const from = cities[path[i]];
    const to = cities[path[i + 1]];
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.closePath();
  }
  const last = cities[path[path.length - 1]];
  const first = cities[path[0]];
  ctx.beginPath();
  ctx.moveTo(last.x, last.y);
  ctx.lineTo(first.x, first.y);
  ctx.stroke();
  ctx.closePath();
}

function calculateTotalDistance(path) {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    total += distance(cities[path[i]], cities[path[i + 1]]);
  }
  total += distance(cities[path[path.length - 1]], cities[path[0]]);
  return total;
}

function findOptimalPath() {
  const permutations = permute([...Array(cities.length).keys()]);
  let bestDistance = Infinity;
  let bestPath = [];

  permutations.forEach((path) => {
    const dist = calculateTotalDistance(path);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestPath = path;
    }
  });

  optimalPath = bestPath;
  return { bestPath, bestDistance };
}

function permute(arr) {
  if (arr.length <= 1) return [arr];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = permute([...arr.slice(0, i), ...arr.slice(i + 1)]);
    rest.forEach((perm) => result.push([arr[i], ...perm]));
  }
  return result;
}

function calculateResults() {
  const playerDistance = calculateTotalDistance(playerPath);
  const { bestDistance } = findOptimalPath();

  document.getElementById('playerDistance').textContent =
    playerDistance.toFixed(2);
  document.getElementById('optimalDistance').textContent =
    bestDistance.toFixed(2);

  if (Math.abs(playerDistance - bestDistance) < 1e-6) {
    alert('Bạn tìm được lộ trình tối ưu! +1 điểm.');
    score++;
    updateScore();
    startGame(); // Tiến sang màn mới khi điểm tăng
  } else {
    alert('Lộ trình của bạn chưa tối ưu. -1 điểm.');
    score--;
    updateScore();

    if (score < 0) {
      alert('Bạn đã thua trò chơi.');
      resetGame(); // Nếu điểm dưới 0, kết thúc và reset trò chơi
    } else {
      // Khi điểm giảm nhưng chưa dưới 0, hỏi người chơi có muốn chơi lại không
      const confirmReplay = confirm(
        'Điểm của bạn giảm. Bạn có muốn chơi lại trên bản đồ hiện tại không?'
      );
      if (confirmReplay) {
        replayGame(); // Nếu đồng ý, chơi lại trên bản đồ hiện tại
      } else {
        startGame(); // Nếu huỷ, bắt đầu lại với bản đồ mới
      }
    }
  }
}

function botGuide(callback) {
  clearInterval(botInterval);
  const { bestPath, bestDistance } = findOptimalPath();

  // Cập nhật optimalDistance khi tìm lộ trình tối ưu
  document.getElementById('optimalDistance').textContent =
    bestDistance.toFixed(2);

  let i = 0;
  botInterval = setInterval(() => {
    if (i < bestPath.length - 1) {
      const from = cities[bestPath[i]];
      const to = cities[bestPath[i + 1]];
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = 'green';
      ctx.stroke();
      ctx.closePath();
      i++;
    } else {
      const last = cities[bestPath[bestPath.length - 1]];
      const first = cities[bestPath[0]];
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(first.x, first.y);
      ctx.stroke();
      ctx.closePath();
      clearInterval(botInterval);

      if (callback) callback();
    }
  }, 500);
}

function updateScore() {
  document.getElementById('score').textContent = score;
}

canvas.addEventListener('click', (e) => {
  if (!isPlaying) return;

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  cities.forEach((city, index) => {
    if (
      mouseX >= city.x - 10 &&
      mouseX <= city.x + 10 &&
      mouseY >= city.y - 10 &&
      mouseY <= city.y + 10 &&
      !playerPath.includes(index)
    ) {
      playerPath.push(index);
      if (playerPath.length > 1) {
        const from = cities[playerPath[playerPath.length - 2]];
        const to = cities[playerPath[playerPath.length - 1]];
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.closePath();
      }
    }
  });

  if (playerPath.length === cities.length) {
    const from = cities[playerPath[playerPath.length - 1]];
    const to = cities[playerPath[0]];
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.closePath();

    isPlaying = false;
    calculateResults();
  }
});

function startGame() {
  const numCities = level === 'easy' ? 4 : 7;
  generateCities(numCities);
  drawCities();
  playerPath = [];
  isPlaying = true;

  document.getElementById('playerDistance').textContent = '0';
  document.getElementById('optimalDistance').textContent = '0';
  clearInterval(botInterval);
}

function replayGame() {
  playerPath = [];
  drawCities();
  isPlaying = true;
}

function resetGame() {
  score = 0;
  updateScore();
  startGame();
}

document.getElementById('restartGame').addEventListener('click', resetGame);
document.getElementById('easyMode').addEventListener('click', () => {
  level = 'easy';
  resetGame();
});
document.getElementById('hardMode').addEventListener('click', () => {
  level = 'hard';
  resetGame();
});
document.getElementById('findAnswer').addEventListener('click', () => {
  botGuide(calculateResults);
});

resetGame();
