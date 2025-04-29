(function() {
    let balance = 1000;
    let betAmount = 10;
    let minesCount = 3;
    let gameActive = false;
    let mines = [];
    let openedCells = 0;
    let multiplier = 1;

    const gridSize = 25;

    function logFactorial(n) {
        if (n < 0) return NaN;
        if (n === 0) return 0;
        let logFact = 0;
        for (let i = 2; i <= n; i++) {
            logFact += Math.log(i);
        }
        return logFact;
    }

    function combinations(n, k) {
        if (k < 0 || k > n) {
            return 0;
        }
        if (k === 0 || k === n) {
            return 1;
        }
        if (k > n / 2) {
            k = n - k;
        }
        const logResult = logFactorial(n) - logFactorial(k) - logFactorial(n - k);
        return Math.round(Math.exp(logResult)); 
    }

    function calculateMultiplier(k, M, N) {
        if (k === 0) return 1;
        if (N - M < k) return Infinity;

        const totalCombinations = combinations(N, k);
        const safeCombinations = combinations(N - M, k);

        if (safeCombinations === 0) {
            return combinations(N, k);
        }

        const calculatedMultiplier = totalCombinations / safeCombinations;
        return calculatedMultiplier; 
    }

    const balanceDisplay = document.querySelector('.header-balance #balance');
    const betInput = document.getElementById('bet-amount');
    const minesInput = document.getElementById('mines-count');
    const startButton = document.getElementById('start-game');
    const cashoutButton = document.getElementById('cashout');
    const multiplierDisplay = document.getElementById('multiplier');
    const potentialWinDisplay = document.getElementById('potential-win');
    const gameGrid = document.getElementById('game-grid');
    const gameStatus = document.getElementById('game-status');
    const progressBar = document.getElementById('coefficient-progress');
    const winModal = document.getElementById('win-modal');
    const modalMultiplier = document.getElementById('modal-multiplier');
    const modalWinnings = document.getElementById('modal-winnings');
    const closeModalBtn = document.getElementById('close-modal-btn');

    function generateProgressBar() {
        const M = parseInt(minesInput.value) || 3;
        const N = gridSize;
        const currentBet = parseInt(betInput.value) || 10;
        
        progressBar.innerHTML = '';
        if (isNaN(M) || M < 2 || M > 24) {
            progressBar.innerHTML = '<div class="progress-step" style="color: var(--danger);">Invalid mine count (2-24)</div>';
            return; 
        }
        
        const maxOpenable = N - M;
        if (maxOpenable < 1) {
            progressBar.innerHTML = '<div class="progress-step" style="color: var(--warning);">No safe cells to open!</div>';
            return;
        }
        
        for (let k = 1; k <= maxOpenable; k++) {
            const stepMultiplier = calculateMultiplier(k, M, N);
            if (!isFinite(stepMultiplier) || stepMultiplier > 1000000) {
                const step = document.createElement('div');
                step.classList.add('progress-step');
                step.innerHTML = `<span>>1Mx</span>~${(currentBet * 1000000).toFixed(0)} <svg width='13' height='13' style='vertical-align:middle;'><use href='#icon-coin'/></svg>`;
                progressBar.appendChild(step);
                break;
            }

            const step = document.createElement('div');
            step.classList.add('progress-step');
            step.dataset.step = k;

            const multiplierText = `x${stepMultiplier.toFixed(2)}`;
            const approxWin = `~${Math.ceil(currentBet * stepMultiplier)} <svg width='13' height='13' style='vertical-align:middle;'><use href='#icon-coin'/></svg>`;

            step.innerHTML = `<span>${multiplierText}</span>${approxWin}`;
            progressBar.appendChild(step);
        }
        progressBar.parentElement.scrollLeft = 0;
    }

    function updateProgressHighlight(currentOpened) {
        const steps = progressBar.querySelectorAll('.progress-step');
        steps.forEach(step => {
            if (parseInt(step.dataset.step) <= currentOpened) {
                step.classList.add('highlighted');
            } else {
                step.classList.remove('highlighted');
            }
        });
        
        // Check if we're on mobile
        const isMobile = window.innerWidth <= 768;
        
        const highlightedStep = progressBar.querySelector(`.progress-step[data-step="${currentOpened}"]`);
        if (highlightedStep) {
            const container = progressBar.parentElement;
            // Instead of using scrollIntoView which can cause whole page to scroll,
            // directly adjust the container's scrollLeft property
            if (isMobile) {
                // Get position information
                const stepLeft = highlightedStep.offsetLeft;
                const containerWidth = container.offsetWidth;
                // Center the step in the container
                const scrollPosition = stepLeft - (containerWidth / 2) + (highlightedStep.offsetWidth / 2);
                
                // Use requestAnimationFrame for smooth scrolling that won't affect page position
                smoothScrollTo(container, scrollPosition, 300);
            } else {
                // On desktop, we can use scrollIntoView safely
                highlightedStep.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }
    
    // Helper function for smooth scrolling that doesn't affect page position
    function smoothScrollTo(element, to, duration) {
        const start = element.scrollLeft;
        const change = to - start;
        let currentTime = 0;
        const increment = 20; // ms
        
        const animateScroll = function() {
            currentTime += increment;
            const val = easeInOutQuad(currentTime, start, change, duration);
            element.scrollLeft = val;
            if (currentTime < duration) {
                setTimeout(animateScroll, increment);
            }
        };
        
        animateScroll();
    }
    
    // Easing function for smooth animation
    function easeInOutQuad(t, b, c, d) {
        t /= d/2;
        if (t < 1) return c/2*t*t + b;
        t--;
        return -c/2 * (t*(t-2) - 1) + b;
    }
    
    function showWinModal(finalMultiplier, winnings) {
        modalMultiplier.textContent = finalMultiplier.toFixed(2);
        modalWinnings.textContent = winnings;
        winModal.classList.remove('hidden');
    }

    function hideWinModal() {
        winModal.classList.add('hidden');
    }

    balanceDisplay.textContent = balance;
    
    generateProgressBar(); 
    const progressContainer = progressBar.parentElement;
    progressContainer.scrollLeft = 0;
    progressContainer.addEventListener('wheel', function(e) {
        e.preventDefault();
        progressContainer.scrollBy({ left: e.deltaY, behavior: 'smooth' });
    });

    minesInput.addEventListener('input', generateProgressBar);
    betInput.addEventListener('input', generateProgressBar);

    closeModalBtn.addEventListener('click', () => {
        hideWinModal();
        betInput.focus();
    });

    function initializeMines() {
        mines = [];
        minesCount = parseInt(minesInput.value) || 3; // Обновление количества мин перед инициализацией
        while (mines.length < minesCount) {
            const pos = Math.floor(Math.random() * gridSize);
            if (!mines.includes(pos)) mines.push(pos);
        }
    }

    startButton.addEventListener('click', () => {
        // Очистка всех частиц перед началом новой игры
        document.querySelectorAll('.particle').forEach(particle => particle.remove());

        // Получение актуальных значений полей перед инициализацией
        betAmount = parseInt(betInput.value) || 10;
        minesCount = parseInt(minesInput.value) || 3;

        if (isNaN(betAmount) || betAmount < 10) {
            gameStatus.textContent = 'Minimum bet is 10 coins!';
            gameStatus.className = 'status-lose';
            return;
        }
        if (isNaN(minesCount) || minesCount < 2 || minesCount > 24) {
            gameStatus.textContent = 'Mines must be between 2 and 24!';
            gameStatus.className = 'status-lose';
            return;
        }
        if (betAmount > balance) {
            gameStatus.textContent = 'Insufficient balance!';
            gameStatus.className = 'status-lose';
            return;
        }
        if (gameActive) return;
        
        try {
            const testCoef = calculateMultiplier(1, minesCount, gridSize);
            if (isNaN(testCoef) || !isFinite(testCoef) || testCoef <= 0) {
                gameStatus.textContent = 'Invalid coefficient calculation. Try different mine count.';
                gameStatus.className = 'status-lose';
                return;
            }
        } catch (e) {
            gameStatus.textContent = 'Error calculating coefficients. Try different mine count.';
            gameStatus.className = 'status-lose';
            return;
        }

        hideWinModal(); 
        initializeMines(); // Инициализация мин после валидации ввода

        balance -= betAmount;
        balanceDisplay.textContent = balance;
        gameActive = true;
        openedCells = 0;
        multiplier = 1;
        
        betInput.disabled = true;
        minesInput.disabled = true;
        
        startButton.classList.add('hidden');
        cashoutButton.disabled = true;
        cashoutButton.classList.remove('hidden');
        cashoutButton.classList.remove('pulse');
        gameStatus.textContent = 'Game started! Pick a cell.';
        gameStatus.className = '';
        multiplierDisplay.textContent = '1.00';
        potentialWinDisplay.textContent = (betAmount * multiplier).toFixed(0);

        generateProgressBar();
        
        const steps = progressBar.querySelectorAll('.progress-step.highlighted');
        steps.forEach(step => step.classList.remove('highlighted'));

        resetGrid();
    });

    function createExplosionParticles(x, y, count) {
        const container = document.querySelector('.container');
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const size = Math.random() * 6 + 4;
            particle.className = 'particle explosion-particle';
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.position = 'absolute';
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.random() * 70 + 40;
            const destX = Math.cos(angle) * distance;
            const destY = Math.sin(angle) * distance;
            particle.style.setProperty('--x', `${destX}px`);
            particle.style.setProperty('--y', `${destY}px`);
            const duration = (Math.random() * 0.3 + 0.3).toFixed(2);
            particle.style.animationDuration = `${duration}s`;
            container.appendChild(particle);
            setTimeout(() => {
                particle.remove();
            }, parseFloat(duration) * 1000 + 50);
        }
    }

    function handleCellClick(index) {
        if (!gameActive || document.querySelector(`.cell[data-index="${index}"] .card`).classList.contains('opened')) return;

        const cell = document.querySelector(`.cell[data-index="${index}"]`);
        const card = cell.querySelector('.card');
        const container = document.querySelector('.container');
        const containerRect = container.getBoundingClientRect();
        const rect = cell.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2 - containerRect.left;
        const centerY = rect.top + rect.height / 2 - containerRect.top;
        
        if (mines.includes(index)) {
            card.classList.add('opened');
            const cardBack = card.querySelector('.card-back');
            cardBack.classList.add('mine');
            cardBack.innerHTML = '<span class="content-animation">💣</span>';
            
            // Анимация взрыва
            createExplosionParticles(centerX, centerY, Math.floor(Math.random() * 10) + 20);

            gameActive = false;
            betInput.disabled = false;
            minesInput.disabled = false;
            startButton.classList.remove('hidden');
            cashoutButton.disabled = true;
            cashoutButton.classList.add('hidden');
            cashoutButton.classList.remove('pulse');
            gameStatus.textContent = 'Game Over! You hit a mine.';
            gameStatus.className = 'status-lose';
            revealAllCards();
        } else {
            card.classList.add('opened');
            const cardBack = card.querySelector('.card-back');
            cardBack.classList.add('gem');
            cardBack.innerHTML = '<span class="content-animation">💎</span>';
            createParticles(centerX, centerY, Math.floor(Math.random() * 6) + 12, true);
            openedCells++;
            if (openedCells === 1) {
                cashoutButton.disabled = false;
            }
            multiplier = calculateMultiplier(openedCells, minesCount, gridSize);
            if (isNaN(multiplier) || !isFinite(multiplier) || multiplier < 1) {
                multiplier = 1;
            }
            multiplierDisplay.textContent = multiplier.toFixed(2);
            const potentialWin = Math.ceil(betAmount * multiplier);
            potentialWinDisplay.textContent = potentialWin;
            updateProgressHighlight(openedCells); 
            if (!cashoutButton.disabled) {
                cashoutButton.classList.add('pulse');
                setTimeout(() => {
                    cashoutButton.classList.remove('pulse');
                }, 1000);
            }
            gameStatus.textContent = 'Keep going or cash out!';
            if (openedCells === gridSize - minesCount) {
                gameStatus.textContent = 'Perfect game! All safe cells revealed!';
                gameStatus.className = 'status-win';
                cashout();
            }
        }
    }

    cashoutButton.addEventListener('click', cashout);
    
    function cashout() {
        if (!gameActive || openedCells === 0) return;
        
        let finalMultiplier = calculateMultiplier(openedCells, minesCount, gridSize);
        if (isNaN(finalMultiplier) || !isFinite(finalMultiplier) || finalMultiplier < 1) {
            finalMultiplier = 1;
        }

        const winnings = Math.ceil(betAmount * finalMultiplier);
        balance += winnings;
        balanceDisplay.textContent = balance;
        gameActive = false;
        
        betInput.disabled = false;
        minesInput.disabled = false;
        
        startButton.classList.remove('hidden');
        cashoutButton.disabled = true;
        cashoutButton.classList.add('hidden');
        cashoutButton.classList.remove('pulse');
        gameStatus.textContent = `You cashed out with ${winnings} coins!`;
        gameStatus.className = 'status-win';
        revealAllCards();
        
        showWinModal(finalMultiplier, winnings); 
    }

    function revealAllCards() {
        const cells = gameGrid.querySelectorAll('.cell');
        cells.forEach((cell, index) => {
            const card = cell.querySelector('.card');
            
            // Если карточка еще не открыта
            if (!card.classList.contains('opened')) {
                card.classList.add('opened');
                const back = card.querySelector('.card-back');
                
                // Делаем неоткрытые карточки полупрозрачными
                cell.classList.add('inactive');
                
                if (mines.includes(index)) {
                    back.classList.add('mine');
                    back.innerHTML = '<span class="content-animation">💣</span>';
                } else {
                    back.classList.add('gem');
                    back.innerHTML = '<span class="content-animation">💎</span>';
                }
            }
        });
    }

    function createParticles(x, y, count, isSuccess) {
        if (!isSuccess) return;

        const container = document.querySelector('.container');
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const size = Math.random() * 6 + 3;
            particle.className = `particle success-particle`;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.position = 'absolute';
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.random() * 50 + 30;
            const destX = Math.cos(angle) * distance;
            const destY = Math.sin(angle) * distance;
            particle.style.setProperty('--x', `${destX}px`);
            particle.style.setProperty('--y', `${destY}px`);
            const duration = (Math.random() * 0.3 + 0.3).toFixed(2);
            particle.style.animationDuration = `${duration}s`;
            container.appendChild(particle);
            setTimeout(() => {
                particle.remove();
            }, parseFloat(duration) * 1000 + 50);
        }
    }

    function resetGrid() {
        const cells = gameGrid.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('inactive');
            const card = cell.querySelector('.card');
            card.classList.remove('opened');
            const back = card.querySelector('.card-back');
            back.classList.remove('gem', 'mine');
            back.innerHTML = '';
        });
    }

    window.addEventListener('DOMContentLoaded', () => {
        createEmptyGrid();
        gameStatus.classList.add('hidden');
    });

    function createEmptyGrid() {
        gameGrid.innerHTML = '';
        for (let i = 0; i < gridSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            cell.innerHTML = `
                <div class="card">
                    <div class="card-front"></div>
                    <div class="card-back"></div>
                </div>
            `;
            cell.addEventListener('click', () => handleCellClick(i));
            gameGrid.appendChild(cell);
        }
    }
})();