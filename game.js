// Wait for the window to load
window.onload = function() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Could not find canvas element');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get 2d context');
        return;
    }

    console.log('Canvas initialized:', canvas.width, 'x', canvas.height);

    const GRAVITY = 0.5;
    const JUMP_FORCE = -16;
    const GROUND_Y = canvas.height - 100;

    // Create and load obstacle cat image and Judy image
    const catImage = new Image();
    const judyImage = new Image();
    const rainingCatImage = new Image();
    catImage.src = 'images/kitton_two.png';  // Purple cat for obstacles
    judyImage.src = 'images/JudyShark.png';  // Judy's character image
    rainingCatImage.src = 'images/kitton_one.png';  // Pink cat for rain

    // Track raining cats
    let rainingCats = [];
    let lastRainTime = 0;
    const RAIN_INTERVAL = 5000; // 5 seconds in milliseconds (changed from 10000)
    const RAIN_START_FRAME = 300; // At 60fps, this is 5 seconds into gameplay (changed from 600)

    // Sprite definitions
    const sprites = {
        judy: {
            width: 80,
            height: 120,  // Increased height for better proportions
            x: 50,
            y: GROUND_Y - 120,  // Adjusted y position for new height
            baseY: GROUND_Y - 120,  // Adjusted base Y for new height
            velocityY: 0,
            isJumping: false,
            draw() {
                if (judyImage.complete) {
                    // Draw Judy image
                    ctx.drawImage(judyImage, this.x, this.y, this.width, this.height);
                } else {
                    // Fallback to red square if image hasn't loaded
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                    ctx.fillRect(this.x, this.y, this.width, this.height);
                }
            }
        }
    };

    // Game state
    let score = 0;
    let obstacles = [];
    let gameSpeed = 5;
    let gameOver = false;
    let preGame = true;  // New state for pre-game
    let frameCount = 0;
    let lastScoreUpdate = 0;
    let useScoreSound = true;  // Toggle for alternating sounds

    // Audio setup
    let audioContext = null;
    let scoreLoopSource = null;
    let audioInitialized = false;
    let audioLoading = false;  // Add loading state
    const sounds = {
        background: { path: 'audio/background.m4a', buffer: null, source: null },
        score: { path: 'audio/score.m4a', buffer: null },
        start: { path: 'audio/start.m4a', buffer: null },
        meow: { path: 'audio/meow.m4a', buffer: null }
    };

    // Game mode state
    let isGameMode = true;  // true for game, false for slides

    // Slide system setup and styles
    const slideStyles = {
        fonts: {
            title: '48px "Helvetica Neue", Arial, sans-serif',
            body: '24px "Helvetica Neue", Arial, sans-serif',
            button: '16px "Helvetica Neue", Arial, sans-serif'
        },
        colors: {
            background: '#ffffff',
            text: '#333333',
            accent: '#4a90e2',
            disabled: '#cccccc'  // Add disabled color
        },
        transition: {
            duration: 500,  // milliseconds
            lastTime: 0,
            current: 1.0   // opacity
        }
    };

    const slides = [
        { 
            id: 2, 
            content: "Judy DJ'd at Gambier one year - MARIAH CAREY WENT OFFFFFF",
            author: "Sara Doole",
            position: { x: 0.5, y: 0.4 }  // proportional positioning
        },
        { 
            id: 1, 
            content: "Judy would always help me with Hootsuite to correct external ids for their students who had issues logging in! She used to resolve those requests in 10 minutes flat by the time she found her groove!",
            author: "Sara Doole",
            position: { x: 0.5, y: 0.4 }
        },
        { 
            id: 3, 
            content: "For memories of working with Judy, it's really hard to pick, but here are a few random ones:\nanswering all 100000 of my questions when I started at Thinkific\ndesigning, building, and then sunsetting the billing API together\ncelebrating the joy of taxes\ncountless games of Gartic Phone and Drawsaurus",
            author: "Charlie De Git",
            position: { x: 0.5, y: 0.4 }
        },
        { 
            id: 4, 
            content: "she had these like... fish flip flops? Is that a real memory?",
            author: "Ashley Fisher",
            position: { x: 0.5, y: 0.4 }
        },
        { 
            id: 5, 
            content: "She helped me buy my first car during the pandemic :driver: also was a great mentor for me during my co-op days and led the original build of group analysts. Was on team :rugrats: when we were just a team of 3 too.\nOne day the devops guild was doing a postgres db upgrade and stayed late after a thinker Thursday. Think we had to do the upgrade around midnight so we holed up in the boardroom of the office and Judy put on the finale of love is blind for us to watch. Also had a couple other show nights at the office for Rick n Morty",
            author: "Roxy Promhouse",
            position: { x: 0.5, y: 0.4 }
        },
        {
            id: 6,
            content: "When I moved from Support to Engineering she helped me carry my desk across the office. Felt very symbolic.",
            author: "Ashley Fisher",
            position: { x: 0.5, y: 0.4 }
        },
        {
            id: 7,
            content: "I think she also helped another person buy her first bike and took her out for test rides until she felt really comfortable on it :heart:",
            author: "Jillian Evin",
            position: { x: 0.5, y: 0.4 }
        }
    ];
    let currentSlide = 0;
    let isTransitioning = false;

    // Create mode switch button with styled appearance
    const modeSwitchBtn = document.createElement('button');
    modeSwitchBtn.textContent = 'Switch to Slides';
    Object.assign(modeSwitchBtn.style, {
        position: 'absolute',
        left: '10px',
        top: '10px',
        padding: '10px 20px',
        font: slideStyles.fonts.button,
        backgroundColor: slideStyles.colors.accent,
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
    });
    document.body.appendChild(modeSwitchBtn);

    // Create slide navigation buttons with shared styles
    const createNavButton = (text, left) => {
        const btn = document.createElement('button');
        btn.textContent = text;
        Object.assign(btn.style, {
            position: 'absolute',
            left: left,
            bottom: '10px',
            padding: '10px 20px',
            font: slideStyles.fonts.button,
            backgroundColor: slideStyles.colors.accent,
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'none',
            transition: 'background-color 0.3s, opacity 0.3s'  // Smooth transition for state changes
        });
        document.body.appendChild(btn);
        return btn;
    };

    const prevSlideBtn = createNavButton('Previous', '10px');
    const nextSlideBtn = createNavButton('Next', '100px');

    // Function to update button states
    function updateButtonStates() {
        // Disable Previous button on first slide
        if (currentSlide === 0) {
            prevSlideBtn.style.backgroundColor = slideStyles.colors.disabled;
            prevSlideBtn.style.cursor = 'not-allowed';
            prevSlideBtn.style.opacity = '0.5';
        } else {
            prevSlideBtn.style.backgroundColor = slideStyles.colors.accent;
            prevSlideBtn.style.cursor = 'pointer';
            prevSlideBtn.style.opacity = '1';
        }

        // Disable Next button on last slide
        if (currentSlide === slides.length - 1) {
            nextSlideBtn.style.backgroundColor = slideStyles.colors.disabled;
            nextSlideBtn.style.cursor = 'not-allowed';
            nextSlideBtn.style.opacity = '0.5';
        } else {
            nextSlideBtn.style.backgroundColor = slideStyles.colors.accent;
            nextSlideBtn.style.cursor = 'pointer';
            nextSlideBtn.style.opacity = '1';
        }
    }

    // Function to draw slides with transitions
    function drawSlide() {
        const now = performance.now();
        const delta = now - slideStyles.transition.lastTime;
        
        // Handle fade transition
        if (isTransitioning) {
            slideStyles.transition.current -= delta / slideStyles.transition.duration;
            if (slideStyles.transition.current <= 0) {
                slideStyles.transition.current = 0;
                isTransitioning = false;
            }
        } else {
            slideStyles.transition.current += delta / slideStyles.transition.duration;
            if (slideStyles.transition.current >= 1) {
                slideStyles.transition.current = 1;
            }
        }
        
        slideStyles.transition.lastTime = now;

        // Clear and set background
        ctx.fillStyle = slideStyles.colors.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Apply fade transition
        ctx.globalAlpha = slideStyles.transition.current;
        
        const slide = slides[currentSlide];
        
        // Draw content
        ctx.font = slideStyles.fonts.body;
        ctx.fillStyle = slideStyles.colors.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            slide.content, 
            canvas.width * slide.position.x, 
            canvas.height * slide.position.y
        );

        // Draw author in italics
        ctx.font = slideStyles.fonts.body.replace('Helvetica Neue', 'italic Helvetica Neue');
        ctx.fillText(
            `- ${slide.author}`, 
            canvas.width * slide.position.x, 
            canvas.height * slide.position.y + 50
        );
        
        // Draw slide number
        ctx.font = slideStyles.fonts.body;
        ctx.fillText(
            `${currentSlide + 1}/${slides.length}`, 
            canvas.width * 0.5, 
            canvas.height - 30
        );
        
        // Reset global alpha
        ctx.globalAlpha = 1.0;
    }

    // Slide navigation handlers with transition
    function changeSlide(direction) {
        // Check if we can move in the requested direction
        const newSlide = currentSlide + direction;
        if (newSlide < 0 || newSlide >= slides.length) {
            return; // Don't allow navigation beyond bounds
        }

        if (!isTransitioning) {
            isTransitioning = true;
            slideStyles.transition.current = 1.0;
            slideStyles.transition.lastTime = performance.now();
            
            setTimeout(() => {
                currentSlide = newSlide;
                isTransitioning = false;
                slideStyles.transition.current = 0;
                updateButtonStates(); // Update button states after slide change
            }, slideStyles.transition.duration / 2);
        }
    }

    prevSlideBtn.addEventListener('click', () => {
        if (currentSlide > 0) { // Only allow if not on first slide
            changeSlide(-1);
        }
    });
    
    nextSlideBtn.addEventListener('click', () => {
        if (currentSlide < slides.length - 1) { // Only allow if not on last slide
            changeSlide(1);
        }
    });

    // Mode switch handler
    modeSwitchBtn.addEventListener('click', () => {
        isGameMode = !isGameMode;
        modeSwitchBtn.textContent = isGameMode ? 'Switch to Slides' : 'Switch to Game';
        prevSlideBtn.style.display = isGameMode ? 'none' : 'block';
        nextSlideBtn.style.display = isGameMode ? 'none' : 'block';
        
        if (isGameMode) {
            // Resume game state if needed
        } else {
            // Pause game state if needed
            gameOver = true;  // This will pause the game
            stopBackgroundMusic();
            // Reset transition state
            isTransitioning = false;
            slideStyles.transition.current = 1.0;
            slideStyles.transition.lastTime = performance.now();
            updateButtonStates(); // Update button states when switching to slides mode
        }
    });

    // Function to ensure audio context is running
    async function initAudioContext() {
        try {
            if (!audioContext) {
                console.log('Creating new AudioContext');
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            if (audioContext.state === 'suspended') {
                console.log('Resuming AudioContext');
                await audioContext.resume();
            }

            return audioContext;
        } catch (error) {
            console.error('Error initializing AudioContext:', error);
            return null;
        }
    }

    // Load audio files
    async function loadAudio() {
        if (audioLoading) {
            console.log('Audio already loading, waiting...');
            return;
        }

        try {
            audioLoading = true;
            await initAudioContext();
            
            for (const [key, sound] of Object.entries(sounds)) {
                if (!sound.buffer) {
                    console.log(`Loading audio: ${key}`);
                    const response = await fetch(sound.path);
                    const arrayBuffer = await response.arrayBuffer();
                    sound.buffer = await audioContext.decodeAudioData(arrayBuffer);
                    console.log(`Successfully loaded audio: ${key}`);
                }
            }
            
            audioInitialized = true;
            console.log('All audio loaded successfully');
        } catch (error) {
            console.error('Error loading audio:', error);
            audioInitialized = false;
        } finally {
            audioLoading = false;
        }
    }

    // Play sound function with optional fade out and volume control
    async function playSound(soundName, loop = false, fadeOut = false, volume = 1.0) {
        try {
            await initAudioContext();
            const sound = sounds[soundName];
            if (sound && sound.buffer) {
                // Only stop previous instance if it's the background music
                if (soundName === 'background' && sound.source && loop) {
                    try {
                        sound.source.stop();
                    } catch (e) {
                        // Ignore errors from already stopped sources
                    }
                }
                
                const source = audioContext.createBufferSource();
                const gainNode = audioContext.createGain();
                
                source.buffer = sound.buffer;
                source.loop = loop;
                
                gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
                
                source.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                source.start();
                
                if (fadeOut) {
                    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 2.0);
                    setTimeout(() => {
                        try {
                            source.stop();
                        } catch (e) {
                            // Ignore errors from already stopped sources
                        }
                    }, 2000);
                }
                
                if (soundName === 'background') {
                    sound.source = source;
                }

                return { source, gainNode };
            }
        } catch (error) {
            console.error('Error playing sound:', error);
        }
        return null;
    }

    // Function to start background music
    async function startBackgroundMusic() {
        console.log('Starting background music');
        try {
            // Make sure audio is initialized
            if (!audioInitialized || !audioContext) {
                console.log('Audio not initialized, attempting to initialize...');
                await loadAudio();
            }

            // Make sure AudioContext is running
            await initAudioContext();

            // Stop any existing background music
            stopBackgroundMusic();

            const source = audioContext.createBufferSource();
            const gainNode = audioContext.createGain();
            
            source.buffer = sounds.background.buffer;
            source.loop = true;
            
            gainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
            
            source.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            source.start(0);
            sounds.background.source = source;
            console.log('Background music started successfully');
        } catch (error) {
            console.error('Error starting background music:', error);
        }
    }

    // Function to stop background music
    function stopBackgroundMusic() {
        try {
            const backgroundSound = sounds['background'];
            if (backgroundSound && backgroundSound.source) {
                backgroundSound.source.stop();
                backgroundSound.source = null;
            }
        } catch (error) {
            console.error('Error stopping background music:', error);
        }
    }

    // Create a rain of cats
    function startCatRain() {
        rainingCats.push({
            x: Math.random() * (canvas.width - 100),
            y: -50,
            speed: 3 + Math.random() * 2,
            rotation: Math.random() * Math.PI * 2,
            width: 100,
            height: 84
        });

        // Play meow sound
        if (audioInitialized) {
            playSound('meow', false, false, 5.0);
        }
    }

    // Update function
    function update() {
        if (gameOver || preGame) return;  // Don't update game state in pre-game
        
        frameCount++;
        
        // Only start rain checks after playing for 10 seconds
        if (frameCount > RAIN_START_FRAME) {
            // Check if it's time for rain
            const currentTime = Date.now();
            if (currentTime - lastRainTime >= RAIN_INTERVAL) {
                startCatRain();
                lastRainTime = currentTime;
            }
        }

        // Update raining cats
        rainingCats = rainingCats.filter(cat => {
            cat.y += cat.speed;
            cat.rotation += 0.05;
            return cat.y < canvas.height;
        });
        
        // Generate new obstacles
        if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - 420) {
            obstacles.push({
                x: canvas.width,
                y: GROUND_Y - 70,  // Position on ground
                width: 70,
                height: 70,
                rotation: 0,
                passed: false
            });
        }
        
        // Update Judy's position
        if (sprites.judy.isJumping) {
            sprites.judy.velocityY += GRAVITY;
            sprites.judy.y += sprites.judy.velocityY;
            
            // Check if landed
            if (sprites.judy.y >= sprites.judy.baseY) {
                sprites.judy.y = sprites.judy.baseY;
                sprites.judy.isJumping = false;
                sprites.judy.velocityY = 0;
            }
        }
        
        // Update obstacles and check for score
        obstacles = obstacles.filter(obstacle => {
            obstacle.x -= gameSpeed;
            
            // Update rotation
            obstacle.rotation += (Math.PI * 2) / 180;
            
            // Check if Judy has successfully passed this obstacle
            if (!obstacle.passed && obstacle.x + obstacle.width < sprites.judy.x) {
                obstacle.passed = true;
                score++;
                document.getElementById('score').textContent = 'Score: ' + score;
                
                // Score sound removed but will be added back later
            }
            
            // Collision detection
            if (
                sprites.judy.x < obstacle.x + obstacle.width &&
                sprites.judy.x + sprites.judy.width > obstacle.x &&
                sprites.judy.y < obstacle.y + obstacle.height &&
                sprites.judy.y + sprites.judy.height > obstacle.y
            ) {
                if (!gameOver) {
                    gameOver = true;
                    stopBackgroundMusic();
                    playSound('start', false, false, 0.6);
                }
            }
            
            return obstacle.x > -120;
        });

        // Collision detection for raining cats
        rainingCats.forEach(cat => {
            if (
                sprites.judy.x < cat.x + cat.width &&
                sprites.judy.x + sprites.judy.width > cat.x &&
                sprites.judy.y < cat.y + cat.height &&
                sprites.judy.y + sprites.judy.height > cat.y
            ) {
                if (!gameOver) {
                    gameOver = true;
                    stopBackgroundMusic();
                    playSound('start', false, true, 0.6);
                }
            }
        });
    }

    function drawBackground() {
        // Draw sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');  // Sky blue
        gradient.addColorStop(1, '#E0F6FF');  // Light blue
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw ground
        ctx.fillStyle = '#90EE90';  // Light green
        ctx.fillRect(0, GROUND_Y + 2, canvas.width, canvas.height - GROUND_Y - 2);
    }

    function drawObstacles() {
        // Draw regular obstacles
        obstacles.forEach(obstacle => {
            ctx.save();
            ctx.translate(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
            ctx.rotate(obstacle.rotation);
            
            if (catImage.complete) {
                ctx.drawImage(
                    catImage,
                    -obstacle.width/2,
                    -obstacle.height/2,
                    obstacle.width,
                    obstacle.height
                );
            } else {
                ctx.fillStyle = '#DDA0DD';
                ctx.fillRect(
                    -obstacle.width/2,
                    -obstacle.height/2,
                    obstacle.width,
                    obstacle.height
                );
            }
            ctx.restore();
        });

        // Draw raining cats
        rainingCats.forEach(cat => {
            ctx.save();
            ctx.translate(cat.x + cat.width/2, cat.y + cat.height/2);
            ctx.rotate(cat.rotation);
            
            if (rainingCatImage.complete) {
                ctx.drawImage(
                    rainingCatImage,
                    -cat.width/2,
                    -cat.height/2,
                    cat.width,
                    cat.height
                );
            } else {
                ctx.fillStyle = '#FFB6C1';
                ctx.fillRect(
                    -cat.width/2,
                    -cat.height/2,
                    cat.width,
                    cat.height
                );
            }
            ctx.restore();
        });
    }

    function drawScore() {
        ctx.fillStyle = '#333';
        ctx.font = '24px Arial';
        ctx.fillText(`Score: ${score}`, 20, 40);
    }

    // Draw game overlay (for pre-game and game over states)
    function drawOverlay(text) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.fillText(text, canvas.width/2 - 100, canvas.height/2);
        ctx.font = '24px Arial';
        ctx.fillText('Press SPACE to start', canvas.width/2 - 100, canvas.height/2 + 40);
    }

    // Modify the game loop to handle both modes
    function gameLoop() {
        if (isGameMode) {
            // Original game drawing code
            drawBackground();
            ctx.fillStyle = '#333';
            ctx.fillRect(0, GROUND_Y, canvas.width, 2);
            drawObstacles();
            sprites.judy.draw();
            drawScore();

            if (!preGame) {
                update();
            }

            if (preGame) {
                drawOverlay('Pre-game');
            } else if (gameOver) {
                drawOverlay('Game Over!');
            }
        } else {
            // Draw slide content
            drawSlide();
        }

        requestAnimationFrame(gameLoop);
    }

    // Reset game state
    function resetGame() {
        stopBackgroundMusic();  // Stop any existing background music
        gameOver = false;
        preGame = false;
        score = 0;
        frameCount = 0;
        lastScoreUpdate = 0;
        obstacles = [];
        rainingCats = [];
        lastRainTime = 0;
        sprites.judy.y = sprites.judy.baseY;
        sprites.judy.velocityY = 0;
        sprites.judy.isJumping = false;
    }

    // Add click and keydown listeners for audio initialization
    function setupAudioInitialization() {
        const initAudio = async () => {
            console.log('Initializing audio from user interaction');
            await loadAudio();
            document.removeEventListener('click', initAudio);
            document.removeEventListener('keydown', initAudio);
        };

        document.addEventListener('click', initAudio);
        document.addEventListener('keydown', initAudio);
    }

    // Controls
    document.addEventListener('keydown', async (event) => {
        if (event.code === 'Space') {
            event.preventDefault();
            console.log('Space pressed, current state:', { preGame, gameOver, audioInitialized });
            
            try {
                if (preGame) {
                    console.log('Starting game from pre-game');
                    resetGame();
                    await startBackgroundMusic();  // Wait for background music to start
                } else if (gameOver) {
                    console.log('Restarting game from game over');
                    resetGame();
                    await startBackgroundMusic();  // Wait for background music to start
                } else if (!sprites.judy.isJumping) {
                    sprites.judy.isJumping = true;
                    sprites.judy.velocityY = JUMP_FORCE;
                    if (audioInitialized) {
                        await playSound('start', false, false, 0.45);
                    }
                }
            } catch (error) {
                console.error('Error in keydown handler:', error);
            }
        }
    });

    // Start the game loop and set up initial state
    requestAnimationFrame(gameLoop);
    setupAudioInitialization();
}; 