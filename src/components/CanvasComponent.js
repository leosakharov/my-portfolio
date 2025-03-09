import React, { useEffect, useRef, useState } from 'react';
import ambientAudio from '../assets/audio/Usca_1.mp3';

const CanvasComponent = () => {
    const canvasRef = useRef(null);
    const audioRef = useRef(null);
    const animationRef = useRef(null);
    const playButtonRef = useRef(null);
    const playCanvasRef = useRef(null);
    const [audioPlaying, setAudioPlaying] = useState(false);
    const [audioLoaded, setAudioLoaded] = useState(true); // Set to true by default to ensure play button always shows
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);

    // Helper function to detect iOS devices
    const isIOS = () => {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    };

    // Function to draw the play button
    const drawPlayButton = () => {
        if (playCanvasRef.current) {
            const playCanvas = playCanvasRef.current;
            const playCtx = playCanvas.getContext('2d');
            const size = window.innerWidth < 768 ? 100 : 120;
            
            // Update canvas size if needed
            if (playCanvas.width !== size || playCanvas.height !== size) {
                playCanvas.width = size;
                playCanvas.height = size;
            }
            
            // Clear canvas with background color
            playCtx.fillStyle = '#f5f5f5';
            playCtx.fillRect(0, 0, size, size);
            
            // Draw circle
            playCtx.beginPath();
            playCtx.arc(size/2, size/2, size/2 - 5, 0, Math.PI * 2);
            playCtx.strokeStyle = '#222222';
            playCtx.lineWidth = 2.5;
            playCtx.globalAlpha = 0.8;
            playCtx.stroke();
            
            // Draw hand-drawn play triangle icon
            drawPlayTriangle(playCtx, size/2, size/2, size * 0.3);
        }
    };
    
    // Draw the play button on component mount and when window resizes
    useEffect(() => {
        // Initial draw
        drawPlayButton();
        
        // Add resize handler for play button
        const handlePlayButtonResize = () => {
            drawPlayButton();
        };
        
        // Listen for resize events
        window.addEventListener('resize', handlePlayButtonResize);
        
        // Cleanup
        return () => {
            window.removeEventListener('resize', handlePlayButtonResize);
        };
    }, []);
    
    // Function to draw a slightly imperfect, hand-drawn play triangle icon
    const drawPlayTriangle = (ctx, centerX, centerY, size) => {
        // Save current context state
        ctx.save();
        
        // Add a subtle jitter function for hand-drawn effect
        const jitter = (amount) => (Math.random() - 0.5) * amount;
        
        // Triangle points with slight randomness
        const leftX = centerX - size/3 + jitter(1);
        const topY = centerY - size/2 + jitter(1);
        const bottomY = centerY + size/2 + jitter(1);
        const rightX = centerX + size/3 + jitter(1);
        
        // Draw the triangle with slightly imperfect lines
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.85;
        
        ctx.beginPath();
        
        // Start at top-left point
        ctx.moveTo(leftX, topY);
        
        // Draw top line to right point with slight waviness
        const topSegments = 3;
        for (let i = 1; i <= topSegments; i++) {
            const x = leftX + (rightX - leftX) * (i / topSegments);
            const y = topY + (centerY - topY) * (i / topSegments) + jitter(1.5);
            ctx.lineTo(x, y);
        }
        
        // Draw right side to bottom with slight waviness
        const rightSegments = 3;
        for (let i = 1; i <= rightSegments; i++) {
            const y = centerY + (bottomY - centerY) * (i / rightSegments);
            const x = rightX - (rightX - leftX) * (i / rightSegments) + jitter(1.5);
            ctx.lineTo(x, y);
        }
        
        // Draw bottom line back to left point with slight waviness
        const bottomSegments = 3;
        for (let i = 1; i <= bottomSegments; i++) {
            const x = leftX + jitter(1);
            const y = bottomY - (bottomY - topY) * (i / bottomSegments) + jitter(1.5);
            ctx.lineTo(x, y);
        }
        
        ctx.closePath();
        ctx.stroke();
        
        // Restore original context state
        ctx.restore();
    };
    
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Log device info for debugging
        console.log('Device width:', window.innerWidth);
        console.log('Is iOS:', isIOS());
        
        // Add touch interaction variables
        let lastTouchX = null;
        let lastTouchY = null;
        let touchActive = false;

        // Set background color to light gray
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add signature in bottom left corner on initial load with responsive font size
        const isMobile = window.innerWidth < 768;
        ctx.font = `${isMobile ? '12px' : '14px'} "Diatype Variable", sans-serif`;
        ctx.fillStyle = '#222222';
        ctx.globalAlpha = 0.85;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText('continuous playground for audio and web ', 20, canvas.height - 20);

        // Create audio element but don't play it yet
        const audio = new Audio(ambientAudio);
        audio.preload = 'auto'; // Force preloading
        audioRef.current = audio;
        
        // Mark when audio is loaded, but we already set audioLoaded to true by default
        // This is just for tracking purposes now
        audio.addEventListener('canplaythrough', () => {
            console.log('Audio loaded and ready to play');
        }, { once: true });

        // Set up initial parameters
        let centerX = canvas.width / 2;
        let centerY = canvas.height / 2;
        
        // Line style - black pen-like appearance
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.8;

        // Handle window resize
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            ctx.fillStyle = '#f5f5f5';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
                        
            // Reset drawing style after resize
            ctx.strokeStyle = '#222222';
            ctx.lineWidth = 1.5;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.globalAlpha = 0.8;
          
        };

        // Handle touch events for mobile interaction
        const handleTouchStart = (e) => {
            if (!audioPlaying) return;
            const touch = e.touches[0];
            lastTouchX = touch.clientX;
            lastTouchY = touch.clientY;
            touchActive = true;
            
            // Draw a small circle at touch point
            ctx.beginPath();
            ctx.arc(lastTouchX, lastTouchY, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#222222';
            ctx.fill();
        };
        
        const handleTouchMove = (e) => {
            if (!touchActive || !audioPlaying) return;
            e.preventDefault(); // Prevent scrolling while drawing
            
            const touch = e.touches[0];
            const currentX = touch.clientX;
            const currentY = touch.clientY;
            
            // Draw a line from last position to current
            ctx.beginPath();
            ctx.moveTo(lastTouchX, lastTouchY);
            ctx.lineTo(currentX, currentY);
            ctx.strokeStyle = '#222222';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.stroke();
            
            lastTouchX = currentX;
            lastTouchY = currentY;
        };
        
        const handleTouchEnd = () => {
            touchActive = false;
            lastTouchX = null;
            lastTouchY = null;
        };
        
        // Add touch event listeners
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd);
        canvas.addEventListener('touchcancel', handleTouchEnd);
        
        window.addEventListener('resize', handleResize);
        
        // Cleanup function
        return () => {
            window.removeEventListener('resize', handleResize);
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);
            canvas.removeEventListener('touchcancel', handleTouchEnd);
            cancelAnimationFrame(animationRef.current);
            if (audioRef.current) {
                audioRef.current.pause();
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    // Function to start audio and visualization when user clicks play button
    const startAudio = () => {
        const audio = audioRef.current;
        if (!audio) return;
        
        // Show loading indicator or feedback if needed
        console.log('Starting audio playback...');
        
        // Special handling for iOS devices
        const isIOSDevice = isIOS();
        if (isIOSDevice) {
            console.log('iOS device detected, using special audio handling');
            
            // iOS requires user interaction to unlock audio
            // We'll try to play a short silent sound first
            const silentPlay = () => {
                audio.play()
                    .then(() => {
                        audio.pause();
                        audio.currentTime = 0;
                        console.log('iOS audio context unlocked');
                        setupAudioProcessing();
                    })
                    .catch(error => {
                        console.error('iOS audio unlock failed:', error);
                        // Still try to proceed anyway
                        setupAudioProcessing();
                    });
            };
            
            silentPlay();
        } else {
            // Non-iOS devices can proceed normally
            setupAudioProcessing();
        }
    };
    
    // Separate function to set up audio processing
    const setupAudioProcessing = () => {
        const audio = audioRef.current;
        if (!audio) return;
        
        try {
            // Create audio context after user interaction
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = audioContext;
            
            // Resume the audio context (needed for some browsers)
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            const analyser = audioContext.createAnalyser();
            analyserRef.current = analyser;
            
            // Connect the audio element to the analyser
            const source = audioContext.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            
            // Use a smaller FFT size on mobile for better performance
            const isMobile = window.innerWidth < 768;
            analyser.fftSize = isMobile ? 512 : 1024;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            dataArrayRef.current = dataArray;
            
            // Start playing the audio
            startPlayback();
        } catch (error) {
            console.error('Audio context setup error:', error);
            // Try to play anyway without visualization
            startPlayback();
        }
    };
    
    // Function to start actual audio playback
    const startPlayback = () => {
        const audio = audioRef.current;
        if (!audio) return;
        
        audio.play().then(() => {
            setAudioPlaying(true);
            
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            // Get references to the audio analyzer and data array
            const analyser = analyserRef.current;
            const dataArray = dataArrayRef.current;
            
            // If we don't have an analyzer (fallback mode), just return after setting audioPlaying
            if (!analyser || !dataArray) {
                console.log('Running in fallback mode without audio visualization');
                return;
            }
            
            // Set up grid parameters for structured drawing
            const gridSize = Math.min(canvas.width, canvas.height) / 4;
            const gridRows = Math.ceil(canvas.height / gridSize);
            const gridCols = Math.ceil(canvas.width / gridSize);
            
            // Create grid cells with slight randomness
            const gridCells = [];
            for (let row = 0; row < gridRows; row++) {
                for (let col = 0; col < gridCols; col++) {
                    // Add some randomness to grid cell positions
                    const jitterX = (Math.random() - 0.5) * (gridSize * 0.2);
                    const jitterY = (Math.random() - 0.5) * (gridSize * 0.2);
                    
                    gridCells.push({
                        x: col * gridSize + jitterX,
                        y: row * gridSize + jitterY,
                        width: gridSize + (Math.random() - 0.5) * (gridSize * 0.1),
                        height: gridSize + (Math.random() - 0.5) * (gridSize * 0.1),
                        active: false,
                        fillChance: Math.random(),
                        lastActive: 0
                    });
                }
            }
            
            // Set up a single control point for the pen-like drawing
            let penPosition = {
                x: canvas.width / 2,
                y: canvas.height / 2,
                prevX: canvas.width / 2,
                prevY: canvas.height / 2,
                gridX: Math.floor(canvas.width / 2 / gridSize),
                gridY: Math.floor(canvas.height / 2 / gridSize)
            };
            
            // Function to get average amplitude in a frequency range
            function getAverageAmplitude(dataArr, startBin, endBin) {
                let sum = 0;
                for (let i = startBin; i < endBin; i++) {
                    sum += dataArr[i];
                }
                return sum / (endBin - startBin);
            }
            
            // Track time for smoother transitions
            let lastTime = Date.now();
            
            // Add noise factors that change over time
            let noiseFactor = 1.0;
            let noiseChangeRate = 0.5 + Math.random() * 0.5; // How quickly noise changes
            let noiseChangeTimer = 0; // Timer for noise changes
            let nextNoiseTarget = 0.5 + Math.random() * 1.5; // Target noise level
            
            // Track filled areas
            const filledAreas = [];
            
            // Set up the drawing function that uses audio data
            function draw() {
                const currentTime = Date.now();
                const deltaTime = (currentTime - lastTime) / 1000; // Time in seconds
                lastTime = currentTime;
                
                // Update noise factor over time
                noiseChangeTimer += deltaTime;
                if (noiseChangeTimer >= noiseChangeRate) {
                    // Set a new target noise level and change rate
                    nextNoiseTarget = 0.5 + Math.random() * 1.5;
                    noiseChangeRate = 0.5 + Math.random() * 1.5;
                    noiseChangeTimer = 0;
                }
                
                // Smoothly interpolate current noise factor toward target
                noiseFactor += (nextNoiseTarget - noiseFactor) * deltaTime * 1.5;
                
                // Add some small random fluctuations to the noise factor
                noiseFactor += (Math.random() - 0.5) * 0.1 * deltaTime;
                
                // Keep noise factor within reasonable bounds
                noiseFactor = Math.max(0.2, Math.min(noiseFactor, 2.5));
                
                // Don't clear the canvas to leave a trace
                analyser.getByteFrequencyData(dataArray);
                
                // Analyze different frequency ranges for more musical responsiveness
                const bassRange = getAverageAmplitude(dataArray, 0, 10) / 255;
                const midRange = getAverageAmplitude(dataArray, 10, 100) / 255;
                const highRange = getAverageAmplitude(dataArray, 100, 200) / 255;
                
                // Overall energy of the music
                const musicEnergy = (bassRange * 3 + midRange * 2.5 + highRange * 1.5);
                
                // Save previous position
                penPosition.prevX = penPosition.x;
                penPosition.prevY = penPosition.y;
                
                // Calculate new position with grid-like movement
                // Decide whether to move horizontally or vertically with some randomness
                const moveHorizontal = Math.random() < 0.5;
                
                if (moveHorizontal) {
                    // Move horizontally with some randomness
                    const direction = Math.random() < 0.5 ? -1 : 1;
                    penPosition.x += direction * (10 + musicEnergy * 20) * deltaTime * 20;
                } else {
                    // Move vertically with some randomness
                    const direction = Math.random() < 0.5 ? -1 : 1;
                    penPosition.y += direction * (10 + musicEnergy * 20) * deltaTime * 20;
                }
                
                // Add some random influence for organic feel
                penPosition.x += (Math.random() - 0.5) * 2 * bassRange * noiseFactor;
                penPosition.y += (Math.random() - 0.5) * 2 * bassRange * noiseFactor;
                
                // Keep the pen within canvas bounds
                if (penPosition.x < 0) penPosition.x = 2;
                if (penPosition.x > canvas.width) penPosition.x = canvas.width - 2;
                if (penPosition.y < 0) penPosition.y = 2;
                if (penPosition.y > canvas.height) penPosition.y = canvas.height - 2;
                
                // Update grid position
                penPosition.gridX = Math.floor(penPosition.x / gridSize);
                penPosition.gridY = Math.floor(penPosition.y / gridSize);
                
                // Find current grid cell index
                const currentCellIndex = penPosition.gridY * gridCols + penPosition.gridX;
                if (currentCellIndex >= 0 && currentCellIndex < gridCells.length) {
                    // Mark cell as active
                    gridCells[currentCellIndex].active = true;
                    gridCells[currentCellIndex].lastActive = currentTime;
                }
                
                // Only draw if the pen has moved a minimum distance
                const distance = Math.sqrt(
                    Math.pow(penPosition.x - penPosition.prevX, 2) + 
                    Math.pow(penPosition.y - penPosition.prevY, 2)
                );
                
                if (distance > 0.2) {
                    // Set up line style for a pen-like appearance
                    ctx.strokeStyle = '#222222'; // Black pen color
                    
                    // Vary line width based on music energy and randomness
                    // Sometimes very thin, sometimes thicker
                    const lineWidthVariation = Math.random() < 0.7 ? 0.5 : 1.5 + bassRange * 2;
                    ctx.lineWidth = lineWidthVariation;
                    
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    
                    // Set opacity based on music energy
                    ctx.globalAlpha = 0.7 + musicEnergy * 0.3;
                    
                    // Decide whether to draw a straight line or a curve
                    // Higher chance of straight lines to match the grid-like structure
                    const straightLineChance = 0.7 + (musicEnergy * 0.1);
                    
                    if (Math.random() < straightLineChance) {
                        // Draw a straight line
                        ctx.beginPath();
                        ctx.moveTo(penPosition.prevX, penPosition.prevY);
                        ctx.lineTo(penPosition.x, penPosition.y);
                        ctx.stroke();
                    } else {
                        // Draw a curved line
                        ctx.beginPath();
                        ctx.moveTo(penPosition.prevX, penPosition.prevY);
                        
                        // Control point for the curve
                        const controlX = penPosition.prevX + (penPosition.x - penPosition.prevX) * 0.5 + 
                            (Math.random() - 0.5) * 20;
                        const controlY = penPosition.prevY + (penPosition.y - penPosition.prevY) * 0.5 + 
                            (Math.random() - 0.5) * 20;
                        
                        ctx.quadraticCurveTo(controlX, controlY, penPosition.x, penPosition.y);
                        ctx.stroke();
                    }
                    
                    // Occasionally create filled shapes
                    if (Math.random() < 0.01 + (musicEnergy * 0.02)) {
                        // Create a filled shape
                        const shapeType = Math.random();
                        
                        if (shapeType < 0.5) {
                            // Create a filled rectangle or diamond
                            const width = 10 + Math.random() * 40;
                            const height = 10 + Math.random() * 40;
                            
                            ctx.fillStyle = '#222222';
                            ctx.globalAlpha = 0.7 + Math.random() * 0.3;
                            
                            if (Math.random() < 0.5) {
                                // Rectangle
                                ctx.fillRect(
                                    penPosition.x - width/2, 
                                    penPosition.y - height/2, 
                                    width, 
                                    height
                                );
                            } else {
                                // Diamond
                                ctx.beginPath();
                                ctx.moveTo(penPosition.x, penPosition.y - height/2);
                                ctx.lineTo(penPosition.x + width/2, penPosition.y);
                                ctx.lineTo(penPosition.x, penPosition.y + height/2);
                                ctx.lineTo(penPosition.x - width/2, penPosition.y);
                                ctx.closePath();
                                ctx.fill();
                            }
                            
                            // Add to filled areas
                            filledAreas.push({
                                x: penPosition.x,
                                y: penPosition.y,
                                width: width,
                                height: height,
                                type: shapeType < 0.5 ? 'rect' : 'diamond'
                            });
                        } else {
                            // Create an irregular shape
                            const points = 3 + Math.floor(Math.random() * 4); // 3-6 points
                            const radius = 10 + Math.random() * 30;
                            
                            ctx.fillStyle = '#222222';
                            ctx.globalAlpha = 0.7 + Math.random() * 0.3;
                            
                            ctx.beginPath();
                            
                            for (let i = 0; i < points; i++) {
                                const angle = (i / points) * Math.PI * 2;
                                const pointRadius = radius * (0.7 + Math.random() * 0.6);
                                const x = penPosition.x + Math.cos(angle) * pointRadius;
                                const y = penPosition.y + Math.sin(angle) * pointRadius;
                                
                                if (i === 0) {
                                    ctx.moveTo(x, y);
                                } else {
                                    ctx.lineTo(x, y);
                                }
                            }
                            
                            ctx.closePath();
                            ctx.fill();
                            
                            // Add to filled areas
                            filledAreas.push({
                                x: penPosition.x,
                                y: penPosition.y,
                                radius: radius,
                                points: points,
                                type: 'irregular'
                            });
                        }
                    }
                }
                
                // Occasionally draw grid lines
                if (Math.random() < 0.0005 + (musicEnergy * 0.001)) {
                  ctx.strokeStyle = '#222222';
                  ctx.lineWidth = 0.5 + Math.random() * 1;
                  ctx.globalAlpha = 0.3 + Math.random() * 0.4;
                  
                  // Decide whether to draw horizontal or vertical line
                  if (Math.random() < 0.5) {
                  // Horizontal line
                  const y = Math.random() * canvas.height;
                  ctx.beginPath();
                  ctx.moveTo(0, y);
                  ctx.lineTo(canvas.width, y);
                  ctx.stroke();
                  } else {
                  // Vertical line
                  const x = Math.random() * canvas.width;
                  ctx.beginPath();
                  ctx.moveTo(x, 0);
                  ctx.lineTo(x, canvas.height);
                  ctx.stroke();
                  }
                }
                
                // Draw audio timeline in bottom right corner
                const isMobileTimeline = window.innerWidth < 768;
                const timelineWidth = isMobileTimeline ? 120 : 200;
                const timelineHeight = 2;
                const timelinePadding = 20;
                const timelineY = canvas.height - timelinePadding - 5;
                
                // Calculate progress
                const progress = audio.currentTime / audio.duration;
                
                // Draw timeline background
                ctx.globalAlpha = 0.3;
                ctx.strokeStyle = '#222222';
                ctx.lineWidth = timelineHeight;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(canvas.width - timelinePadding - timelineWidth, timelineY);
                ctx.lineTo(canvas.width - timelinePadding, timelineY);
                ctx.stroke();
                
                // Draw progress
                ctx.globalAlpha = 0.85;
                ctx.beginPath();
                ctx.moveTo(canvas.width - timelinePadding - timelineWidth, timelineY);
                ctx.lineTo(canvas.width - timelinePadding - timelineWidth + (timelineWidth * progress), timelineY);
                ctx.stroke();
                
                // Keep drawing
                animationRef.current = requestAnimationFrame(draw);
            }
            
            // Start the animation
            draw();
        }).catch(error => {
            console.error('Audio play error:', error);
        });
    };

    // Create iOS-specific styles
    const getPlayButtonStyles = () => {
        const baseStyles = {
            zIndex: 1000, // Ensure it's above everything else
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.3s ease'
        };
        
        // Add iOS-specific styles
        if (isIOS()) {
            return {
                ...baseStyles,
                // iOS needs these additional styles to ensure visibility
                WebkitTransform: 'translate(-50%, -50%)', // Explicit webkit transform
                WebkitBackfaceVisibility: 'visible', // Force visibility
                backfaceVisibility: 'visible',
                WebkitPerspective: 1000,
                perspective: 1000,
                pointerEvents: 'auto' // Ensure touch events work
            };
        }
        
        return baseStyles;
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <canvas ref={canvasRef}></canvas>
            {!audioPlaying && (
                <div 
                    onClick={startAudio}
                    style={getPlayButtonStyles()}
                >
                    {/* Canvas-drawn play button */}
                    <div 
                        ref={playButtonRef}
                        style={{
                            width: window.innerWidth < 768 ? '100px' : '120px',
                            height: window.innerWidth < 768 ? '100px' : '120px',
                            position: 'relative',
                            marginBottom: '15px',
                        }}
                    >
                        <canvas 
                            ref={playCanvasRef}
                            width={window.innerWidth < 768 ? 100 : 120}
                            height={window.innerWidth < 768 ? 100 : 120}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CanvasComponent;
