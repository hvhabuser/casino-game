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
            cardBack.innerHTML = '<span class="content-animation"><svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect width="40" height="40" fill="url(#pattern0_2001_6)"/><defs><pattern id="pattern0_2001_6" patternContentUnits="objectBoundingBox" width="1" height="1"><use xlink:href="#image0_2001_6" transform="scale(0.00543478)"/></pattern><image id="image0_2001_6" width="184" height="184" preserveAspectRatio="none" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALgAAAC4CAMAAABn7db1AAABO1BMVEUAAAD////////////////////////////////////////////////////////////////////////////////////////////////////////////////JIxX////SKhnbMxzmQiHhOyD2i3b/bCz/2FHcPCT/ZSPnSy3NMiX/8Oz3kHv+9/X/XxjgQSXuc1zrbFf43dr/4FPmMxHoVzzjTTXYKhL3087/593yfWfEEAL74t72ycPzqp3QPzL66Ob/nXL/lDnus63pX0f/cTL/lmj/jFv/eTT/2cn1wbjrZU3/xq/bZVnrq6XxhXH/wEn2uK3ropvmk4vccGfYWU7/ekH/pUD/hTXQIAz/4NPnm5T/rIrih3/UT0X/z7n/vaLwoJLxl4fvjXzkcmP/z07mfG//g0//skT/tZbotC6SAAAAHXRSTlMACvffyJAb7NZiQSNJu1oUqfGdfW045rRTKTF0hqHxYJUAAA7BSURBVHja7Jm9buJAEIDX/B4cgQSS3JGLthprJYQbV5RY8p/kgspYERI0KPD+T3BezzhjID1T5KuWdfMxDDOza/XDD3fCmfR6k0njc284GM8nSjiTUUeXtN7nCnl50BXd30oybx1NtAaODXdX17RflFze2prpluZTzfSHSioOerM5eROvYrMFPZlfmuDfQCROH/0WK33BckUbLaG1ZdjSliw0u6VmFmvPO+Oyp0QyQ08D4K0b3pHdwJiPlEiw9K1CIHP2BoPiAyWSZ8zoECpz9mbxsRLJCHM8BDInb/niv59YHM3Rm8X/KnkMx+MZRhygNv9AbxZ/HIxHcyWI3uzxSdckX+a5ARavaU+flRTGFy3yE2rIm8SZP29KBIOWbhIDcyHOtEWYj/QlaxvoJDgFYEwYnIpKfKEveBQwtTjti7EkTdfW++i6/rYINr7rbq14lqa1u5QeOqyd94fDeZ17nik9N26J7/uuBUo8D+Ld4ZCldZrfP+Qd1N7F4JXSBiwoThwTynP7PI8/pMxbWAczzwBB4swJH5H950KIeJ9qYJPg6DYJgDG5FHGM+M5jty0r36gbs5eSKlhUFrFnam//VtynPPeSjE519/9zzqionEMKuvsdQT2+aC1lMu9p4iPGmHN+Mz62oUwTHQmnz2f9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"/></defs></svg></span>';
            
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
            cardBack.innerHTML = '<span class="content-animation"><svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect width="32" height="32" fill="url(#pattern0_2001_3)"/><defs><pattern id="pattern0_2001_3" patternContentUnits="objectBoundingBox" width="1" height="1"><use xlink:href="#image0_2001_3" transform="scale(0.00543478)"/></pattern><image id="image0_2001_3" width="184" height="184" preserveAspectRatio="none" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALgAAAC4CAMAAABn7db1AAABEVBMVEUAAAD///////////////////////////////////////////////////////////////////////////////////////////////////////////////+l/3pyyi+H7l+R71qj9W3J/7Btxiis/4RjwxqP7lV87UvQ/7mK8WPC/6Xt/+aZ9FyZ8nSd9WaA7VOf/3GC7UHy/u5zzzjl/duw+ICE6Fb4//aV8WTe/c6I7UzW/8Kn9m+8+Jyd+HCj9YCp9Xm1+JSd33qE1VfG+K582key+IuA4U131T27/piq9YmR8Gra99LP+rx3z0LG8Lq16Z5lyCmo44nU9cuM2WR80kzO8sO/96SY/2W+7KyS224TTOiqAAAAHHRSTlMA0K0J6RvEEHiNYz/ypS3ggvlV2SRLs266nZY26GSm5wAACzNJREFUeNrsmv1X0lAcxrMSS9PsRctam27iZWxsNSncQQIUMUGxMvXU//+HdHEbD1x3t+/m2y8851TniOnHD899nY+mmWaaaaaZZppppplmmmnuIrMrz9Ye31sWn88vPbkV7icL79YKM/eWwury69lbwH67PKPce54urtwQe275qfIwWV24Cff8S+Xh8nwud7mfKw+amZzS51aVB87ThVzcBeWGqdWUG+ZFnjG6iP9fvWxWsqffK7daXzOne+nXQL6UmXtZieL3XJYrR/qunSutEnqedS36qISx9hjT8sRt10t6y9nIEY7uj+aWjOCrUUsGxUMzF3ezruulsgPyLGHuSb6yrES+B0XjwMzDXSmVdE5+lI/cZCwiX8slfL+oGmoqZMyHTJ1z85S6dnbsXUfTmFYNlb/N0fCfRZUnrSt97Xoadf0q+Wq+o3HyZo6WP1au4m0PwSVdgVy/Ig5f1g25hzXfyE5uajysnln5wisIHyaJ2+RmLllswXlQ84xN4XGzK18MhZ8bqprWFZf5itefIHf7Orjz1NwMv44frvxU5R8F4cYPU4odjH7fZK6GlK+4ka92JuEbGk+elq9FwiNwVZORm83jYLrv4TNYOyg4lOu7TsamCMppJ6IlQbi8K27/TIliNd1o5RF8Yx0iN0VUvkwC/xDu7fY5eNQVqfCOF3z2SbcfDUwUHORtO1NTROUvZynCXwSf/Leo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"/></defs></svg></span>'
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
                    back.innerHTML = '<span class="content-animation"><svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect width="40" height="40" fill="url(#pattern0_2001_6)"/><defs><pattern id="pattern0_2001_6" patternContentUnits="objectBoundingBox" width="1" height="1"><use xlink:href="#image0_2001_6" transform="scale(0.00543478)"/></pattern><image id="image0_2001_6" width="184" height="184" preserveAspectRatio="none" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALgAAAC4CAMAAABn7db1AAABO1BMVEUAAAD////////////////////////////////////////////////////////////////////////////////////////////////////////////////JIxX////SKhnbMxzmQiHhOyD2i3b/bCz/2FHcPCT/ZSPnSy3NMiX/8Oz3kHv+9/X/XxjgQSXuc1zrbFf43dr/4FPmMxHoVzzjTTXYKhL3087/593yfWfEEAL74t72ycPzqp3QPzL66Ob/nXL/lDnus63pX0f/cTL/lmj/jFv/eTT/2cn1wbjrZU3/xq/bZVnrq6XxhXH/wEn2uK3ropvmk4vccGfYWU7/ekH/pUD/hTXQIAz/4NPnm5T/rIrih3/UT0X/z7n/vaLwoJLxl4fvjXzkcmP/z07mfG//g0//skT/tZbotC6SAAAAHXRSTlMACvffyJAb7NZiQSNJu1oUqfGdfW045rRTKTF0hqHxYJUAAA7BSURBVHja7Jm9buJAEIDX/B4cgQSS3JGLthprJYQbV5RY8p/kgspYERI0KPD+T3BezzhjID1T5KuWdfMxDDOza/XDD3fCmfR6k0njc284GM8nSjiTUUeXtN7nCnl50BXd30oybx1NtAaODXdX17RflFze2prpluZTzfSHSioOerM5eROvYrMFPZlfmuDfQCROH/0WK33BckUbLaG1ZdjSliw0u6VmFmvPO+Oyp0QyQ08D4K0b3pHdwJiPlEiw9K1CIHP2BoPiAyWSZ8zoECpz9mbxsRLJCHM8BDInb/niv59YHM3Rm8X/KnkMx+MZRhygNv9AbxZ/HIxHcyWI3uzxSdckX+a5ARavaU+flRTGFy3yE2rIm8SZP29KBIOWbhIDcyHOtEWYj/QlaxvoJDgFYEwYnIpKfKEveBQwtTjti7EkTdfW++i6/rYINr7rbq14lqa1u5QeOqyd94fDeZ17nik9N26J7/uuBUo8D+Ld4ZCldZrfP+Qd1N7F4JXSBiwoThwTynP7PI8/pMxbWAczzwBB4swJH5H950KIeJ9qYJPg6DYJgDG5FHGM+M5jty0r36gbs5eSKlhUFrFnam//VtynPPeSjE519/9zzqionEMKuvsdQT2+aC1lMu9p4iPGmHN+Mz62oUwTHQmnz2f9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"/></defs></svg></span>';
                } else {
                    back.classList.add('gem');
                    back.innerHTML = '<span class="content-animation"><svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect width="32" height="32" fill="url(#pattern0_2001_3)"/><defs><pattern id="pattern0_2001_3" patternContentUnits="objectBoundingBox" width="1" height="1"><use xlink:href="#image0_2001_3" transform="scale(0.00543478)"/></pattern><image id="image0_2001_3" width="184" height="184" preserveAspectRatio="none" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALgAAAC4CAMAAABn7db1AAABEVBMVEUAAAD///////////////////////////////////////////////////////////////////////////////////////////////////////////////+l/3pyyi+H7l+R71qj9W3J/7Btxiis/4RjwxqP7lV87UvQ/7mK8WPC/6Xt/+aZ9FyZ8nSd9WaA7VOf/3GC7UHy/u5zzzjl/duw+ICE6Fb4//aV8WTe/c6I7UzW/8Kn9m+8+Jyd+HCj9YCp9Xm1+JSd33qE1VfG+K582key+IuA4U131T27/piq9YmR8Gra99LP+rx3z0LG8Lq16Z5lyCmo44nU9cuM2WR80kzO8sO/96SY/2W+7KyS224TTOiqAAAAHHRSTlMA0K0J6RvEEHiNYz/ypS3ggvlV2SRLs266nZY26GSm5wAACzNJREFUeNrsmv1X0lAcxrMSS9PsRctam27iZWxsNSncQQIUMUGxMvXU//+HdHEbD1x3t+/m2y8851TniOnHD899nY+mmWaaaaaZZppppplmmmnuIrMrz9Ye31sWn88vPbkV7icL79YKM/eWwury69lbwH67PKPce54urtwQe275qfIwWV24Cff8S+Xh8nwud7mfKw+amZzS51aVB87ThVzcBeWGqdWUG+ZFnjG6iP9fvWxWsqffK7daXzOne+nXQL6UmXtZieL3XJYrR/qunSutEnqedS36qISx9hjT8sRt10t6y9nIEY7uj+aWjOCrUUsGxUMzF3ezruulsgPyLGHuSb6yrES+B0XjwMzDXSmVdE5+lI/cZCwiX8slfL+oGmoqZMyHTJ1z85S6dnbsXUfTmFYNlb/N0fCfRZUnrSt97Xoadf0q+Wq+o3HyZo6WP1au4m0PwSVdgVy/Ig5f1g25hzXfyE5uajysnln5wisIHyaJ2+RmLllswXlQ84xN4XGzK18MhZ8bqprWFZf5itefIHf7Orjz1NwMv44frvxU5R8F4cYPU4odjH7fZK6GlK+4ka92JuEbGk+elq9FwiNwVZORm83jYLrv4TNYOyg4lOu7TsamCMppJ6IlQbi8K27/TIliNd1o5RF8Yx0iN0VUvkwC/xDu7fY5eNQVqfCOF3z2SbcfDUwUHORtO1NTROUvZynCXwSf/Leo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"/></defs></svg></span>';
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