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
        const moviePosters = document.getElementById('moviePosters');
        moviePosters.innerHTML = ''; // Clear existing posters
        
        movies.forEach((movie) => {
            const posterDiv = document.createElement('div');
            posterDiv.className = 'poster';
            posterDiv.draggable = true;
            posterDiv.style.backgroundImage = `url(https://image.tmdb.org/t/p/w500${movie.poster_path})`;
            posterDiv.setAttribute('data-movie-id', movie.id);
            moviePosters.appendChild(posterDiv);
        });
        
        setupDragAndDrop();
    } catch (error) {
        console.error('Error fetching movies:', error);
    }
}

function setupDragAndDrop() {
    const posters = document.querySelectorAll('.poster');
    const dropZones = document.querySelectorAll('.drop-zone');

    posters.forEach(poster => {
        poster.setAttribute('draggable', 'true');
        poster.addEventListener('dragstart', handleDragStart);
        poster.addEventListener('dragend', handleDragEnd);
    });

    dropZones.forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('drop', handleDrop);
        zone.addEventListener('dragenter', handleDragEnter);
        zone.addEventListener('dragleave', handleDragLeave);
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
function handleDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', e.target.outerHTML);
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDragEnter(e) {
    e.preventDefault();
    if (e.target.classList.contains('drop-zone')) {
        e.target.classList.add('hover');
    }
}

function handleDragLeave(e) {
    if (e.target.classList.contains('drop-zone')) {
        e.target.classList.remove('hover');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const dropZone = e.target.closest('.drop-zone');
    if (!dropZone) return;

    dropZone.classList.remove('hover');
    const data = e.dataTransfer.getData('text/plain');
    
    // Only allow drop if zone is empty
    if (!dropZone.querySelector('.poster')) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = data;
        const posterElement = tempDiv.firstChild;
        dropZone.appendChild(posterElement);
        
        // Remove the original poster from the bottom section
        const draggedPoster = document.querySelector('.dragging');
        if (draggedPoster && draggedPoster.parentElement.id === 'moviePosters') {
            draggedPoster.remove();
        }
        
        // Make the dropped poster draggable again
        const droppedPoster = dropZone.querySelector('.poster');
        if (droppedPoster) {
            droppedPoster.setAttribute('draggable', 'true');
            droppedPoster.addEventListener('dragstart', handleDragStart);
            droppedPoster.addEventListener('dragend', handleDragEnd);
        }
    }
}