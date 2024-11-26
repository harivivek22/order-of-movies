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
    
    await fetchRandomMovies();
    startTimer();
}

async function fetchRandomMovies() {
    try {
        // Fetch popular movies with poster_path filter
        const response = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&page=${Math.floor(Math.random() * 20) + 1}`);
        const data = await response.json();
        
        // Filter movies that have poster images and release dates
        const moviesWithPosters = data.results.filter(movie => 
            movie.poster_path && movie.release_date
        );
        
        // Get 3 random movies
        const shuffledMovies = moviesWithPosters.sort(() => Math.random() - 0.5);
        movies = shuffledMovies.slice(0, 3);
        
        // Display posters
        const moviePosters = document.getElementById('moviePosters');
        moviePosters.innerHTML = '';
        
        movies.forEach((movie) => {
            if (movie.poster_path) {
                const posterDiv = document.createElement('div');
                posterDiv.className = 'poster';
                posterDiv.draggable = true;
                posterDiv.style.backgroundImage = `url(https://image.tmdb.org/t/p/w500${movie.poster_path})`;
                posterDiv.setAttribute('data-movie-id', movie.id);
                moviePosters.appendChild(posterDiv);
            }
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
    const draggedPoster = document.querySelector('.dragging');
    if (!draggedPoster) return;

    // Only allow drop if zone is empty
    if (!dropZone.querySelector('.poster')) {
        // Clone the poster and add it to the drop zone
        const posterClone = draggedPoster.cloneNode(true);
        dropZone.appendChild(posterClone);
        
        // Remove the original poster if it's from the bottom section
        if (draggedPoster.parentElement.id === 'moviePosters') {
            draggedPoster.remove();
            draggedPoster.setAttribute('draggable', 'false');  // Disable further dragging
        }
        
        // Make only this dropped poster draggable
        posterClone.setAttribute('draggable', 'true');
        posterClone.addEventListener('dragstart', handleDragStart);
        posterClone.addEventListener('dragend', handleDragEnd);
    }
}