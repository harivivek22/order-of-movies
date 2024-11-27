class MovieGame {
    constructor() {
        // DOM Elements
        this.startScreen = document.getElementById('start-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.resultScreen = document.getElementById('result-screen');
        this.startBtn = document.getElementById('start-btn');
        this.submitBtn = document.getElementById('submit-btn');
        this.playAgainBtn = document.getElementById('play-again');
        this.timerElement = document.getElementById('timer');
        this.scoreElement = document.getElementById('score');
        this.movieList = document.getElementById('movie-list');
        this.dropZones = document.querySelectorAll('.drop-zone');
        this.feedbackMessage = document.getElementById('feedback-message');

        // Game State
        this.movies = [];
        this.timer = 30;
        this.score = 1000;
        this.interval = null;

        // Event Listeners
        this.startBtn.addEventListener('click', () => this.startGame());
        this.submitBtn.addEventListener('click', () => this.checkAndSubmitOrder());
        this.playAgainBtn.addEventListener('click', () => this.resetGame());
        this.setupDragAndDrop();
        
    }

    async fetchMovies() {
        try {
            const response = await fetch('arrangemovies.csv');
            if (!response.ok) throw new Error('Failed to load CSV file');

            const csvText = await response.text();
            const rows = csvText.split('\n')
                .filter(row => row.trim())
                .slice(1);

            this.movies = rows.map(row => {
                const [year, month, date, title] = row.split(',').map(item => item.trim());
                return {
                    title,
                    releaseDate: new Date(`${year}-${month}-${date}`)  // Use ISO date format
                };
            });

            // Get 3 random movies
            this.movies = this.shuffleArray([...this.movies]).slice(0, 3);

            // Store the correct order
            this.correctOrder = [...this.movies].sort((a, b) => 
                a.releaseDate.getTime() - b.releaseDate.getTime()
            );

            return true;
        } catch (error) {
            console.error('Error loading movies:', error);
            alert('Failed to load movie data');
            return false;
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    async startGame() {
        const moviesLoaded = await this.fetchMovies();
        if (!moviesLoaded) return;
    
        this.startScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.feedbackMessage.textContent = ''; // Clear any previous feedback
        this.createMovieElements();
        this.startTimer();
    }

    createMovieElements() {
        this.movieList.innerHTML = '';
        this.shuffleArray([...this.movies]).forEach(movie => {
            const movieElement = document.createElement('div');
            movieElement.className = 'movie';
            movieElement.draggable = true;
            movieElement.textContent = movie.title;
            movieElement.dataset.title = movie.title;
            this.movieList.appendChild(movieElement);
        });
    }

    setupDragAndDrop() {
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('movie')) {
                e.target.classList.add('dragging');
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('movie')) {
                e.target.classList.remove('dragging');
            }
        });

        this.dropZones.forEach(zone => {
            zone.addEventListener('dragover', e => {
                e.preventDefault();
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                const draggedMovie = document.querySelector('.movie.dragging');
                if (draggedMovie) {
                    const existingMovie = zone.firstChild;
                    if (existingMovie) {
                        const originalParent = draggedMovie.parentNode;
                        zone.removeChild(existingMovie);
                        originalParent.appendChild(existingMovie);
                    }
                    zone.appendChild(draggedMovie);
                    this.checkCompletion();
                }
            });
        });
    }

    checkCompletion() {
        const filled = Array.from(this.dropZones).every(zone => zone.hasChildNodes());
        this.submitBtn.classList.toggle('hidden', !filled);
    }

    startTimer() {
        this.interval = setInterval(() => {
            this.timer--;
            this.score = Math.max(0, this.score - 33);
            this.timerElement.textContent = this.timer;
            this.scoreElement.textContent = this.score;

            if (this.timer <= 0) {
                this.checkAndSubmitOrder();
            }
        }, 1000);
    }

    checkOrder() {
        const playerOrder = Array.from(this.dropZones)
            .map(zone => zone.firstChild?.dataset.title)
            .filter(title => title);

        // Create a sorted reference array based on release dates
        const correctOrder = [...this.movies]
            .sort((a, b) => a.releaseDate - b.releaseDate)
            .map(movie => movie.title);

        console.log('Player order:', playerOrder);
        console.log('Correct order:', correctOrder);

        return JSON.stringify(playerOrder) === JSON.stringify(correctOrder);
    }

    checkAndSubmitOrder() {
        const isCorrect = this.checkOrder();
    
        if (this.timer <= 0) {
            // Time's up - end game
            clearInterval(this.interval);
            this.gameScreen.classList.add('hidden');
            this.resultScreen.classList.remove('hidden');
            document.getElementById('result-message').textContent = 'Time\'s Up!';
            document.getElementById('final-score').textContent = 
                `Correct order: ${[...this.movies]
                    .sort((a, b) => a.releaseDate - b.releaseDate)
                    .map(movie => movie.title)
                    .join(' → ')}`;
        } else if (isCorrect) {
            // Correct order - end game with success
            clearInterval(this.interval);
            this.gameScreen.classList.add('hidden');
            this.resultScreen.classList.remove('hidden');
            document.getElementById('result-message').textContent = 'Congratulations!';
            document.getElementById('final-score').textContent = `Score: ${this.score}`;
        } else {
            // Wrong order but still has time - reset positions and continue
            this.feedbackMessage.textContent = 'Wrong order! Try again!';
            setTimeout(() => {
                this.feedbackMessage.textContent = '';
            }, 2000);
            
            // Reset movie positions
            this.dropZones.forEach(zone => zone.innerHTML = '');
            this.createMovieElements();
            this.submitBtn.classList.add('hidden');
        }
    }

    resetGame() {
        this.timer = 30;
        this.score = 1000;
        this.timerElement.textContent = this.timer;
        this.scoreElement.textContent = this.score;
        this.resultScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
        this.submitBtn.classList.add('hidden');
        this.feedbackMessage.textContent = ''; // Clear feedback message
        this.dropZones.forEach(zone => zone.innerHTML = '');
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => new MovieGame());