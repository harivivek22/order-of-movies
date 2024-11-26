const API_KEY = '920dd780e31ffa6fdfda302d760229ea';
let currentScore = 1000;
let timerInterval;
let movies = [];

// Sample movie IDs (you can change these)
const movieIds = [597, 598, 599];

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('submitBtn').addEventListener('click', checkAnswer);

async function startGame() {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');

    await fetchMovies();
    setupDragAndDrop();
    startTimer();
}

async function fetchMovies() {
    try {
        const promises = movieIds.map(id =>
            fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`)
                .then(response => response.json())
        );

        movies = await Promise.all(promises);

        // Display posters
        const posters = document.querySelectorAll('.poster');
        movies.forEach((movie, index) => {
            posters[index].style.backgroundImage = 
                `url(https://image.tmdb.org/t/p/w500${movie.poster_path})`;
            posters[index].setAttribute('data-movie-id', movie.id);
        });
    } catch (error) {
        console.error('Error fetching movies:', error);
    }
}

function setupDragAndDrop() {
    const posters = document.querySelectorAll('.poster');
    const dropZones = document.querySelectorAll('.drop-zone');

    posters.forEach(poster => {
        poster.addEventListener('dragstart', dragStart);
        poster.addEventListener('dragend', dragEnd);
    });

    dropZones.forEach(zone => {
        zone.addEventListener('dragover', dragOver);
        zone.addEventListener('drop', drop);
        zone.addEventListener('dragenter', dragEnter);
        zone.addEventListener('dragleave', dragLeave);
    });
}

function startTimer() {
    let timeLeft = 30;
    const timerElement = document.getElementById('timer');

    timerInterval = setInterval(() => {
        timeLeft--;
        currentScore = Math.max(0, Math.floor(1000 * (timeLeft / 30)));

        timerElement.textContent = timeLeft;
        document.getElementById('points').textContent = currentScore;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            showResult(false);
        }
    }, 1000);
}

function checkAnswer() {
    clearInterval(timerInterval);

    const dropZones = document.querySelectorAll('.drop-zone');
    const playerOrder = Array.from(dropZones)
        .map(zone => zone.querySelector('.poster')?.getAttribute('data-movie-id'))
        .filter(id => id);

    const correctOrder = [...movies]
        .sort((a, b) => new Date(a.release_date) - new Date(b.release_date))
        .map(movie => movie.id.toString());

    const isCorrect = playerOrder.length === 3 && 
        playerOrder.every((id, index) => id === correctOrder[index].toString());

    showResult(isCorrect);
}

function showResult(isWinner) {
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('resultScreen').classList.remove('hidden');

    const messageElement = document.getElementById('resultMessage');
    const scoreElement = document.getElementById('finalScore');

    if (isWinner) {
        messageElement.textContent = 'Congratulations!';
        scoreElement.textContent = `Your Score: ${currentScore}`;
    } else {
        messageElement.textContent = 'Game Over!';
        scoreElement.textContent = 'Correct order will be shown here';
    }
}

// Drag and Drop helper functions
function dragStart(e) {
    e.target.classList.add('dragging');
}

function dragEnd(e) {
    e.target.classList.remove('dragging');
}

function dragOver(e) {
    e.preventDefault();
}

function dragEnter(e) {
    e.preventDefault();
    e.target.classList.add('hover');
}

function dragLeave(e) {
    e.target.classList.remove('hover');
}

function drop(e) {
    e.preventDefault();
    const dropZone = e.target.closest('.drop-zone');
    const poster = document.querySelector('.dragging');

    if (dropZone && poster) {
        dropZone.innerHTML = '';
        dropZone.appendChild(poster.cloneNode(true));
        poster.remove();
    }

    dropZone.classList.remove('hover');
}