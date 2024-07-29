const mazeContainer = document.getElementById('maze-container');
const mazeElement = document.getElementById('maze');
const timerElement = document.getElementById('timer');
const countdownOverlay = document.getElementById('countdown-overlay');
const timesElement = document.getElementById('times');
const themeSelect = document.getElementById('themeSelect');

const mazeSize = 20; // Original size
const cellSize = 20;
const maze = [];
let playerPosition = { x: 0, y: 0 };
const endPosition = { x: mazeSize - 1, y: mazeSize - 1 };
let moveSpeed = 50; // Fixed speed
let moveInterval;
let times = [];
let timerInterval;
let startTime;
let controlMode = 'wasd'; // Default control mode
let currentTheme = "theme1";

const themes = {
    "theme1": { background: "#2a9178", floor: "#51c2a7", wall: "#443d8a", text: "#8680bd" },
    "theme2": { background: "#ebb957", floor: "#ebc883", wall: "#443d8a", text: "#443d8a" }
};

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.visited = false;
        this.walls = [true, true, true, true]; // Top, Right, Bottom, Left
    }

    getNeighbors() {
        const neighbors = [];

        const directions = [
            [0, -1], // top
            [1, 0], // right
            [0, 1], // bottom
            [-1, 0] // left
        ];

        for (const [dx, dy] of directions) {
            const nx = this.x + dx;
            const ny = this.y + dy;

            if (nx >= 0 && nx < mazeSize && ny >= 0 && ny < mazeSize) {
                const neighbor = maze[ny][nx];
                if (!neighbor.visited) {
                    neighbors.push(neighbor);
                }
            }
        }

        return neighbors;
    }
}

function generateMaze() {
    maze.length = 0; // Clear the existing maze
    for (let y = 0; y < mazeSize; y++) {
        const row = [];
        for (let x = 0; x < mazeSize; x++) {
            const cell = new Cell(x, y);
            row.push(cell);
        }
        maze.push(row);
    }

    const stack = [];
    const startCell = maze[0][0];
    startCell.visited = true;
    stack.push(startCell);

    while (stack.length > 0) {
        const current = stack.pop();
        const neighbors = current.getNeighbors();

        if (neighbors.length > 0) {
            stack.push(current);

            const randomIndex = Math.floor(Math.random() * neighbors.length);
            const next = neighbors[randomIndex];

            // Remove walls between current and next
            const dx = next.x - current.x;
            const dy = next.y - current.y;

            if (dx === 1) {
                current.walls[1] = false;
                next.walls[3] = false;
            } else if (dx === -1) {
                current.walls[3] = false;
                next.walls[1] = false;
            }

            if (dy === 1) {
                current.walls[2] = false;
                next.walls[0] = false;
            } else if (dy === -1) {
                current.walls[0] = false;
                next.walls[2] = false;
            }

            next.visited = true;
            stack.push(next);
        }
    }

    removePerimeterWalls();
}

function removePerimeterWalls() {
    for (let y = 0; y < mazeSize; y++) {
        maze[y][0].walls[3] = false;
        maze[y][mazeSize - 1].walls[1] = false;
    }

    for (let x = 0; x < mazeSize; x++) {
        maze[0][x].walls[0] = false;
        maze[mazeSize - 1][x].walls[2] = false;
    }
}

function drawMaze() {
    mazeElement.innerHTML = ''; // Clear existing maze elements

    for (let y = 0; y < mazeSize; y++) {
        for (let x = 0; x < mazeSize; x++) {
            const cell = maze[y][x];
            const cellElement = document.createElement('div');
            cellElement.classList.add('cell');
            cellElement.dataset.x = x;
            cellElement.dataset.y = y;

            if (x === playerPosition.x && y === playerPosition.y) {
                cellElement.classList.add('player');
            } else if (x === endPosition.x && y === endPosition.y) {
                const endElement = document.createElement('div');
                endElement.classList.add('end');
                cellElement.appendChild(endElement);
            } else {
                if (cell.walls[0]) cellElement.style.borderTop = `1px solid ${themes[currentTheme].wall}`;
                if (cell.walls[1]) cellElement.style.borderRight = `1px solid ${themes[currentTheme].wall}`;
                if (cell.walls[2]) cellElement.style.borderBottom = `1px solid ${themes[currentTheme].wall}`;
                if (cell.walls[3]) cellElement.style.borderLeft = `1px solid ${themes[currentTheme].wall}`;
                if (cell.visited) {
                    cellElement.classList.add('floor');
                    cellElement.style.backgroundColor = themes[currentTheme].floor;
                } else {
                    cellElement.classList.add('wall');
                }
            }

            mazeElement.appendChild(cellElement);
        }
    }
    fixBorders(); // Fix the borders after drawing the maze
}

function fixBorders() {
    for (let y = 0; y < mazeSize; y++) {
        mazeElement.children[y * mazeSize + (mazeSize - 1)].style.borderRight = 'none';
    }
    for (let x = 0; x < mazeSize; x++) {
        mazeElement.children[(mazeSize - 1) * mazeSize + x].style.borderBottom = 'none';
    }
}

function movePlayer(dx, dy) {
    const newX = playerPosition.x + dx;
    const newY = playerPosition.y + dy;

    if (newX >= 0 && newX < mazeSize && newY >= 0 && newY < mazeSize) {
        const currentCell = maze[playerPosition.y][playerPosition.x];
        const newCell = maze[newY][newX];

        // Check for walls before moving
        if (
            (dx === 1 && !currentCell.walls[1]) ||
            (dx === -1 && !currentCell.walls[3]) ||
            (dy === 1 && !currentCell.walls[2]) ||
            (dy === -1 && !currentCell.walls[0])
        ) {
            playerPosition = { x: newX, y: newY };
            drawMaze();

            // Check if player reached the end
            if (newX === endPosition.x && newY === endPosition.y) {
                completeMaze();
            }
        }
    }
}

let currentDirection = null;

function handleKeydown(event) {
    clearInterval(moveInterval);
    switch (event.key) {
        case 'w':
            currentDirection = { dx: 0, dy: -1 };
            break;
        case 'a':
            currentDirection = { dx: -1, dy: 0 };
            break;
        case 's':
            currentDirection = { dx: 0, dy: 1 };
            break;
        case 'd':
            currentDirection = { dx: 1, dy: 0 };
            break;
    }
    if (currentDirection) {
        movePlayer(currentDirection.dx, currentDirection.dy);
        moveInterval = setInterval(() => movePlayer(currentDirection.dx, currentDirection.dy), moveSpeed);
    }
}

function handleKeyup(event) {
    if (
        (event.key === 'w' && currentDirection.dy === -1) ||
        (event.key === 'a' && currentDirection.dx === -1) ||
        (event.key === 's' && currentDirection.dy === 1) ||
        (event.key === 'd' && currentDirection.dx === 1)
    ) {
        clearInterval(moveInterval);
        currentDirection = null;
    }
}

document.addEventListener('keydown', handleKeydown);
document.addEventListener('keyup', handleKeyup);

themeSelect.addEventListener('change', () => {
    currentTheme = themeSelect.value;
    const theme = themes[currentTheme];
    document.body.style.backgroundColor = theme.background;
    document.querySelectorAll('.floor').forEach(el => el.style.backgroundColor = theme.floor);
    document.querySelectorAll('.wall').forEach(el => el.style.backgroundColor = theme.wall);
    document.querySelectorAll('#timer, #times').forEach(el => el.style.color = theme.text);
    drawMaze();
});

function startCountdown() {
    let countdown = 5;
    countdownOverlay.textContent = countdown;
    countdownOverlay.style.display = 'flex'; // Ensure the overlay is visible

    const countdownInterval = setInterval(() => {
        countdown -= 1;
        countdownOverlay.textContent = countdown;

        if (countdown <= 0) {
            clearInterval(countdownInterval);
            countdownOverlay.style.display = 'none'; // Hide the overlay
            startTimer();
        }
    }, 1000);
}

function startTimer() {
    startTime = new Date();
    timerInterval = setInterval(updateTimer, 10);
}

function updateTimer() {
    const currentTime = new Date();
    const elapsedTime = (currentTime - startTime) / 1000;
    timerElement.textContent = `Time: ${elapsedTime.toFixed(2)}s`;
}

function stopTimer() {
    clearInterval(timerInterval);
}

function completeMaze() {
    stopTimer();
    const elapsedTime = (new Date() - startTime) / 1000;
    times.push(elapsedTime.toFixed(2));
    displayTimes();
    showCompletionMessage(elapsedTime.toFixed(2));
}

function displayTimes() {
    timesElement.innerHTML = '';
    times.forEach((time, index) => {
        const timeElement = document.createElement('div');
        timeElement.textContent = `Run ${index + 1}: ${time}s`;
        timesElement.appendChild(timeElement);
    });
}

function showCompletionMessage(time) {
    countdownOverlay.textContent = `Completed in ${time}s\nHit space for next`;
    countdownOverlay.style.display = 'flex';

    document.addEventListener('keydown', handleSpacebar);
}

function handleSpacebar(event) {
    if (event.code === 'Space') {
        document.removeEventListener('keydown', handleSpacebar);
        resetGame();
    }
}

function resetGame() {
    playerPosition = { x: 0, y: 0 };
    generateMaze();
    drawMaze();
    startCountdown();
}

generateMaze();
drawMaze();
startCountdown();
